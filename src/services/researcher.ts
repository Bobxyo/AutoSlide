import { GoogleGenAI } from "@google/genai";

async function pollForReport(baseUrl: string, topic: string): Promise<string> {
    const maxAttempts = 120; // 10 minutes (5s * 120)
    const delay = 5000;
    
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const filesRes = await fetch(`${baseUrl}/files/`);
            if (filesRes.ok) {
                const files = await filesRes.json();
                let filenames: string[] = [];
                if (Array.isArray(files)) {
                    filenames = files.map(f => typeof f === 'string' ? f : (f.name || f.filename || ''));
                } else if (typeof files === 'object' && files !== null) {
                    const filesArray = files.files || files.data || [];
                    filenames = filesArray.map((f: any) => typeof f === 'string' ? f : (f.name || f.filename || ''));
                }
                
                const mdFiles = filenames.filter(f => f.endsWith('.md') && f.includes('task_'));
                mdFiles.sort().reverse(); // Try newest first
                
                for (const file of mdFiles) {
                    const topicWords = topic.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2);
                    const fileLower = file.toLowerCase();
                    const matchesTopic = topicWords.length === 0 || topicWords.some(w => fileLower.includes(w));
                    
                    if (matchesTopic) {
                        const taskIdMatch = file.match(/task_([a-zA-Z0-9]+)/);
                        const taskId = taskIdMatch ? taskIdMatch[1] : '';
                        
                        const pathsToTry = [
                            `${baseUrl}/${file}`,
                            `${baseUrl}/outputs/${file}`,
                            `${baseUrl}/files/${file}`
                        ];
                        
                        if (taskId) {
                            pathsToTry.push(`${baseUrl}/api/reports/${taskId}`);
                            pathsToTry.push(`${baseUrl}/report/${taskId}`);
                        }
                        
                        for (const path of pathsToTry) {
                            try {
                                const contentRes = await fetch(path);
                                if (contentRes.ok) {
                                    const contentType = contentRes.headers.get("content-type") || "";
                                    let text = "";
                                    if (contentType.includes("application/json")) {
                                        const data = await contentRes.json();
                                        text = data.report || data.output || data.content || JSON.stringify(data);
                                    } else {
                                        text = await contentRes.text();
                                    }
                                    
                                    if (typeof text !== 'string') text = JSON.stringify(text);
                                    
                                    if (text && text.length > 200) {
                                        return text;
                                    }
                                }
                            } catch (e) {
                                // Ignore path fetch errors
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("Polling error:", e);
        }
        
        await new Promise(r => setTimeout(r, delay));
    }
    throw new Error("Polling timed out. Report file not found.");
}

export async function runResearch(topic: string, endpoint: string): Promise<string> {
  // Try to call local GPT Researcher if URL is provided and not empty
  if (endpoint && endpoint.trim() !== "") {
    try {
      const baseUrl = new URL(endpoint).origin;
      
      const postPromise = async () => {
          const res = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                task: topic, 
                report_type: "research_report",
                report_source: "web",
                tone: "Objective",
                repo_name: "autoslide_pro",
                branch_name: "main"
              })
          });
          
          if (!res.ok) {
              let errorDetails = "";
              try { errorDetails = JSON.stringify(await res.json()); } catch (e) {}
              throw new Error(`HTTP error! status: ${res.status}. Details: ${errorDetails}`);
          }
          
          const contentType = res.headers.get("content-type") || "";
          let text = "";
          if (contentType.includes("application/json")) {
              const data = await res.json();
              text = data.report || data.output || data.content || JSON.stringify(data);
          } else {
              text = await res.text();
          }
          
          if (typeof text !== 'string') text = JSON.stringify(text);
          
          // If response is too short, it might just be an acknowledgment (e.g. {"status": "started"})
          if (!text || text.trim() === "" || text.length < 150) {
              throw new Error("Response too short, relying on polling.");
          }
          return text;
      };
      
      const pollPromise = async () => {
          await new Promise(r => setTimeout(r, 5000)); // Wait 5s before first poll
          return await pollForReport(baseUrl, topic);
      };
      
      // Use Promise.any to return whichever succeeds first (direct response or polled file)
      const report = await Promise.any([postPromise(), pollPromise()]);
      return report;
    } catch (e) {
      console.error("GPT Researcher Error:", e);
      throw new Error(`Failed to generate or retrieve report from GPT Researcher. Check console for details.`);
    }
  }
  
  // Fallback to Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a comprehensive, professional research report on the following topic: "${topic}". 
    Include an introduction, key findings, detailed analysis, and a conclusion. 
    Format as Markdown.`,
  });
  
  return response.text || "Failed to generate report.";
}
