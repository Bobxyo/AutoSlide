import React from 'react';
import { AppConfig } from '../types';

interface ConfigPanelProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

export function ConfigPanel({ config, setConfig }: ConfigPanelProps) {
  const handleChange = (key: keyof AppConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Settings</h2>
      
      <div className="space-y-4">
        <div className="pt-4 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4">Page Layout</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleChange('orientation', 'landscape')}
                  className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${config.orientation !== 'portrait' ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}
                >
                  Landscape
                </button>
                <button
                  onClick={() => handleChange('orientation', 'portrait')}
                  className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${config.orientation === 'portrait' ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}
                >
                  Portrait
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Page Size</label>
              <select
                value={config.pageSize || 'web'}
                onChange={(e) => handleChange('pageSize', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="web">Web (1920×1080)</option>
                <option value="a4">A4 (Fixed 20mm margin)</option>
                <option value="b5">B5 (Fixed 20mm margin)</option>
              </select>
            </div>
            {(config.pageSize === 'a4' || config.pageSize === 'b5') && config.orientation === 'portrait' && (
              <div className="flex items-start mt-4">
                <div className="flex items-center h-5">
                  <input
                    id="directMarkdownRender"
                    type="checkbox"
                    checked={config.directMarkdownRender || false}
                    onChange={(e) => handleChange('directMarkdownRender', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-white border-neutral-300 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="directMarkdownRender" className="font-medium text-neutral-700">
                    Direct Markdown Render
                  </label>
                  <p className="text-neutral-500">Directly render GPT-Researcher markdown to slides for manual editing.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4">API Settings</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Gemini API Key</label>
          <input 
            type="password" 
            value={config.geminiApiKey || ''}
            onChange={(e) => handleChange('geminiApiKey', e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="text-xs text-neutral-500 mt-1">Required if running locally. Leave empty if using AI Studio.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">GPT Researcher Endpoint</label>
          <input 
            type="text" 
            value={config.gptResearcherEndpoint}
            onChange={(e) => handleChange('gptResearcherEndpoint', e.target.value)}
            placeholder="http://localhost:8000/api/task"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="text-xs text-neutral-500 mt-1">Leave empty to use Gemini for research.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">LLM Provider</label>
          <select 
            value={config.llmProvider}
            onChange={(e) => handleChange('llmProvider', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI Compatible</option>
          </select>
        </div>

        {config.llmProvider === 'openai' && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">API Key</label>
              <input 
                type="password" 
                value={config.openaiApiKey}
                onChange={(e) => handleChange('openaiApiKey', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Endpoint</label>
              <input 
                type="text" 
                value={config.openaiEndpoint}
                onChange={(e) => handleChange('openaiEndpoint', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Model</label>
              <input 
                type="text" 
                value={config.openaiModel}
                onChange={(e) => handleChange('openaiModel', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Image Generation Provider</label>
          <select 
            value={config.imageProvider}
            onChange={(e) => handleChange('imageProvider', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI Compatible (DALL-E, SiliconFlow, etc.)</option>
            <option value="grok">Grok (xAI)</option>
            <option value="custom">Custom API (Raw JSON payload)</option>
          </select>
        </div>

        {(config.imageProvider === 'custom' || config.imageProvider === 'openai' || config.imageProvider === 'grok') && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Image API Endpoint</label>
              <input type="text" value={config.imageEndpoint} onChange={(e) => handleChange('imageEndpoint', e.target.value)} placeholder={config.imageProvider === 'openai' ? 'https://api.openai.com/v1' : config.imageProvider === 'grok' ? 'http://10.10.10.222:8900/v1' : 'https://...'} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Image API Key</label>
              <input type="password" value={config.imageApiKey} onChange={(e) => handleChange('imageApiKey', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Model ID</label>
              <input type="text" value={config.imageModel} onChange={(e) => handleChange('imageModel', e.target.value)} placeholder={config.imageProvider === 'openai' ? 'dall-e-3' : config.imageProvider === 'grok' ? 'grok-imagine-1.0' : 'flux-2-dev'} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            {config.imageProvider === 'grok' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Image Size</label>
                <select 
                  value={config.grokImageSize || '1024x1024'}
                  onChange={(e) => handleChange('grokImageSize', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="1024x1024">1024x1024</option>
                  <option value="1024x1792">1024x1792</option>
                  <option value="1280x720">1280x720</option>
                  <option value="1792x1024">1792x1024</option>
                  <option value="720x1280">720x1280</option>
                </select>
              </div>
            )}
            {config.imageProvider === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Width</label>
                  <input type="number" value={config.imageWidth} onChange={(e) => handleChange('imageWidth', Number(e.target.value))} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Height</label>
                  <input type="number" value={config.imageHeight} onChange={(e) => handleChange('imageHeight', Number(e.target.value))} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Steps</label>
                  <input type="number" value={config.imageSteps} onChange={(e) => handleChange('imageSteps', Number(e.target.value))} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Guidance</label>
                  <input type="number" step="0.1" value={config.imageGuidance} onChange={(e) => handleChange('imageGuidance', Number(e.target.value))} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
            )}
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Google Client ID (For Slides Export)</label>
          <input 
            type="text" 
            value={config.googleClientId || ''}
            onChange={(e) => handleChange('googleClientId', e.target.value)}
            placeholder="YOUR_CLIENT_ID.apps.googleusercontent.com"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="pt-4 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Custom Theme Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Background Color</label>
              <div className="flex gap-2">
                <input type="color" value={config.customTheme?.bg || '#FFFFFF'} onChange={(e) => handleChange('customTheme', { ...config.customTheme, bg: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                <input type="text" value={config.customTheme?.bg || '#FFFFFF'} onChange={(e) => handleChange('customTheme', { ...config.customTheme, bg: e.target.value })} className="flex-1 px-2 py-1 border border-neutral-300 rounded-md text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Title Color</label>
              <div className="flex gap-2">
                <input type="color" value={config.customTheme?.title || '#000000'} onChange={(e) => handleChange('customTheme', { ...config.customTheme, title: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                <input type="text" value={config.customTheme?.title || '#000000'} onChange={(e) => handleChange('customTheme', { ...config.customTheme, title: e.target.value })} className="flex-1 px-2 py-1 border border-neutral-300 rounded-md text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Text Color</label>
              <div className="flex gap-2">
                <input type="color" value={config.customTheme?.text || '#333333'} onChange={(e) => handleChange('customTheme', { ...config.customTheme, text: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                <input type="text" value={config.customTheme?.text || '#333333'} onChange={(e) => handleChange('customTheme', { ...config.customTheme, text: e.target.value })} className="flex-1 px-2 py-1 border border-neutral-300 rounded-md text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Accent Color</label>
              <div className="flex gap-2">
                <input type="color" value={config.customTheme?.accent || '#3B82F6'} onChange={(e) => handleChange('customTheme', { ...config.customTheme, accent: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                <input type="text" value={config.customTheme?.accent || '#3B82F6'} onChange={(e) => handleChange('customTheme', { ...config.customTheme, accent: e.target.value })} className="flex-1 px-2 py-1 border border-neutral-300 rounded-md text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Accent Background</label>
              <div className="flex gap-2">
                <input type="color" value={config.customTheme?.accentBg || '#EFF6FF'} onChange={(e) => handleChange('customTheme', { ...config.customTheme, accentBg: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                <input type="text" value={config.customTheme?.accentBg || '#EFF6FF'} onChange={(e) => handleChange('customTheme', { ...config.customTheme, accentBg: e.target.value })} className="flex-1 px-2 py-1 border border-neutral-300 rounded-md text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Font Family</label>
              <select 
                value={config.customTheme?.fontFamily || 'sans-serif'} 
                onChange={(e) => handleChange('customTheme', { ...config.customTheme, fontFamily: e.target.value })} 
                className="w-full px-2 py-1 border border-neutral-300 rounded-md text-sm"
              >
                <option value="sans-serif">Sans Serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
                <option value="system-ui">System UI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Base Font Size</label>
              <select 
                value={config.customTheme?.baseFontSize || '16px'} 
                onChange={(e) => handleChange('customTheme', { ...config.customTheme, baseFontSize: e.target.value })} 
                className="w-full px-2 py-1 border border-neutral-300 rounded-md text-sm"
              >
                <option value="14px">Small (14px)</option>
                <option value="16px">Medium (16px)</option>
                <option value="18px">Large (18px)</option>
                <option value="20px">Extra Large (20px)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
