export interface LeadMagnet {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  href: string;
}

export const leadMagnets: Record<string, LeadMagnet> = {
  maintenance_checklist: {
    id: "maintenance_checklist",
    title: "SANS 10139 & 14520 Maintenance Checklist",
    description: "Download the exact inspection cadence and criteria our engineers use.",
    buttonText: "Download Checklist",
    href: "/resources/maintenance-checklists",
  },
  compliance_guide: {
    id: "compliance_guide",
    title: "The Responsible Person's Guide to Compliance",
    description: "Understand your legal liabilities under the OHS Act and National Building Regulations.",
    buttonText: "Read the Guide",
    href: "/compliance",
  }
};
