export interface Slide {
  id: string;
  title: string;
  content: string[];
  layout: 'title' | 'content' | 'image-right' | 'image-left' | 'quote' | 'chart';
  imagePlaceholder?: {
    suggestedPrompt: string;
    url?: string;
  };
  chartData?: { name: string; value: number }[];
  speakerNotes: string;
}

export interface Presentation {
  title: string;
  slides: Slide[];
}

export interface AppConfig {
  gptResearcherEndpoint: string;
  llmProvider: 'gemini' | 'openai';
  openaiApiKey: string;
  openaiEndpoint: string;
  openaiModel: string;
  imageProvider: 'gemini' | 'openai' | 'custom';
  imageEndpoint: string;
  imageApiKey: string;
  imageModel: string;
  imageWidth: number;
  imageHeight: number;
  imageSteps: number;
  imageGuidance: number;
  googleClientId?: string;
}

export interface HistoryTask {
  id: string;
  topic: string;
  createdAt: string;
  status: 'researching' | 'generating_ppt' | 'done' | 'error';
  report?: string;
  presentation?: Presentation;
  error?: string;
}
