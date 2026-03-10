import React, { useState } from 'react';
import { Presentation, Slide, AppConfig } from '../types';
import { cn } from '../lib/utils';
import { ImagePlus, Loader2, MessageSquareText, Download, LayoutTemplate, Presentation as PresentationIcon, Edit3 } from 'lucide-react';
import { generateImage } from '../services/llm';
import { exportToPPTX } from '../services/export';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
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

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPPTX(presentation, selectedTheme);
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
            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
              {idx + 1}
            </div>
            <div className="p-2 text-[8px] leading-tight">
              <div className="font-bold mb-1 truncate">{slide.title || 'Untitled Slide'}</div>
              {(Array.isArray(slide.content) ? slide.content : (typeof slide.content === 'string' ? [slide.content] : [])).slice(0, 3).map((c, i) => (
                <div key={i} className="truncate text-neutral-500">• {c}</div>
              ))}
            </div>
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

        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <SlideCanvas slide={activeSlide} updateSlide={updateSlide} config={config} themeId={selectedTheme} />
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

function SlideCanvas({ slide, updateSlide, config, themeId }: { slide: Slide, updateSlide: (s: Slide) => void, config: AppConfig, themeId: string }) {
  const [generatingImg, setGeneratingImg] = useState(false);

  const themes: Record<string, any> = {
    modern: { bg: '#FFFFFF', title: '#312E81', text: '#4B5563', accent: '#4F46E5' },
    dark: { bg: '#171717', title: '#F9FAFB', text: '#D1D5DB', accent: '#818CF8' },
    corporate: { bg: '#FFFFFF', title: '#1E3A8A', text: '#374151', accent: '#2563EB' },
    creative: { bg: '#FFF1F2', title: '#881337', text: '#4C0519', accent: '#E11D48' }
  };
  const theme = themes[themeId] || themes.modern;

  const handleGenerateImage = async (customPrompt?: string) => {
    const promptToUse = customPrompt || slide.imagePlaceholder?.suggestedPrompt;
    if (!promptToUse) {
      alert("Please provide a prompt for the image.");
      return;
    }
    setGeneratingImg(true);
    try {
      const url = await generateImage(promptToUse, config);
      updateSlide({
        ...slide,
        imagePlaceholder: {
          ...slide.imagePlaceholder,
          suggestedPrompt: promptToUse,
          url
        }
      });
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
          <div className="flex flex-col items-center justify-center h-full text-center p-12 rounded-xl" style={{ backgroundColor: theme.bg }}>
            <h1 className="text-6xl font-extrabold mb-8 tracking-tight" style={{ color: theme.title }}>{title}</h1>
            <div className="text-2xl space-y-3 font-medium max-w-3xl" style={{ color: theme.text }}>
              {contentArray.map((c, i) => <p key={i}>{c}</p>)}
            </div>
          </div>
        );
      case 'content':
        return (
          <div className="flex flex-col h-full p-8" style={{ backgroundColor: theme.bg }}>
            <h2 className="text-4xl font-bold mb-10 pb-4 border-b-2" style={{ color: theme.title, borderColor: theme.accent + '40' }}>{title}</h2>
            <ul className="text-2xl space-y-6 flex-1" style={{ color: theme.text }}>
              {contentArray.map((c, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="mt-1.5 text-xl" style={{ color: theme.accent }}>✦</span>
                  <span className="leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'image-right':
        return (
          <div className="flex flex-col h-full p-8" style={{ backgroundColor: theme.bg }}>
            <h2 className="text-4xl font-bold mb-10 pb-4 border-b-2" style={{ color: theme.title, borderColor: theme.accent + '40' }}>{title}</h2>
            <div className="flex flex-1 gap-12">
              <ul className="flex-1 text-xl space-y-6" style={{ color: theme.text }}>
                {contentArray.map((c, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1" style={{ color: theme.accent }}>•</span>
                    <span className="leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
              <div className="flex-1 flex items-center justify-center">
                <ImagePlaceholder 
                  placeholder={slide.imagePlaceholder} 
                  onGenerate={handleGenerateImage} 
                  loading={generatingImg} 
                  updateImage={(url) => updateSlide({ ...slide, imagePlaceholder: { ...slide.imagePlaceholder, suggestedPrompt: slide.imagePlaceholder?.suggestedPrompt || '', url } })}
                />
              </div>
            </div>
          </div>
        );
      case 'image-left':
        return (
          <div className="flex flex-col h-full p-8" style={{ backgroundColor: theme.bg }}>
            <h2 className="text-4xl font-bold mb-10 pb-4 border-b-2" style={{ color: theme.title, borderColor: theme.accent + '40' }}>{title}</h2>
            <div className="flex flex-1 gap-12">
              <div className="flex-1 flex items-center justify-center">
                <ImagePlaceholder 
                  placeholder={slide.imagePlaceholder} 
                  onGenerate={handleGenerateImage} 
                  loading={generatingImg} 
                  updateImage={(url) => updateSlide({ ...slide, imagePlaceholder: { ...slide.imagePlaceholder, suggestedPrompt: slide.imagePlaceholder?.suggestedPrompt || '', url } })}
                />
              </div>
              <ul className="flex-1 text-xl space-y-6" style={{ color: theme.text }}>
                {contentArray.map((c, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1" style={{ color: theme.accent }}>•</span>
                    <span className="leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'quote':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-24 rounded-xl relative overflow-hidden" style={{ backgroundColor: theme.bg }}>
            <div className="absolute top-12 left-12 text-9xl font-serif leading-none" style={{ color: theme.accent + '20' }}>"</div>
            <h2 className="text-2xl font-semibold mb-10 uppercase tracking-[0.2em]" style={{ color: theme.accent }}>{title}</h2>
            <blockquote className="text-4xl font-serif italic leading-relaxed relative z-10" style={{ color: theme.text }}>
              {contentArray.join(' ')}
            </blockquote>
          </div>
        );
      case 'chart':
        const hasData = slide.chartData && slide.chartData.length > 0;
        return (
          <div className="flex flex-col h-full p-8" style={{ backgroundColor: theme.bg }}>
            <h2 className="text-4xl font-bold mb-8 pb-4 border-b-2" style={{ color: theme.title, borderColor: theme.accent + '40' }}>{title}</h2>
            <div className="flex flex-1 gap-8">
              <div className="flex-1 flex flex-col justify-center">
                <ul className="text-xl space-y-5" style={{ color: theme.text }}>
                  {contentArray.map((c, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1" style={{ color: theme.accent }}>•</span>
                      <span className="leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 flex items-center justify-center rounded-xl shadow-sm border p-6" style={{ backgroundColor: theme.bg === '#171717' ? '#262626' : '#FFFFFF', borderColor: theme.accent + '20' }}>
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={slide.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.text + '20'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: theme.text}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: theme.text}} />
                      <Tooltip cursor={{fill: theme.text + '10'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: theme.bg, color: theme.text, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="value" fill={theme.accent} radius={[4, 4, 0, 0]} maxBarSize={60}>
                        {slide.chartData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={theme.accent} opacity={1 - (index * 0.15)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center" style={{ color: theme.text + '80' }}>
                    <Loader2 className="w-8 h-8 mb-2 opacity-50" />
                    <p>No chart data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col h-full p-8" style={{ backgroundColor: theme.bg }}>
            <h2 className="text-4xl font-bold mb-10 pb-4 border-b-2" style={{ color: theme.title, borderColor: theme.accent + '40' }}>{title}</h2>
            <ul className="text-2xl space-y-6 flex-1" style={{ color: theme.text }}>
              {contentArray.map((c, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="mt-1.5 text-xl" style={{ color: theme.accent }}>✦</span>
                  <span className="leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl aspect-video shadow-xl rounded-sm overflow-hidden p-12 relative" style={{ backgroundColor: theme.bg }}>
      {renderContent()}
    </div>
  );
}

function ImagePlaceholder({ placeholder, onGenerate, loading, updateImage }: { placeholder?: Slide['imagePlaceholder'], onGenerate: (prompt?: string) => void, loading: boolean, updateImage: (url: string) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  if (placeholder?.url) {
    return (
      <div className="w-full h-full relative group rounded-xl overflow-hidden shadow-inner border border-neutral-200">
        <img src={placeholder.url} alt="Slide image" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium">Edit Image</button>
        </div>
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
        onDoubleClick={() => setShowModal(true)}
        className="w-full h-full bg-neutral-100 border-2 border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:border-indigo-300 hover:text-indigo-500 transition-colors cursor-pointer p-6 text-center relative"
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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUrlSubmit(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-100">
          <h3 className="text-lg font-semibold">Add Image</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Upload Local Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-neutral-500">Or</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Image URL</label>
            <div className="flex gap-2">
              <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <button onClick={() => url && onUrlSubmit(url)} className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-md text-sm font-medium hover:bg-neutral-200">Add</button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-neutral-500">Or</span></div>
          </div>

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
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              Generate with AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
