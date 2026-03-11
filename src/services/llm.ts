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
  
  try {
    const parsed = JSON.parse(cleanText.trim());
    
    // If it's an array, assume it's the slides array directly
    if (Array.isArray(parsed)) {
      return {
        title: "Generated Presentation",
        slides: parsed
      };
    }
    
    // Sometimes LLMs wrap the response in a "presentation" key
    if (parsed.presentation && parsed.presentation.slides) {
      return parsed.presentation;
    }
    // Sometimes they wrap it in a "slides" key but missing title
    if (parsed.slides && !parsed.title) {
      parsed.title = "Generated Presentation";
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse LLM JSON:", cleanText);
    throw new Error("Failed to parse presentation data from AI. Please try again.");
  }
}

export async function generatePresentation(
  report: string,
  config: AppConfig
): Promise<Presentation> {
  const prompt = `Based on the following research report, generate a highly professional, visually appealing presentation. 
Extract the key points into slides. 
For each slide, provide:
- A compelling 'title'
- 'content': An array of detailed bullet points (MUST NOT BE EMPTY).
- 'layout': Choose the best layout from: 'title', 'content', 'image-right', 'image-left', 'quote', 'chart'.
- 'chartType': If layout is 'chart', choose the best type from: 'bar', 'line', 'pie', 'radar', 'area'.
- 'imagePlaceholder': If layout is 'image-right' or 'image-left', provide a highly descriptive 'suggestedPrompt' for an AI image generator.
- 'chartData': If layout is 'chart', provide an array of objects with 'name' and 'value' properties representing data from the report.
- 'speakerNotes': MUST be a highly detailed, verbatim speech script (逐字稿). It should be long enough to cover 1-2 minutes of speaking per slide, explaining the concepts in detail as if presenting to a live audience without any prior preparation. Include transitions between slides.

Report:
${report}`;

  if (config.llmProvider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
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
                  layout: { type: Type.STRING, description: "Must be one of: 'title', 'content', 'image-right', 'image-left', 'quote', 'chart'" },
                  chartType: { type: Type.STRING, description: "Must be one of: 'bar', 'line', 'pie', 'radar', 'area'" },
                  imagePlaceholder: {
                    type: Type.OBJECT,
                    properties: {
                      suggestedPrompt: { type: Type.STRING }
                    }
                  },
                  chartData: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        value: { type: Type.NUMBER }
                      }
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
            content: prompt
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

export async function aiPolishText(text: string, config: AppConfig): Promise<string> {
  const prompt = `Please polish the following text to make it more professional, concise, and suitable for a presentation slide. Return ONLY the polished text, without any quotes or explanations.\n\nText to polish:\n${text}`;

  if (config.llmProvider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || text;
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
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    if (!res.ok) throw new Error(`OpenAI API error: ${res.statusText}`);
    const data = await res.json();
    return data.choices[0].message.content || text;
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
      throw new Error(`Custom Image API error (404 Not Found at ${config.imageEndpoint}): ${res.statusText}`);
    }
    
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
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
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY });
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
    const endpoint = config.imageEndpoint ? config.imageEndpoint.replace(/\/$/, '') : 'https://api.openai.com/v1';
    const res = await fetch(`${endpoint}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.imageApiKey || config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: config.imageModel || "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });
    
    if (!res.ok) {
      throw new Error(`OpenAI Image API error: ${res.statusText}`);
    }
    
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    const data = await res.json();
    if (data.data && data.data[0] && data.data[0].b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    } else if (data.data && data.data[0] && data.data[0].url) {
      return data.data[0].url;
    }
    throw new Error("Unknown response format from OpenAI compatible API");
  }
}
