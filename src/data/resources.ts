export interface ResourceData {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'guide' | 'checklist' | 'video' | 'article';
  status: 'active' | 'draft' | 'archived';
}

export const resources: Record<string, ResourceData> = {};
