import React from 'react';
import { AppConfig } from '../types';

interface ConfigPanelProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

export function ConfigPanel({ config, setConfig }: ConfigPanelProps) {
  const handleChange = (key: keyof AppConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Settings</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">GPT Researcher Endpoint</label>
          <input 
            type="text" 
            value={config.gptResearcherEndpoint}
            onChange={(e) => handleChange('gptResearcherEndpoint', e.target.value)}
            placeholder="http://localhost:8000/report/"
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
            <option value="openai">OpenAI (DALL-E)</option>
            <option value="custom">Custom API (Flux etc.)</option>
          </select>
        </div>

        {config.imageProvider === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Image API Endpoint</label>
              <input type="text" value={config.imageEndpoint} onChange={(e) => handleChange('imageEndpoint', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Image API Key</label>
              <input type="password" value={config.imageApiKey} onChange={(e) => handleChange('imageApiKey', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Model ID</label>
              <input type="text" value={config.imageModel} onChange={(e) => handleChange('imageModel', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
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
      </div>
    </div>
  );
}
