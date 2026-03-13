export interface Slide {
  id: string;
  title: string;
  content: string[];
  layout: 'title' | 'content' | 'image-right' | 'image-left' | 'image-top' | 'image-bottom' | 'quote' | 'chart' | 'markdown' | 'columns' | 'process' | 'comparison' | 'metric';
  chartType?: 'bar' | 'line' | 'pie' | 'radar' | 'area';
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
  rawMarkdown?: string;
}

export interface AppConfig {
  geminiApiKey?: string;
  gptResearcherEndpoint: string;
  llmProvider: 'gemini' | 'openai';
  openaiApiKey: string;
  openaiEndpoint: string;
  openaiModel: string;
  imageProvider: 'gemini' | 'openai' | 'custom' | 'grok';
  imageEndpoint: string;
  imageApiKey: string;
  imageModel: string;
  imageWidth: number;
  imageHeight: number;
  imageSteps: number;
  imageGuidance: number;
  grokImageSize?: string;
  googleClientId?: string;
  orientation?: 'landscape' | 'portrait';
  pageSize?: 'web' | 'a4' | 'b5';
  directMarkdownRender?: boolean;
  customTheme?: {
    bg: string;
    title: string;
    text: string;
    accent: string;
    accentBg: string;
    fontFamily?: string;
    baseFontSize?: string;
  };
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
