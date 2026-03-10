export interface Slide {
  id: string;
  title: string;
  content: string[];
  layout: 'title' | 'content' | 'image-right' | 'image-left' | 'quote';
  imagePlaceholder?: {
    suggestedPrompt: string;
    url?: string;
  };
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
}
