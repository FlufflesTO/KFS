export interface LeadMagnet {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  href: string;
  /** Availability — "coming-soon" renders a disabled state on the card. */
  status: "available" | "coming-soon";
  /** Optional service slug this magnet is most relevant to (for related-content wiring). */
  relatedService?: string;
  /** Analytics event name fired on download click (see ANALYTICS_EVENTS). */
  trackingEvent?: string;
}

export const leadMagnets: Record<string, LeadMagnet> = {
  maintenance_checklist: {
    id: "maintenance_checklist",
    title: "SANS 10139 & 14520 Maintenance Checklist",
    description: "Download the exact inspection cadence and criteria our engineers use.",
    buttonText: "Download Checklist",
    href: "/resources/maintenance-checklists",
    status: "available",
    relatedService: "compliance-maintenance",
    trackingEvent: "lead_magnet_download",
  },
  compliance_guide: {
    id: "compliance_guide",
    title: "The Responsible Person's Guide to Compliance",
    description: "Understand your legal liabilities under the OHS Act and National Building Regulations.",
    buttonText: "Read the Guide",
    href: "/compliance",
    status: "available",
    relatedService: "compliance-maintenance",
    trackingEvent: "lead_magnet_download",
  },
  fire_system_maintenance_checklist: {
    id: "fire_system_maintenance_checklist",
    title: "Fire System Maintenance Checklist",
    description: "Month-by-month inspection tasks for detection, alarm and suppression systems, mapped to the relevant SANS cadence.",
    buttonText: "Coming soon",
    href: "/resources/maintenance-checklists",
    status: "coming-soon",
    relatedService: "compliance-maintenance",
    trackingEvent: "lead_magnet_download",
  },
  gas_suppression_readiness_checklist: {
    id: "gas_suppression_readiness_checklist",
    title: "Gas Suppression Readiness Checklist",
    description: "What to confirm before a clean-agent or inert-gas system is designed — enclosure integrity, occupancy, agent choice and documentation.",
    buttonText: "Coming soon",
    href: "/resources/gas-suppression-guides",
    status: "coming-soon",
    relatedService: "gas-suppression",
    trackingEvent: "lead_magnet_download",
  },
  fire_detection_false_alarm_checklist: {
    id: "fire_detection_false_alarm_checklist",
    title: "Fire Detection False Alarm Checklist",
    description: "Practical steps to reduce nuisance alarms — detector selection, siting, environment and cause-and-effect review.",
    buttonText: "Coming soon",
    href: "/resources/fire-detection-guides",
    status: "coming-soon",
    relatedService: "fire-detection",
    trackingEvent: "lead_magnet_download",
  },
  site_compliance_preparation_guide: {
    id: "site_compliance_preparation_guide",
    title: "Site Compliance Preparation Guide",
    description: "How to assemble the inspection, servicing and defect records an insurer or auditor expects from the responsible person.",
    buttonText: "Coming soon",
    href: "/compliance",
    status: "coming-soon",
    relatedService: "compliance-maintenance",
    trackingEvent: "lead_magnet_download",
  },
  fire_door_inspection_checklist: {
    id: "fire_door_inspection_checklist",
    title: "Fire Door Inspection Checklist",
    description: "The door-by-door checks that prove a compliant assembly — leaf, frame, seals, hardware, gaps and self-closing.",
    buttonText: "Coming soon",
    href: "/resources/fire-door-guides",
    status: "coming-soon",
    relatedService: "fire-doors",
    trackingEvent: "lead_magnet_download",
  },
  cctv_intrusion_site_security_checklist: {
    id: "cctv_intrusion_site_security_checklist",
    title: "CCTV & Intrusion Site Security Checklist",
    description: "Coverage, grading, retention and POPIA considerations to confirm before specifying CCTV and intrusion detection.",
    buttonText: "Coming soon",
    href: "/resources/cctv-security-guides",
    status: "coming-soon",
    relatedService: "cctv",
    trackingEvent: "lead_magnet_download",
  },
  fire_safety_signage_readiness_checklist: {
    id: "fire_safety_signage_readiness_checklist",
    title: "Fire Safety Signage Readiness Checklist",
    description: "Photoluminescent signage, placement and emergency-lighting coordination checks for an inspection-ready site.",
    buttonText: "Coming soon",
    href: "/fire-safety-signage",
    status: "coming-soon",
    relatedService: "fire-safety-signage",
    trackingEvent: "lead_magnet_download",
  }
};
