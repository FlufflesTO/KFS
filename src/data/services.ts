export interface ServiceData {
  id: string;
  meta: { title: string; description: string; };
  hero: { subtitle: string; title: string; description: string; icon: string; };
  overview: string;
  problem: { heading: string; body: string; points: string[]; };
  capabilitiesHeading?: string;
  capabilities: { title: string; text: string; }[];
  standards: string[];
  faqs?: { q: string; a: string; }[];
  caseStudySlug?: string;
  intent: string;
  status: 'active' | 'draft' | 'archived';
}

export const services: Record<string, ServiceData> = {};
