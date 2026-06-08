export interface FAQData {
  id: string;
  q: string;
  a: string;
  category: string;
  status: 'active' | 'draft' | 'archived';
}

export const faqs: Record<string, FAQData> = {};
