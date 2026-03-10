import React, { useState, useEffect } from 'react';
import { Settings, FileText, Presentation as PresentationIcon, Download, Play, History, Trash2, Plus } from 'lucide-react';
import { AppConfig, Presentation, Slide, HistoryTask } from './types';
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

import { GoogleOAuthProvider } from '@react-oauth/google';

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

  const [history, setHistory] = useState<HistoryTask[]>(() => {
    const saved = localStorage.getItem('autoslide_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved history', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('autoslide_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('autoslide_history', JSON.stringify(history));
  }, [history]);

  const [topic, setTopic] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    
    const newTaskId = Date.now().toString();
    const newTask: HistoryTask = {
      id: newTaskId,
      topic,
      createdAt: new Date().toISOString(),
      status: 'researching'
    };
    
    setHistory(prev => [newTask, ...prev]);
    setLoading(true);
    setReport(null);
    setPresentation(null);
    setShowHistory(false);
    setShowConfig(false);

    try {
      setLoadingMsg('Starting research...');
      const generatedReport = await runResearch(topic, config.gptResearcherEndpoint, (msg) => {
        setLoadingMsg(msg);
      });
      setReport(generatedReport);
      
      setHistory(prev => prev.map(t => t.id === newTaskId ? { ...t, status: 'generating_ppt', report: generatedReport } : t));

      setLoadingMsg('Converting report to presentation...');
      const generatedPresentation = await generatePresentation(generatedReport, config);
      setPresentation(generatedPresentation);
      
      setHistory(prev => prev.map(t => t.id === newTaskId ? { ...t, status: 'done', presentation: generatedPresentation } : t));
    } catch (e) {
      console.error(e);
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      alert(`Error generating presentation: ${errorMsg}`);
      setHistory(prev => prev.map(t => t.id === newTaskId ? { ...t, status: 'error', error: errorMsg } : t));
    } finally {
      setLoading(false);
      setLoadingMsg('');
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
      setLoadingMsg('');
    }
  };

  const loadHistoryTask = (task: HistoryTask) => {
    setTopic(task.topic);
    setReport(task.report || null);
    setPresentation(task.presentation || null);
    setShowHistory(false);
  };

  const deleteHistoryTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(t => t.id !== id));
  };

  const startNew = () => {
    setTopic('');
    setReport(null);
    setPresentation(null);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={startNew}>
          <PresentationIcon className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-semibold tracking-tight">AutoSlide Pro</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setShowHistory(!showHistory); setShowConfig(false); }}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${showHistory ? 'bg-indigo-50 text-indigo-700' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button 
            onClick={() => { setShowConfig(!showConfig); setShowHistory(false); }}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${showConfig ? 'bg-indigo-50 text-indigo-700' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {showConfig && (
          <div className="w-80 border-r border-neutral-200 bg-white p-6 overflow-y-auto">
            <ConfigPanel config={config} setConfig={setConfig} />
          </div>
        )}

        {showHistory && (
          <div className="w-80 border-r border-neutral-200 bg-white p-6 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Recent Tasks</h2>
              <button onClick={startNew} className="p-1 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">No history yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => loadHistoryTask(task)}
                    className="p-3 border border-neutral-200 rounded-lg hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-sm line-clamp-2 pr-4">{task.topic}</h3>
                      <button 
                        onClick={(e) => deleteHistoryTask(task.id, e)}
                        className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-xs text-neutral-500">
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        task.status === 'done' ? 'bg-green-100 text-green-700' : 
                        task.status === 'error' ? 'bg-red-100 text-red-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-indigo-700 font-medium">{loadingMsg}</p>
                  </div>
                )}
              </div>

              {report && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-neutral-400" />
                      <h3 className="text-lg font-medium">Research Report</h3>
                    </div>
                    <button 
                      onClick={async () => {
                        if (!topic || !report) return;
                        setLoading(true);
                        setLoadingMsg('Converting report to presentation...');
                        try {
                          const generatedPresentation = await generatePresentation(report, config);
                          setPresentation(generatedPresentation);
                          
                          // Update history
                          setHistory(prev => prev.map(t => 
                            (t.topic === topic && t.report === report) 
                              ? { ...t, status: 'done', presentation: generatedPresentation } 
                              : t
                          ));
                        } catch (e) {
                          console.error(e);
                          alert(`Error generating presentation: ${e instanceof Error ? e.message : 'Unknown error'}`);
                        } finally {
                          setLoading(false);
                          setLoadingMsg('');
                        }
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      {loading ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <PresentationIcon className="w-4 h-4" />}
                      Generate Slides from Report
                    </button>
                  </div>
                  <div className="prose prose-neutral max-w-none">
                    <ReactMarkdown>{typeof report === 'string' ? report : JSON.stringify(report)}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            config.googleClientId ? (
              <GoogleOAuthProvider clientId={config.googleClientId}>
                <SlideEditor presentation={presentation} setPresentation={setPresentation} config={config} />
              </GoogleOAuthProvider>
            ) : (
              <SlideEditor presentation={presentation} setPresentation={setPresentation} config={config} />
            )
          )}
        </div>
      </main>
    </div>
  );
}
