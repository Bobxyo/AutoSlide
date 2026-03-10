import { GoogleGenAI } from "@google/genai";

export async function runResearch(
  topic: string,
  endpoint: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  if (endpoint && endpoint.trim() !== "") {
    try {
      const baseUrl = new URL(endpoint).origin;
      onProgress?.("Submitting research task to GPT Researcher...");

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
          let err = "";
          try { err = JSON.stringify(await res.json()); } catch(e) {}
          throw new Error(`HTTP ${res.status}: ${err}`);
      }

      const data = await res.json();
      let taskId = data.task_id || data.id || "";

      // If report is already in response (synchronous)
      if (data.report && data.report.length > 200) return data.report;
      if (data.output && data.output.length > 200) return data.output;

      if (!taskId) {
          const textData = JSON.stringify(data);
          const match = textData.match(/task_([a-zA-Z0-9]+)/);
          if (match) taskId = match[1];
      }

      onProgress?.(`Task submitted (ID: ${taskId || 'unknown'}). Waiting 3 minutes for research to complete...`);

      // Wait 3 minutes (180,000 ms)
      await new Promise(r => setTimeout(r, 180000));

      const maxAttempts = 40; // 20 minutes total polling
      const delay = 30000; // 30 seconds

      for (let i = 0; i < maxAttempts; i++) {
          onProgress?.(`Polling for report... (Attempt ${i + 1}/${maxAttempts})`);
          try {
              // 1. Try specific task endpoints if we have a task ID
              if (taskId) {
                  const paths = [
                      `${baseUrl}/api/reports/${taskId}`,
                      `${baseUrl}/report/${taskId}`,
                      `${baseUrl}/outputs/${taskId}.md`,
                      `${baseUrl}/files/${taskId}.md`,
                      `${baseUrl}/outputs/task_${taskId}.md`,
                      `${baseUrl}/files/task_${taskId}.md`
                  ];
                  for (const path of paths) {
                      try {
                          const checkRes = await fetch(path);
                          if (checkRes.ok) {
                              const ct = checkRes.headers.get("content-type") || "";
                              let text = "";
                              if (ct.includes("json")) {
                                  const j = await checkRes.json();
                                  text = j.report || j.output || j.content || JSON.stringify(j);
                              } else {
                                  text = await checkRes.text();
                              }
                              if (text && text.length > 200) return text;
                          }
                      } catch (e) {}
                  }
              }

              // 2. Fallback: check /files/
              const filesRes = await fetch(`${baseUrl}/files/`);
              if (filesRes.ok) {
                  const filesData = await filesRes.json();
                  let filenames: string[] = [];
                  if (Array.isArray(filesData)) {
                      filenames = filesData.map(f => typeof f === 'string' ? f : (f.name || f.filename || ''));
                  } else if (filesData && (filesData.files || filesData.data)) {
                      const arr = filesData.files || filesData.data;
                      filenames = arr.map((f: any) => typeof f === 'string' ? f : (f.name || f.filename || ''));
                  }

                  const mdFiles = filenames.filter(f => f.endsWith('.md'));
                  mdFiles.sort().reverse();

                  for (const file of mdFiles) {
                      let isMatch = false;
                      if (taskId && file.includes(taskId)) isMatch = true;
                      else if (!taskId) {
                          const topicWords = topic.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2);
                          isMatch = topicWords.length === 0 || topicWords.some(w => file.toLowerCase().includes(w));
                      }

                      if (isMatch) {
                          const pathsToTry = [
                              `${baseUrl}/${file}`,
                              `${baseUrl}/outputs/${file}`,
                              `${baseUrl}/files/${file}`
                          ];
                          for (const path of pathsToTry) {
                              try {
                                  const contentRes = await fetch(path);
                                  if (contentRes.ok) {
                                      const text = await contentRes.text();
                                      if (text.length > 200) return text;
                                  }
                              } catch (e) {}
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
    } catch (e) {
      console.error("GPT Researcher Error:", e);
      throw new Error(`Failed to generate or retrieve report from GPT Researcher: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Fallback to Gemini
  onProgress?.("Using Gemini fallback for research...");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a comprehensive, professional research report on the following topic: "${topic}". 
    Include an introduction, key findings, detailed analysis, and a conclusion. 
    Format as Markdown.`,
  });
  
  return response.text || "Failed to generate report.";
}
