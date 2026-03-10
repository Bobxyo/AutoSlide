import { GoogleGenAI, Type } from "@google/genai";
import { AppConfig, Presentation } from "../types";

// Helper function to clean markdown code blocks from LLM responses before parsing
function parseLLMJSON(text: string): any {
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  return JSON.parse(cleanText.trim());
}

export async function generatePresentation(
  report: string,
  config: AppConfig
): Promise<Presentation> {
  if (config.llmProvider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the following research report, generate a presentation. 
      Extract the key points into slides. 
      For each slide, provide a title, bullet points, a layout type ('title', 'content', 'image-right', 'image-left', 'quote'), a suggested prompt for an image placeholder if applicable, and detailed speaker notes.
      
      Report:
      ${report}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.ARRAY, items: { type: Type.STRING } },
                  layout: { type: Type.STRING, description: "Must be one of: 'title', 'content', 'image-right', 'image-left', 'quote'" },
                  imagePlaceholder: {
                    type: Type.OBJECT,
                    properties: {
                      suggestedPrompt: { type: Type.STRING }
                    }
                  },
                  speakerNotes: { type: Type.STRING }
                },
                required: ["id", "title", "content", "layout", "speakerNotes"]
              }
            }
          },
          required: ["title", "slides"]
        }
      }
    });
    
    return parseLLMJSON(response.text || "{}");
  } else {
    // OpenAI compatible
    const res = await fetch(`${config.openaiEndpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: config.openaiModel || "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert presentation creator. Output JSON matching the requested schema."
          },
          {
            role: "user",
            content: `Based on the following research report, generate a presentation. 
            Extract the key points into slides. 
            For each slide, provide a title, bullet points, a layout type ('title', 'content', 'image-right', 'image-left', 'quote'), a suggested prompt for an image placeholder if applicable, and detailed speaker notes.
            
            Report:
            ${report}`
          }
        ],
        response_format: { type: "json_object" }
      })
    });
    
    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.statusText}`);
    }
    
    const data = await res.json();
    return parseLLMJSON(data.choices[0].message.content);
  }
}

export async function generateImage(prompt: string, config: AppConfig): Promise<string> {
  if (config.imageProvider === 'custom') {
    const res = await fetch(config.imageEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.imageApiKey ? { "Authorization": `Bearer ${config.imageApiKey}` } : {})
      },
      body: JSON.stringify({
        prompt: prompt,
        model: config.imageModel,
        width: Number(config.imageWidth),
        height: Number(config.imageHeight),
        num_steps: Number(config.imageSteps),
        guidance: Number(config.imageGuidance)
      })
    });
    
    if (!res.ok) {
      throw new Error(`Custom Image API error: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    // Handle various possible response formats
    if (data.image) return data.image.startsWith('http') || data.image.startsWith('data:') ? data.image : `data:image/png;base64,${data.image}`;
    if (data.url) return data.url;
    if (data.data && data.data[0] && data.data[0].url) return data.data[0].url;
    if (data.data && data.data[0] && data.data[0].b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
    
    // If the response itself is a string (e.g. direct URL)
    if (typeof data === 'string') return data;
    
    throw new Error("Unknown response format from custom image API");
  } else if (config.imageProvider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to generate image with Gemini");
  } else {
    // OpenAI compatible DALL-E
    const res = await fetch(`${config.openaiEndpoint}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });
    
    if (!res.ok) {
      throw new Error(`OpenAI Image API error: ${res.statusText}`);
    }
    
    const data = await res.json();
    return `data:image/png;base64,${data.data[0].b64_json}`;
  }
}
