// Strict type definitions for website content structure.

export interface NavigationLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface NavigationModel {
  mainNav: NavigationLink[];
  footerNav: {
    section: string;
    links: NavigationLink[];
  }[];
}

export interface CTAModel {
  id: string;
  headline: string;
  subheadline: string;
  primaryButtonText: string;
  primaryButtonHref: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

export interface ServiceContentModel {
  id: string;
  title: string;
  slug: string;
  description: string;
  benefits: string[];
  process: string[];
  faqIds: string[];
}

export interface SectorContentModel {
  id: string;
  name: string;
  slug: string;
  description: string;
  challenges: string[];
  solutions: string[];
  caseStudyIds: string[];
}

export interface ResourceContentModel {
  id: string;
  title: string;
  slug: string;
  type: "guide" | "whitepaper" | "checklist";
  description: string;
  downloadUrl: string;
}

export type ProofType = "Accreditation" | "Photo" | "Documentation" | "Portal" | "Case study" | "Team" | "Testimonial";

export interface CaseStudyModel {
  id: string;
  title: string;
  slug: string;
  clientName: string;
  sectorId: string;
  challenge: string;
  solution: string;
  results: string[];
  isMock: boolean;
  internalStatus?: string;
  proofIds: string[];
}

export interface FAQModel {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface LeadMagnetModel {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  resourceId: string;
}

export interface ProofModel {
  id: string;
  type: ProofType;
  title: string;
  description: string;
  imageUrl?: string;
  certificateNumber?: string;
}

export interface FormRoutingModel {
  formId: string;
  destinationEmail: string;
  successMessage: string;
  webhookUrl?: string;
}

