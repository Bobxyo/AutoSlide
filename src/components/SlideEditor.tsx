import React, { useState, useEffect, useRef } from 'react';
import { Presentation, Slide, AppConfig } from '../types';
import { cn } from '../lib/utils';
import { ImagePlus, Loader2, MessageSquareText, Download, LayoutTemplate, Presentation as PresentationIcon, Edit3 } from 'lucide-react';
import { generateImage, aiPolishText } from '../services/llm';
import { exportToPPTX } from '../services/export';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';
import { useGoogleLogin } from '@react-oauth/google';
import { exportToGoogleSlides } from '../services/googleSlides';

const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff', '#312e81', '#4338ca'];

interface SlideEditorProps {
  presentation: Presentation;
  setPresentation: React.Dispatch<React.SetStateAction<Presentation | null>>;
  config: AppConfig;
}

export function SlideEditor({ presentation, setPresentation, config }: SlideEditorProps) {
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [exporting, setExporting] = useState(false);
  
  // Safety check in case LLM returns invalid format
  const slides = presentation?.slides || [];
  const activeSlide = slides[activeSlideIdx];

  const updateSlide = (updatedSlide: Slide) => {
    const newSlides = [...slides];
    newSlides[activeSlideIdx] = updatedSlide;
    setPresentation({ ...presentation, slides: newSlides });
  };

  const [exportingGoogle, setExportingGoogle] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setExportingGoogle(true);
      try {
        const url = await exportToGoogleSlides(presentation, tokenResponse.access_token);
        window.open(url, '_blank');
      } catch (e) {
        console.error(e);
        alert(`Error exporting to Google Slides: ${e instanceof Error ? e.message : 'Unknown error'}`);
      } finally {
        setExportingGoogle(false);
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      alert('Google Login failed. Please try again.');
    },
    scope: 'https://www.googleapis.com/auth/presentations',
  });

  const handleGoogleExport = () => {
    if (!config.googleClientId) {
      alert("Please configure your Google Client ID in the Settings panel first.");
      return;
    }
    login();
  };

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('modern');
  const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
  const [aiActionLoading, setAiActionLoading] = useState(false);

  const handleMouseUp = (e: React.MouseEvent) => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (text && text.length > 0) {
      const range = sel!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    } else {
      setSelection(null);
    }
  };

  const handleAiAction = async (action: 'polish' | 'chart' | 'image') => {
    if (!selection) return;
    setAiActionLoading(true);
    try {
      // For now, we will simulate the AI action or use a basic implementation
      // In a real app, this would call the LLM with the specific instruction
      if (action === 'polish') {
        const polished = await aiPolishText(selection.text, config);
        
        // We need to find where this text is in the slide and replace it
        // This is a simple string replacement which might be buggy if the text appears multiple times,
        // but it's a good starting point for a simple editor.
        let newSlide = { ...activeSlide };
        if (newSlide.title.includes(selection.text)) {
          newSlide.title = newSlide.title.replace(selection.text, polished);
        }
        
        if (Array.isArray(newSlide.content)) {
          newSlide.content = newSlide.content.map(c => 
            typeof c === 'string' ? c.replace(selection.text, polished) : c
          );
        } else if (typeof newSlide.content === 'string') {
          (newSlide as any).content = ((newSlide.content as any) as string).replace(selection.text, polished);
        }
        
        updateSlide(newSlide);
      } else if (action === 'chart') {
        updateSlide({
          ...activeSlide,
          layout: 'chart',
          chartType: 'bar',
          chartData: [
            { name: 'Item 1', value: 40 },
            { name: 'Item 2', value: 60 },
            { name: 'Item 3', value: 30 }
          ]
        });
      } else if (action === 'image') {
        updateSlide({
          ...activeSlide,
          layout: 'image-right',
          imagePlaceholder: { suggestedPrompt: `A professional illustration representing: ${selection.text}` }
        });
      }
    } catch (e) {
      console.error(e);
      alert('AI action failed.');
    } finally {
      setAiActionLoading(false);
      setSelection(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPPTX(presentation, selectedTheme, config);
    } catch (e) {
      console.error(e);
      alert('Error exporting presentation.');
    } finally {
      setExporting(false);
    }
  };

  if (!slides || slides.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <PresentationIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">Failed to generate slides</h2>
          <p className="text-neutral-500 max-w-md mx-auto">
            The AI model returned an invalid format. Please try generating the presentation again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Thumbnails Sidebar */}
      <div className="w-64 bg-neutral-100 border-r border-neutral-200 overflow-y-auto p-4 flex flex-col gap-4">
        {slides.map((slide, idx) => (
          <div 
            key={slide.id}
            onClick={() => setActiveSlideIdx(idx)}
            className={cn(
              "aspect-video bg-white rounded-lg shadow-sm border-2 cursor-pointer overflow-hidden relative group transition-all",
              activeSlideIdx === idx ? "border-indigo-500 ring-2 ring-indigo-200" : "border-transparent hover:border-neutral-300"
            )}
          >
            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded z-10">
              {idx + 1}
            </div>
            <ScaledSlide slide={slide} config={config} themeId={selectedTheme} interactive={false} />
          </div>
        ))}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-200/50">
        {/* Editor Toolbar */}
        <div className="h-14 bg-white border-b border-neutral-200 px-4 flex items-center justify-between">
          <div className="text-sm font-medium text-neutral-700">
            Slide {activeSlideIdx + 1} of {slides.length}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
            >
              <LayoutTemplate className="w-4 h-4" />
              Templates
            </button>
            <button 
              onClick={handleGoogleExport}
              disabled={exportingGoogle}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              {exportingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <PresentationIcon className="w-4 h-4" />}
              Google Slides
            </button>
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export PPTX
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4 md:p-8 flex items-center justify-center relative" onMouseUp={handleMouseUp}>
          <ScaledSlide slide={activeSlide} updateSlide={updateSlide} config={config} themeId={selectedTheme} interactive={true} />
          
          {selection && (
            <div 
              className="fixed z-50 bg-white shadow-xl border border-neutral-200 rounded-lg flex items-center p-1 gap-1 transform -translate-x-1/2 -translate-y-full"
              style={{ left: selection.x, top: selection.y - 10 }}
            >
              <button onClick={() => handleAiAction('polish')} disabled={aiActionLoading} className="px-3 py-1.5 hover:bg-neutral-100 rounded text-sm font-medium text-indigo-600 flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Polish
              </button>
              <div className="w-px h-4 bg-neutral-200 mx-1"></div>
              <button onClick={() => handleAiAction('chart')} disabled={aiActionLoading} className="px-3 py-1.5 hover:bg-neutral-100 rounded text-sm font-medium text-emerald-600 flex items-center gap-1">
                Make Chart
              </button>
              <div className="w-px h-4 bg-neutral-200 mx-1"></div>
              <button onClick={() => handleAiAction('image')} disabled={aiActionLoading} className="px-3 py-1.5 hover:bg-neutral-100 rounded text-sm font-medium text-blue-600 flex items-center gap-1">
                <ImagePlus className="w-3 h-3" /> Make Image
              </button>
            </div>
          )}
        </div>
        
        {/* Speaker Notes Panel */}
        <div className="h-48 bg-white border-t border-neutral-200 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2 text-neutral-600">
            <MessageSquareText className="w-4 h-4" />
            <span className="text-sm font-medium">Speaker Notes</span>
          </div>
          <textarea
            value={activeSlide.speakerNotes}
            onChange={(e) => updateSlide({ ...activeSlide, speakerNotes: e.target.value })}
            className="flex-1 w-full resize-none border-none focus:outline-none focus:ring-0 p-0 text-sm text-neutral-700 bg-transparent"
            placeholder="Click to add speaker notes..."
          />
        </div>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Template Theme</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-neutral-400 hover:text-neutral-600">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { id: 'modern', name: 'Modern Indigo', desc: 'Clean, professional design with indigo accents' },
                { id: 'dark', name: 'Dark Mode', desc: 'Sleek dark background with high contrast text' },
                { id: 'corporate', name: 'Corporate Blue', desc: 'Traditional business presentation style' },
                { id: 'creative', name: 'Creative Coral', desc: 'Vibrant and energetic design' }
              ].map(theme => (
                <div 
                  key={theme.id}
                  onClick={() => { setSelectedTheme(theme.id); setShowTemplateModal(false); }}
                  className={cn(
                    "p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-indigo-300",
                    selectedTheme === theme.id ? "border-indigo-500 bg-indigo-50" : "border-neutral-200"
                  )}
                >
                  <h4 className="font-medium text-neutral-900 mb-1">{theme.name}</h4>
                  <p className="text-sm text-neutral-500">{theme.desc}</p>
                </div>
              ))}
            </div>
            <div className="p-6 bg-neutral-50 border-t border-neutral-100 text-sm text-neutral-500">
              <p>Note: Custom PPTX file upload is not supported by the current export engine. Please select a theme above.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getLayoutConfig(config: AppConfig) {
  const isPortrait = config.orientation === 'portrait';
  let w = 1024, h = 576, margin = 48;
  
  if (config.pageSize === 'a4') {
    w = 1122; h = 794; margin = 76;
  } else if (config.pageSize === 'b5') {
    w = 945; h = 665; margin = 76;
  }
  
  if (isPortrait) {
    return { w: h, h: w, margin, isPortrait };
  }
  return { w, h, margin, isPortrait };
}

function ScaledSlide({ slide, updateSlide, config, themeId, interactive = true }: { slide: Slide, updateSlide?: (s: Slide) => void, config: AppConfig, themeId: string, interactive?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const layoutConfig = getLayoutConfig(config);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleX = width / layoutConfig.w;
        const scaleY = height / layoutConfig.h;
        setScale(Math.min(scaleX, scaleY));
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [layoutConfig.w, layoutConfig.h]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <div 
        style={{ 
          width: `${layoutConfig.w}px`, 
          height: `${layoutConfig.h}px`, 
          transform: `translate(-50%, -50%) scale(${scale})`,
          position: 'absolute',
          left: '50%',
          top: '50%',
          transformOrigin: 'center',
          pointerEvents: interactive ? 'auto' : 'none'
        }}
        className="bg-white shadow-sm"
      >
        <SlideCanvas slide={slide} updateSlide={updateSlide} config={config} themeId={themeId} interactive={interactive} />
      </div>
    </div>
  );
}

function SlideCanvas({ slide, updateSlide, config, themeId, interactive = true }: { slide: Slide, updateSlide?: (s: Slide) => void, config: AppConfig, themeId: string, interactive?: boolean }) {
  const [generatingImg, setGeneratingImg] = useState(false);

  const themes: Record<string, any> = {
    modern: { bg: '#F8FAFC', title: '#0F172A', text: '#334155', accent: '#4F46E5', accentBg: '#E0E7FF' },
    dark: { bg: '#0F172A', title: '#F8FAFC', text: '#CBD5E1', accent: '#818CF8', accentBg: '#1E293B' },
    corporate: { bg: '#FFFFFF', title: '#1E3A8A', text: '#475569', accent: '#2563EB', accentBg: '#DBEAFE' },
    creative: { bg: '#FFF1F2', title: '#881337', text: '#701A75', accent: '#E11D48', accentBg: '#FFE4E6' }
  };
  const theme = themes[themeId] || themes.modern;
  const layoutConfig = getLayoutConfig(config);
  const { isPortrait, margin } = layoutConfig;

  const handleGenerateImage = async (customPrompt?: string) => {
    const promptToUse = customPrompt || slide.imagePlaceholder?.suggestedPrompt;
    if (!promptToUse) {
      alert("Please provide a prompt for the image.");
      return;
    }
    setGeneratingImg(true);
    try {
      const url = await generateImage(promptToUse, config);
      if (updateSlide) {
        updateSlide({
          ...slide,
          imagePlaceholder: {
            ...slide.imagePlaceholder,
            suggestedPrompt: promptToUse,
            url
          }
        });
      }
    } catch (e) {
      console.error(e);
      alert(`Failed to generate image: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setGeneratingImg(false);
    }
  };

  const renderContent = () => {
    let contentArray: string[] = [];
    if (Array.isArray(slide.content)) {
      contentArray = slide.content.map(c => typeof c === 'string' ? c : JSON.stringify(c));
    } else if (typeof slide.content === 'string') {
      contentArray = [slide.content];
    } else if (slide.content) {
      contentArray = [JSON.stringify(slide.content)];
    }
    
    const title = slide.title || 'Untitled Slide';

    switch (slide.layout) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center relative overflow-hidden" style={{ backgroundColor: theme.bg, padding: margin }}>
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: theme.accent }}></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: theme.accent }}></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: theme.accent }}></div>
            
            <div className="relative z-10 max-w-4xl">
              <h1 className="text-6xl font-black mb-8 tracking-tight leading-tight" style={{ color: theme.title }}>{title}</h1>
              <div className="w-24 h-1.5 mx-auto mb-8 rounded-full" style={{ backgroundColor: theme.accent }}></div>
              <div className="text-2xl space-y-4 font-medium opacity-90" style={{ color: theme.text }}>
                {contentArray.map((c, i) => <p key={i}>{c}</p>)}
              </div>
            </div>
          </div>
        );
      case 'content':
        return (
          <div className="flex flex-col h-full relative" style={{ backgroundColor: theme.bg, padding: margin }}>
            <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: theme.accent }}></div>
            <div className="mb-10 pl-6">
              <h2 className="text-4xl font-bold tracking-tight" style={{ color: theme.title }}>{title}</h2>
            </div>
            <div className="flex-1 pl-6 grid grid-cols-1 gap-6 content-start">
              {contentArray.map((c, i) => (
                <div key={i} className="flex items-start gap-5 p-6 rounded-2xl shadow-sm border border-black/5" style={{ backgroundColor: theme.bg === '#0F172A' ? '#1E293B' : '#FFFFFF' }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: theme.accentBg, color: theme.accent }}>
                    {i + 1}
                  </div>
                  <p className="text-xl leading-relaxed pt-1" style={{ color: theme.text }}>{c}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'image-right':
        return (
          <div className={`flex ${isPortrait ? 'flex-col' : 'flex-row'} h-full`} style={{ backgroundColor: theme.bg, padding: margin }}>
            <div className={`${isPortrait ? 'w-full h-1/2 pb-6' : 'w-1/2 pr-12'} flex flex-col justify-center relative`}>
              <div className={`absolute ${isPortrait ? 'top-0 left-0' : 'top-12 left-0'} w-12 h-1.5 rounded-full`} style={{ backgroundColor: theme.accent }}></div>
              <h2 className={`text-4xl font-bold mb-10 ${isPortrait ? 'mt-4' : 'mt-8'} leading-tight`} style={{ color: theme.title }}>{title}</h2>
              <ul className="text-xl space-y-6 flex-1">
                {contentArray.map((c, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.accent }}></span>
                    <span className="leading-relaxed" style={{ color: theme.text }}>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${isPortrait ? 'w-full h-1/2 pt-6' : 'w-1/2 pl-6'}`}>
              <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative">
                <ImagePlaceholder 
                  placeholder={slide.imagePlaceholder} 
                  onGenerate={handleGenerateImage} 
                  loading={generatingImg} 
                  updateImage={(url) => updateSlide && updateSlide({ ...slide, imagePlaceholder: { ...slide.imagePlaceholder, suggestedPrompt: slide.imagePlaceholder?.suggestedPrompt || '', url } })}
                  interactive={interactive}
                />
              </div>
            </div>
          </div>
        );
      case 'image-left':
        return (
          <div className={`flex ${isPortrait ? 'flex-col' : 'flex-row'} h-full`} style={{ backgroundColor: theme.bg, padding: margin }}>
            <div className={`${isPortrait ? 'w-full h-1/2 pb-6' : 'w-1/2 pr-6'}`}>
              <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative">
                <ImagePlaceholder 
                  placeholder={slide.imagePlaceholder} 
                  onGenerate={handleGenerateImage} 
                  loading={generatingImg} 
                  updateImage={(url) => updateSlide && updateSlide({ ...slide, imagePlaceholder: { ...slide.imagePlaceholder, suggestedPrompt: slide.imagePlaceholder?.suggestedPrompt || '', url } })}
                  interactive={interactive}
                />
              </div>
            </div>
            <div className={`${isPortrait ? 'w-full h-1/2 pt-6' : 'w-1/2 pl-12'} flex flex-col justify-center relative`}>
              <div className={`absolute ${isPortrait ? 'top-6 left-12' : 'top-12 left-12'} w-12 h-1.5 rounded-full`} style={{ backgroundColor: theme.accent }}></div>
              <h2 className={`text-4xl font-bold mb-10 ${isPortrait ? 'mt-4' : 'mt-8'} leading-tight`} style={{ color: theme.title }}>{title}</h2>
              <ul className="text-xl space-y-6 flex-1">
                {contentArray.map((c, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.accent }}></span>
                    <span className="leading-relaxed" style={{ color: theme.text }}>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'quote':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center relative overflow-hidden" style={{ backgroundColor: theme.accent, padding: margin }}>
            <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            <div className="absolute -top-10 -left-10 text-[200px] font-serif leading-none opacity-20 text-white">"</div>
            <h2 className="text-2xl font-bold mb-12 uppercase tracking-[0.3em] text-white/80 relative z-10">{title}</h2>
            <blockquote className="text-4xl font-serif italic leading-relaxed text-white relative z-10">
              {contentArray.join(' ')}
            </blockquote>
            <div className="w-24 h-1 mt-12 rounded-full bg-white/30 relative z-10"></div>
          </div>
        );
      case 'chart':
        const hasData = slide.chartData && slide.chartData.length > 0;
        const chartBg = theme.bg === '#0F172A' ? '#1E293B' : '#FFFFFF';
        const chartTextColor = theme.bg === '#0F172A' ? '#CBD5E1' : '#334155';
        
        const renderChart = () => {
          if (!hasData) return null;
          const data = slide.chartData;
          switch (slide.chartType) {
            case 'pie':
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                      {data?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: chartBg, color: chartTextColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend wrapperStyle={{ color: chartTextColor }} />
                  </PieChart>
                </ResponsiveContainer>
              );
            case 'line':
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTextColor + '20'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: chartTextColor}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: chartTextColor}} />
                    <Tooltip cursor={{fill: chartTextColor + '10'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: chartBg, color: chartTextColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="value" stroke={theme.accent} strokeWidth={3} dot={{r: 4, fill: theme.accent}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              );
            case 'radar':
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke={chartTextColor + '20'} />
                    <PolarAngleAxis dataKey="name" tick={{fill: chartTextColor}} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{fill: chartTextColor}} />
                    <Radar name="Value" dataKey="value" stroke={theme.accent} fill={theme.accent} fillOpacity={0.5} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: chartBg, color: chartTextColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  </RadarChart>
                </ResponsiveContainer>
              );
            case 'area':
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTextColor + '20'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: chartTextColor}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: chartTextColor}} />
                    <Tooltip cursor={{fill: chartTextColor + '10'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: chartBg, color: chartTextColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="value" stroke={theme.accent} fill={theme.accent} fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              );
            case 'bar':
            default:
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTextColor + '20'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: chartTextColor}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: chartTextColor}} />
                    <Tooltip cursor={{fill: chartTextColor + '10'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: chartBg, color: chartTextColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="value" fill={theme.accent} radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {data?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={theme.accent} opacity={1 - (index * 0.15)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              );
          }
        };

        return (
          <div className="flex flex-col h-full" style={{ backgroundColor: theme.bg, padding: margin }}>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-3 h-12 rounded-full" style={{ backgroundColor: theme.accent }}></div>
              <h2 className="text-4xl font-bold tracking-tight" style={{ color: theme.title }}>{title}</h2>
            </div>
            <div className={`flex flex-1 ${isPortrait ? 'flex-col gap-6' : 'gap-10'}`}>
              <div className={`${isPortrait ? 'w-full h-2/5' : 'w-5/12'} flex flex-col justify-center`}>
                <ul className="text-xl space-y-6" style={{ color: theme.text }}>
                  {contentArray.map((c, i) => (
                    <li key={i} className="flex items-start gap-4 p-4 rounded-xl" style={{ backgroundColor: theme.accentBg + '40' }}>
                      <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.accent }}></span>
                      <span className="leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${isPortrait ? 'w-full h-3/5' : 'w-7/12'} flex items-center justify-center rounded-3xl shadow-lg border p-8`} style={{ backgroundColor: chartBg, borderColor: theme.accent + '20' }}>
                {hasData ? renderChart() : (
                  <div className="flex flex-col items-center" style={{ color: chartTextColor + '80' }}>
                    <Loader2 className="w-10 h-10 mb-3 opacity-50" />
                    <p className="text-lg">No chart data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col h-full relative" style={{ backgroundColor: theme.bg, padding: margin }}>
            <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: theme.accent }}></div>
            <div className="mb-10 pl-6">
              <h2 className="text-4xl font-bold tracking-tight" style={{ color: theme.title }}>{title}</h2>
            </div>
            <div className="flex-1 pl-6 grid grid-cols-1 gap-6 content-start">
              {contentArray.map((c, i) => (
                <div key={i} className="flex items-start gap-5 p-6 rounded-2xl shadow-sm border border-black/5" style={{ backgroundColor: theme.bg === '#0F172A' ? '#1E293B' : '#FFFFFF' }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: theme.accentBg, color: theme.accent }}>
                    {i + 1}
                  </div>
                  <p className="text-xl leading-relaxed pt-1" style={{ color: theme.text }}>{c}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full overflow-hidden relative" style={{ backgroundColor: theme.bg }}>
      {renderContent()}
    </div>
  );
}

function ImagePlaceholder({ placeholder, onGenerate, loading, updateImage, interactive = true }: { placeholder?: Slide['imagePlaceholder'], onGenerate: (prompt?: string) => void, loading: boolean, updateImage: (url: string) => void, interactive?: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  if (placeholder?.url) {
    return (
      <div className="w-full h-full relative group rounded-xl overflow-hidden shadow-inner border border-neutral-200">
        <img src={placeholder.url} alt="Slide image" className="w-full h-full object-cover" />
        {interactive && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium">Edit Image</button>
          </div>
        )}
        {showModal && (
          <ImageEditModal 
            onClose={() => setShowModal(false)}
            onGenerate={(prompt: string) => { setShowModal(false); onGenerate(prompt); }}
            onUrlSubmit={(url: string) => { setShowModal(false); updateImage(url); }}
            suggestedPrompt={placeholder.suggestedPrompt}
            loading={loading}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div 
        onDoubleClick={() => interactive && setShowModal(true)}
        className={cn(
          "w-full h-full bg-neutral-100 border-2 border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center text-neutral-400 p-6 text-center relative",
          interactive ? "hover:bg-neutral-50 hover:border-indigo-300 hover:text-indigo-500 transition-colors cursor-pointer" : ""
        )}
      >
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
        ) : (
          <ImagePlus className="w-8 h-8 mb-2" />
        )}
        <p className="font-medium mb-1">{loading ? 'Generating Image...' : 'Double click to add image'}</p>
        {placeholder?.suggestedPrompt && !loading && (
          <p className="text-xs opacity-70 line-clamp-3">Suggested: {placeholder.suggestedPrompt}</p>
        )}
      </div>
      {showModal && (
        <ImageEditModal 
          onClose={() => setShowModal(false)}
          onGenerate={(prompt: string) => { setShowModal(false); onGenerate(prompt); }}
          onUrlSubmit={(url: string) => { setShowModal(false); updateImage(url); }}
          suggestedPrompt={placeholder?.suggestedPrompt}
          loading={loading}
        />
      )}
    </>
  );
}

function ImageEditModal({ onClose, onGenerate, onUrlSubmit, suggestedPrompt, loading }: any) {
  const [url, setUrl] = useState('');
  const [customPrompt, setCustomPrompt] = useState(suggestedPrompt || '');
  const [previewUrl, setPreviewUrl] = useState('');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewUrl(event.target.result as string);
          setUrl(''); // Clear URL if file is selected
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    if (previewUrl) {
      onUrlSubmit(previewUrl);
    } else if (url) {
      onUrlSubmit(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Add Image</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">✕</button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Upload Local Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            {previewUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-neutral-200 h-32 relative">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => setPreviewUrl('')} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70">✕</button>
              </div>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-neutral-500">Or</span></div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Image URL</label>
            <input 
              type="text" 
              value={url} 
              onChange={e => { setUrl(e.target.value); setPreviewUrl(''); }} 
              placeholder="https://..." 
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" 
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-neutral-500">Or</span></div>
          </div>

          {/* AI Generation */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">AI Generation</label>
            <textarea 
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-3 resize-none h-20"
            />
            <button 
              onClick={() => onGenerate(customPrompt)}
              disabled={loading || !customPrompt.trim()}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              Generate with AI
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 rounded-md">Cancel</button>
          <button 
            onClick={handleApply} 
            disabled={!previewUrl && !url}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Image
          </button>
        </div>
      </div>
    </div>
  );
}
