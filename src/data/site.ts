/**
 * Project Sentinel - Site Configuration
 * Purpose: Centralized configuration, navigation links, and content definitions for the Kharon website.
 * Dependencies: None
 * Structural Role: Single source of truth for site-wide static copy, page metadata, and regulatory mappings.
 */

export interface SiteConfig {
  name: string;
  shortName: string;
  title: string;
  description: string;
  url: string;
  portalUrl: string;
  portalStatus: string;
  portalLoginPath: string;
  email: string;
  phone: string;
  address: string;
  registration: string;
  ogImage: string;
}

export interface PageMeta {
  title: string;
  description: string;
}

export interface SolutionLink {
  label: string;
  href: string;
  summary: string;
  icon?: string;
  sans?: string[];
}

export interface NavLink {
  label: string;
  href: string;
}

export interface IndustryItem {
  title: string;
  risk: string;
  priority: string;
  riskLevel: number;
  icon: string;
  sans: string[];
}

export interface AssuranceItem {
  title: string;
  text: string;
  status: string;
}

export interface TrustModule {
  title: string;
  text: string;
  status: string;
  tone: string;
}

export interface CapabilityProof {
  suppression: string[];
  detection: string[];
  compliance: string[];
  security: string[];
}

export interface ProofSignal {
  title: string;
  text: string;
  status: string;
}

const siteUrl = import.meta.env.PUBLIC_SITE_URL || "https://www.tequit.co.za";
const portalUrl = import.meta.env.PUBLIC_PORTAL_URL || "https://portal.tequit.co.za";
const contactEmail = import.meta.env.PUBLIC_CONTACT_EMAIL || "admin@kharon.co.za";

export const site: SiteConfig = {
  name: "Kharon Fire and Security Solutions (Pty) Ltd",
  shortName: "Kharon",
  title: "Kharon Fire and Security Solutions",
  description:
    "Commercial and industrial fire detection, clean-agent gas suppression and compliance maintenance for critical environments.", 
  url: siteUrl,
  portalUrl,
  portalStatus: "Open the secure Kharon operations portal for lifecycle records, dispatches, client systems and finance workspaces.",
  portalLoginPath: "/portal/login",
  email: contactEmail,
  phone: "061 545 8830",
  address: "Unit 58, M5 Freeway Park, Cnr Uppercamp & Berkley Rd, Ndabeni, Maitland, 7405",
  registration: "2016/313076/07",
  ogImage: "/og/kharon-og.png"
};

export const pageMeta: Record<string, PageMeta> = {
  home: {
    title: "Commercial & Industrial Fire Protection Specialists | Kharon",
    description:
      "Kharon designs, installs, services and maintains fire detection and gas suppression systems for commercial, industrial and mission-critical environments."
  },
  services: {
    title: "Fire Protection Services | Kharon",
    description:
      "Commercial fire detection, clean-agent gas suppression, compliance maintenance, critical infrastructure protection and integrated security services."
  },
  gasSuppression: {
    title: "Gas Suppression Systems | Kharon",
    description:
      "Clean-agent gas suppression systems, release infrastructure and lifecycle support for server rooms, technical spaces and mission-critical commercial assets."
  },
  fireDetection: {
    title: "Fire Detection Systems | Kharon",
    description:
      "Addressable fire detection infrastructure, control panels and response logic for commercial and industrial environments."   
  },
  compliance: {
    title: "Compliance & Maintenance | Kharon",
    description:
      "Structured inspection, servicing and maintenance reporting for fire detection, gas suppression and integrated protection systems."
  },
  criticalInfrastructure: {
    title: "Critical Infrastructure Protection | Kharon",
    description:
      "Fire detection, gas suppression and lifecycle support for continuity-sensitive commercial and industrial infrastructure."   
  },
  emergencySupport: {
    title: "Emergency Support | Kharon",
    description:
      "Operational response pathways for protection-system faults, compliance interventions and maintenance escalations."
  },
  security: {
    title: "Integrated Infrastructure Security | Kharon",
    description:
      "Enterprise CCTV, access control and monitoring systems integrated with wider critical infrastructure protection strategies."
  },
  industries: {
    title: "Industries Served | Kharon",
    description:
      "Fire detection, gas suppression and maintenance strategies for data centres, manufacturing sites, warehousing, utilities and industrial facilities."
  },
  about: {
    title: "About Kharon | Fire and Security Solutions",
    description:
      "Kharon is positioned around engineered fire detection, gas suppression, compliance discipline and critical environment protection."
  },
  contact: {
    title: "Contact Kharon | Request Site Assessment",
    description:
      "Contact Kharon to discuss commercial fire detection, gas suppression, compliance maintenance or integrated security requirements."
  },
  complianceHub: {
    title: "Protection System Compliance Reference | Kharon",
    description:
      "Practical guidance on SANS 10139 and SANS 14520 maintenance requirements, service report structure, maintenance cadence and defect classification for commercial fire detection and gas suppression systems."
  }
};

export const solutionLinks: SolutionLink[] = [
  {
    label: "Gas Suppression",
    href: "/gas-suppression",
    summary: "Clean-agent and engineered suppression systems for technical assets.",
    icon: "/brand/icons/service-fire-suppression.svg",
    sans: ["SANS 14520", "SANS 10400-T"]
  },
  {
    label: "Fire Detection",
    href: "/fire-detection",
    summary: "Addressable detection and response systems for commercial sites.",
    icon: "/brand/icons/service-fire-detection.svg",
    sans: ["SANS 10139", "SANS 1475-1"]
  },
  {
    label: "Integrated Security",
    href: "/security-systems",
    summary: "CCTV and access control integrated with fire protection priorities.",
    icon: "/brand/icons/service-cctv.svg",
    sans: ["SANS 10222", "SANS 10198"]
  },
  {
    label: "Critical Infrastructure",
    href: "/critical-infrastructure",
    summary: "Protection systems for data centres, control rooms and switchgear.",
    icon: "/brand/icons/sector-server-rack.svg",
    sans: ["SANS 10139", "SANS 14520"]
  },
  {
    label: "Compliance & Maintenance",
    href: "/compliance-maintenance",
    summary: "Lifecycle maintenance, inspection schedules and SANS documentation.",
    icon: "/brand/icons/service-engineering.svg",
    sans: ["SANS 10139", "SANS 14520"]
  }
];

export const sectorLinks: NavLink[] = [
  { label: "Data Centres", href: "/industries#data-centres" },
  { label: "Industrial Facilities", href: "/industries#industrial" },
  { label: "Warehousing", href: "/industries#warehousing" },
  { label: "Critical Utilities", href: "/industries#utilities" }
];

export const resourceLinks: NavLink[] = [
  { label: "Compliance Hub", href: "/compliance" },
  { label: "Emergency Support", href: "/emergency-support" },
  { label: "About Kharon", href: "/about" },
  { label: "Request Assessment", href: "/contact?intent=site-assessment" }
];

export const mainLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Solutions", href: "/solutions" },
  { label: "Sectors", href: "/industries" },
  { label: "Resources", href: "/resources" }
];

export const sitemapPages: string[] = [
  "",
  "gas-suppression",
  "fire-detection",
  "compliance-maintenance",
  "critical-infrastructure",
  "emergency-support",
  "security-systems",
  "industries",
  "about",
  "contact",
  "compliance",
  "privacy"
];

export const industries: IndustryItem[] = [
  {
    title: "Data centres and server rooms",
    risk: "Clean-agent suppression, early detection and uptime-sensitive response logic.",
    priority: "Continuity",
    riskLevel: 92,
    icon: "/brand/icons/sector-server-rack.svg",
    sans: ["SANS 10139", "SANS 14520", "SANS 10400-T"]
  },
  {
    title: "Telecoms and control rooms",
    risk: "Protected electronics, controlled release, alarm routing and fault visibility.",
    priority: "Signal integrity",
    riskLevel: 88,
    icon: "/brand/icons/sector-radio-tower.svg",
    sans: ["SANS 10139", "SANS 14520", "SANS 10198"]
  },
  {
    title: "Electrical rooms and switchgear spaces",
    risk: "Rapid detection, asset protection and suppression methods that limit collateral damage.",
    priority: "Asset protection",
    riskLevel: 90,
    icon: "/brand/icons/sector-switchgear.svg",
    sans: ["SANS 10142", "SANS 14520"]
  },
  {
    title: "Logistics and warehousing",
    risk: "Large-volume detection coverage, evacuation signalling and inspection cadence.",
    priority: "Coverage",
    riskLevel: 65,
    icon: "/brand/icons/sector-warehouse.svg",
    sans: ["SANS 10139", "SANS 1475"]
  },
  {
    title: "Industrial and process facilities",
    risk: "Risk-segmented zones, rugged detection choices and maintenance access planning.",
    priority: "Process risk",
    riskLevel: 82,
    icon: "/brand/icons/sector-factory.svg",
    sans: ["SANS 10139", "SANS 1475", "SANS 10400-T"]
  },
  {
    title: "Utilities and critical infrastructure",
    risk: "Compliance records, escalation pathways and response logic for high-consequence assets.",
    priority: "Resilience",
    riskLevel: 94,
    icon: "/brand/icons/sector-power-grid.svg",
    sans: ["SANS 10139", "SANS 10142", "SANS 10090"]
  },
  {
    title: "Healthcare and commercial infrastructure",
    risk: "Occupancy-aware detection, documented servicing and continuity-sensitive protection.",
    priority: "Occupancy",
    riskLevel: 78,
    icon: "/brand/icons/sector-healthcare.svg",
    sans: ["SANS 10139", "SANS 14520", "SANS 10400-T"]
  },
  {
    title: "Control rooms and operations centres",
    risk: "Fire detection and suppression architecture for spaces coordinating wider site response.",
    priority: "Operational command",
    riskLevel: 85,
    icon: "/brand/icons/sector-control-room.svg",
    sans: ["SANS 10139", "SANS 10222", "SANS 10198"]
  }
];

export const assuranceItems: AssuranceItem[] = [
  {
    title: "Site assessment",
    text: "Requirements start with the protected room, asset value, occupancy, detection risk and continuity requirement.",        
    status: "Assess"
  },
  {
    title: "Detection and release logic",
    text: "Addressable detection, alarm signalling, suppression release and response paths are structured around maintainable cause-and-effect design.",
    status: "Design"
  },
  {
    title: "Documented servicing",
    text: "Inspection, testing, servicing and reporting are treated as part of the protection system, not an afterthought.",       
    status: "Maintain"
  }
];

export const trustModules: TrustModule[] = [
  {
    title: "Compliance records",
    text: "Inspection and service records remain available for responsible persons, insurers and operational review.",
    status: "Records",
    tone: "purple"
  },
  {
    title: "Maintenance cadence",
    text: "Preventive servicing is structured into a recurring schedule for detectors, panels, suppression hardware and release infrastructure.",
    status: "Cadence",
    tone: "purple"
  },
  {
    title: "Response process",
    text: "Detection, escalation, evacuation and confirmed response sequences are aligned to site operating procedures.",
    status: "Response",
    tone: "amber"
  },
  {
    title: "Documentation outputs",
    text: "System plans, service notes, faults and lifecycle actions are captured as an operational evidence layer.",
    status: "Outputs",
    tone: "blue"
  }
];

export const capabilityProof: CapabilityProof = {
  suppression: [
    "Clean-agent and engineered suppression focus",
    "Protected-room and release infrastructure planning",
    "Detection integration for controlled activation",
    "Lifecycle support for critical technical spaces"
  ],
  detection: [
    "Addressable detection and zone strategy",
    "Control-panel and annunciation planning",
    "Cause-and-effect response alignment",
    "Maintainable layouts for commercial sites"
  ],
  compliance: [
    "Scheduled inspection cadence",
    "Service records and maintenance visibility",
    "Lifecycle risk reduction",
    "Accountable reporting for responsible persons"
  ],
  security: [
    "Enterprise CCTV and access-control integration",
    "Monitoring support for operational resilience",
    "Security positioned around site risk",
    "Protection strategy aligned to fire and suppression priorities"
  ]
};

export const proofSignals: ProofSignal[] = [
  {
    title: "SAQCC competency signals",
    text: "Legacy Kharon material surfaces SAQCC Fire and SAQCC Gas proof points for fire and suppression workstreams.",
    status: "Competency"
  },
  {
    title: "Registered fire-system work",
    text: "Published company material states capability to design, install, commission and maintain fire alarm and evacuation systems.",
    status: "Fire systems"
  },
  {
    title: "Standards-led delivery",
    text: "Fire and security systems are positioned around relevant industry regulation, installation standards and maintainable handover evidence.",
    status: "Standards"
  }
];

export const supportedEcosystem: string[] = [
  "Bosch",
  "Advanced",
  "Ziton",
  "TechnoSwitch",
  "Kentec",
  "Apollo",
  "Hochiki",
  "Rotarex",
  "Inergen",
  "FM-200",
  "Novec",
  "Stat-X",
  "Paxton",
  "Gallagher",
  "Hikvision",
  "Impro",
  "Lenel S2",
  "Fire Eater",
  "GST"
];

export const complianceSignals: string[] = [
  "SANS 10139 alignment",
  "SANS 14520 alignment",
  "SAQCC proof signals",
  "Inspection-ready documentation",
  "Commercial & industrial only"
];

export const heroProofItems: string[] = [
  "Gas Suppression",
  "Fire Detection",
  "Commercial & Industrial",
  "SANS Alignment",
  "SAQCC Signals",
  "Lifecycle Support",
  "Emergency Pathway",
  "Mission-Critical Systems"
];
