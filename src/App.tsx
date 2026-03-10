import React, { useState, useEffect } from 'react';
import { Settings, FileText, Presentation as PresentationIcon, Download, Play } from 'lucide-react';
import { AppConfig, Presentation, Slide } from './types';
import { runResearch } from './services/researcher';
import { generatePresentation } from './services/llm';
import { ConfigPanel } from './components/ConfigPanel';
import { SlideEditor } from './components/SlideEditor';
import { exportToPPTX } from './services/export';
import ReactMarkdown from 'react-markdown';

const defaultConfig: AppConfig = {
  gptResearcherEndpoint: import.meta.env.VITE_GPT_RESEARCHER_ENDPOINT || 'http://localhost:8000/report/',
  llmProvider: 'gemini',
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  openaiEndpoint: import.meta.env.VITE_OPENAI_ENDPOINT || 'https://api.openai.com/v1',
  openaiModel: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o',
  imageProvider: 'gemini',
  imageEndpoint: import.meta.env.VITE_IMAGE_ENDPOINT || '',
  imageApiKey: import.meta.env.VITE_IMAGE_API_KEY || '',
  imageModel: import.meta.env.VITE_IMAGE_MODEL || 'flux-2-dev',
  imageWidth: 1536,
  imageHeight: 2048,
  imageSteps: 30,
  imageGuidance: 7.5
};

export default function App() {
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('autoslide_config');
    if (saved) {
      try {
        return { ...defaultConfig, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }
    return defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem('autoslide_config', JSON.stringify(config));
  }, [config]);

  const [topic, setTopic] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      setLoadingMsg('Generating research report...');
      const generatedReport = await runResearch(topic, config.gptResearcherEndpoint);
      setReport(generatedReport);

      setLoadingMsg('Converting report to presentation...');
      const generatedPresentation = await generatePresentation(generatedReport, config);
      setPresentation(generatedPresentation);
    } catch (e) {
      console.error(e);
      alert(`Error generating presentation: ${e instanceof Error ? e.message : 'Check console for details.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!presentation) return;
    setLoading(true);
    setLoadingMsg('Exporting to PPTX...');
    try {
      await exportToPPTX(presentation);
    } catch (e) {
      console.error(e);
      alert('Error exporting presentation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <PresentationIcon className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-semibold tracking-tight">AutoSlide Pro</h1>
        </div>
        <div className="flex items-center gap-4">
          {presentation && (
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export PPTX
            </button>
          )}
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {showConfig && (
          <div className="w-80 border-r border-neutral-200 bg-white p-6 overflow-y-auto">
            <ConfigPanel config={config} setConfig={setConfig} />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {!presentation ? (
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 mb-8">
                <h2 className="text-2xl font-semibold mb-2">Create a new presentation</h2>
                <p className="text-neutral-500 mb-6">Enter a research topic to automatically generate a comprehensive report and slide deck.</p>
                
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., The Future of Quantum Computing"
                    className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={loading || !topic}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                    Generate
                  </button>
                </div>
                {loading && (
                  <p className="text-sm text-neutral-500 mt-4 animate-pulse">{loadingMsg}</p>
                )}
              </div>

              {report && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-100">
                    <FileText className="w-5 h-5 text-neutral-400" />
                    <h3 className="text-lg font-medium">Research Report</h3>
                  </div>
                  <div className="prose prose-neutral max-w-none">
                    <ReactMarkdown>{typeof report === 'string' ? report : JSON.stringify(report)}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <SlideEditor presentation={presentation} setPresentation={setPresentation} config={config} />
          )}
        </div>
      </main>
    </div>
  );
}
