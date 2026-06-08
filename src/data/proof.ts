

export interface TrustModuleItem {
  title: string;
  text: string;
  status: 'Records' | 'Cadence' | 'Response' | 'success';
}

export interface ProofGridItem {
  title: string;
  text: string;
}

export const accreditations: ProofGridItem[] = [
  {
    title: "SAQCC Registered Technicians",
    text: "All field technicians hold valid SAQCC Fire registrations, ensuring legally compliant service and maintenance."
  },
  {
    title: "SANS Standards Alignment",
    text: "Installations and inspections strictly adhere to mandated South African National Standards (e.g., SANS 10139, 14520, 62676)."
  },
  {
    title: "Documented Competency",
    text: "Continuous internal engineering assessments and manufacturer-specific equipment training."
  }
];

export const portalPreviews: TrustModuleItem[] = [
  {
    title: "Dashboard Overview",
    text: "Real-time visibility into system health, upcoming maintenance schedules, and active defect reports.",
    status: "Records"
  },
  {
    title: "Service Record Archive",
    text: "Instant retrieval of historical job cards, technician notes, and digitally signed compliance certificates.",
    status: "Cadence"
  },
  {
    title: "Defect Workflow Tracking",
    text: "Track identified defects from initial logging through to quotation, repair, and final resolution.",
    status: "Response"
  }
];

export const documentationProof: ProofGridItem[] = [
  {
    title: "Sample Inspection Report",
    text: "Comprehensive, digitally captured inspection criteria covering all required SANS parameters."
  },
  {
    title: "Categorized Defect Lists",
    text: "Clear prioritization of defects into Critical, Warning, and Advisory statuses for immediate action."
  },
  {
    title: "Compliance Summary",
    text: "Automated generation of compliance certificates upon successful completion of SANS-aligned maintenance."
  }
];

export const testimonials: ProofGridItem[] = [
  {
    title: "Data Centre Infrastructure",
    text: "\"The transition to their portal meant we finally had auditable proof of maintenance for our gas suppression systems during insurance risk surveys.\""
  },
  {
    title: "Industrial Manufacturing",
    text: "\"Downtime was slashed by 40% after they overhauled our fire detection network and established a proactive cadence.\""
  },
  {
    title: "Commercial Real Estate",
    text: "\"Clear, un-hyped reporting. We know exactly what failed, why it failed, and what it costs to fix within hours of an inspection.\""
  }
];
