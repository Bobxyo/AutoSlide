import React, { useState } from 'react';
import { Presentation, Slide, AppConfig } from '../types';
import { cn } from '../lib/utils';
import { ImagePlus, Loader2, MessageSquareText } from 'lucide-react';
import { generateImage } from '../services/llm';

interface SlideEditorProps {
  presentation: Presentation;
  setPresentation: React.Dispatch<React.SetStateAction<Presentation | null>>;
  config: AppConfig;
}

export function SlideEditor({ presentation, setPresentation, config }: SlideEditorProps) {
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const activeSlide = presentation.slides[activeSlideIdx];

  const updateSlide = (updatedSlide: Slide) => {
    const newSlides = [...presentation.slides];
    newSlides[activeSlideIdx] = updatedSlide;
    setPresentation({ ...presentation, slides: newSlides });
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Thumbnails Sidebar */}
      <div className="w-64 bg-neutral-100 border-r border-neutral-200 overflow-y-auto p-4 flex flex-col gap-4">
        {presentation.slides.map((slide, idx) => (
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
              <div className="font-bold mb-1 truncate">{slide.title}</div>
              {slide.content.slice(0, 3).map((c, i) => (
                <div key={i} className="truncate text-neutral-500">• {c}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-200/50">
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <SlideCanvas slide={activeSlide} updateSlide={updateSlide} config={config} />
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
    </div>
  );
}

function SlideCanvas({ slide, updateSlide, config }: { slide: Slide, updateSlide: (s: Slide) => void, config: AppConfig }) {
  const [generatingImg, setGeneratingImg] = useState(false);

  const handleGenerateImage = async () => {
    if (!slide.imagePlaceholder?.suggestedPrompt) return;
    setGeneratingImg(true);
    try {
      const url = await generateImage(slide.imagePlaceholder.suggestedPrompt, config);
      updateSlide({
        ...slide,
        imagePlaceholder: {
          ...slide.imagePlaceholder,
          url
        }
      });
    } catch (e) {
      console.error(e);
      alert('Failed to generate image');
    } finally {
      setGeneratingImg(false);
    }
  };

  const renderContent = () => {
    switch (slide.layout) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-5xl font-bold text-neutral-900 mb-6">{slide.title}</h1>
            <div className="text-xl text-neutral-500 space-y-2">
              {slide.content.map((c, i) => <p key={i}>{c}</p>)}
            </div>
          </div>
        );
      case 'content':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-4xl font-bold text-neutral-900 mb-8">{slide.title}</h2>
            <ul className="list-disc list-inside text-2xl text-neutral-700 space-y-4">
              {slide.content.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        );
      case 'image-right':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-4xl font-bold text-neutral-900 mb-8">{slide.title}</h2>
            <div className="flex flex-1 gap-8">
              <ul className="flex-1 list-disc list-inside text-xl text-neutral-700 space-y-4">
                {slide.content.map((c, i) => <li key={i}>{c}</li>)}
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
          <div className="flex flex-col h-full">
            <h2 className="text-4xl font-bold text-neutral-900 mb-8">{slide.title}</h2>
            <div className="flex flex-1 gap-8">
              <div className="flex-1 flex items-center justify-center">
                <ImagePlaceholder 
                  placeholder={slide.imagePlaceholder} 
                  onGenerate={handleGenerateImage} 
                  loading={generatingImg} 
                  updateImage={(url) => updateSlide({ ...slide, imagePlaceholder: { ...slide.imagePlaceholder, suggestedPrompt: slide.imagePlaceholder?.suggestedPrompt || '', url } })}
                />
              </div>
              <ul className="flex-1 list-disc list-inside text-xl text-neutral-700 space-y-4">
                {slide.content.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>
        );
      case 'quote':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-16">
            <h2 className="text-2xl font-medium text-neutral-400 mb-8 uppercase tracking-widest">{slide.title}</h2>
            <blockquote className="text-4xl font-serif italic text-neutral-800 leading-relaxed">
              "{slide.content.join(' ')}"
            </blockquote>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl aspect-video bg-white shadow-xl rounded-sm overflow-hidden p-12 relative">
      {renderContent()}
    </div>
  );
}

function ImagePlaceholder({ placeholder, onGenerate, loading, updateImage }: { placeholder?: Slide['imagePlaceholder'], onGenerate: () => void, loading: boolean, updateImage: (url: string) => void }) {
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
            onGenerate={() => { setShowModal(false); onGenerate(); }}
            onUrlSubmit={(url) => { setShowModal(false); updateImage(url); }}
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
          onGenerate={() => { setShowModal(false); onGenerate(); }}
          onUrlSubmit={(url) => { setShowModal(false); updateImage(url); }}
          suggestedPrompt={placeholder?.suggestedPrompt}
          loading={loading}
        />
      )}
    </>
  );
}

function ImageEditModal({ onClose, onGenerate, onUrlSubmit, suggestedPrompt, loading }: any) {
  const [url, setUrl] = useState('');
  
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
            {suggestedPrompt && (
              <div className="bg-indigo-50 p-3 rounded-md mb-3">
                <p className="text-xs text-indigo-800 font-medium mb-1">Suggested Prompt:</p>
                <p className="text-sm text-indigo-900">{suggestedPrompt}</p>
              </div>
            )}
            <button 
              onClick={onGenerate}
              disabled={loading}
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
