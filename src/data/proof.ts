

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
    title: "SAQCC-Registered Technicians",
    text: "SAQCC Fire–registered technicians for the applicable fire and gas workstreams. Current registrations are verified per technician before deployment."
  },
  {
    title: "SANS Standards Alignment",
    text: "Installations and inspections are scoped and documented against the relevant South African National Standards (e.g., SANS 10139, 14520, 62676) for the system and site."
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
    text: "Certificate and service-report workflows generated where the system and work status support sign-off."
  }
];

export const testimonials: ProofGridItem[] = [
  {
    title: "Data Centre Infrastructure",
    text: "\"The transition to their portal meant we finally had auditable proof of maintenance for our gas suppression systems during insurance risk surveys.\""
  },
  {
    title: "Industrial Manufacturing",
    text: "\"Unplanned downtime dropped noticeably after they overhauled our fire detection network and established a proactive maintenance cadence.\""
  },
  {
    title: "Commercial Real Estate",
    text: "\"Clear, un-hyped reporting. We know exactly what failed, why it failed, and what it costs to fix within hours of an inspection.\""
  }
];
