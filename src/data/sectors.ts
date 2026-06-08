export interface SectorData {
  id: string;
  meta: { title: string; description: string; };
  hero: { subtitle: string; title: string; description: string; icon: string; };
  overview: string;
  risks: { title: string; text: string; }[];
  systems: { label: string; href: string; text: string; }[];
  standards: string[];
  caseStudySlug?: string;
  intent: string;
  status: 'active' | 'draft' | 'archived';
}

export const sectors: Record<string, SectorData> = {};
