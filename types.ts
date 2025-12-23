
export enum MicrostockSite {
  SHUTTERSTOCK = 'shutterstock.com',
  ADOBE_STOCK = 'stock.adobe.com',
  FREEPIK = 'freepik.com',
  NONE = 'none'
}

export interface TagResult {
  tag: string;
  score: number;
  frequency: number;
}

export interface ScrapedItem {
  id: string;
  title: string;
  tags: string[];
  position: number;
}

export interface AIAnalysis {
  suggestedTitle: string;
  additionalTags: string[];
  nicheInsight: string;
}
