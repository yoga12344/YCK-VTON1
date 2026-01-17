
export interface GeminiResult {
  garmentDescription: string;
  personDescription: string;
  technicalPrompt: string;
  bodySize?: 'S' | 'M' | 'L';
  shirtCoverage?: string;
  pantCoverage?: string;
  resultImageUrl?: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  error?: string;
  stylingSuggestions?: {
    suggestedPant?: string;
    suggestedShoes?: string;
    suggestedShirt?: string;
    styleVibe?: string;
  };
}

export interface PaperSection {
  title: string;
  content: string;
  icon: string;
}

export interface ImageUploads {
  person: string | null;
  shirt: string | null;
  pant: string | null;
  dress: string | null;
}

export type Gender = 'MEN' | 'WOMEN';
