const siteUrl = import.meta.env.PUBLIC_SITE_URL || "https://www.tequit.co.za";
const portalUrl = import.meta.env.PUBLIC_PORTAL_URL || "https://portal.tequit.co.za";
const contactEmail = import.meta.env.PUBLIC_CONTACT_EMAIL || "admin@kharon.co.za";

export const site = {
  name: "Kharon Fire and Security Solutions (Pty) Ltd",
  shortName: "Kharon",
  title: "Kharon Fire and Security Solutions",
  description:
    "Commercial and industrial fire detection, clean-agent gas suppression and compliance maintenance for critical environments.",
  url: siteUrl,
  portalUrl,
  portalStatus: "Open the secure Kharon operations portal for lifecycle records, dispatches, client systems and finance workspaces.",
  portalLoginPath: `${portalUrl}/portal/login`,
  email: contactEmail,
  phone: "061 545 8830",
  address: "Unit 58, M5 Freeway Park, Cnr Uppercamp & Berkley Rd, Ndabeni, Maitland, 7405",
  registration: "2016/313076/07",
  ogImage: "/og/kharon-og.png"
};

export const pageMeta = {
  home: {
    title: "Commercial & Industrial Fire Protection Specialists | Kharon",
    description:
      "Kharon designs, installs, services and maintains fire detection and gas suppression systems for commercial, industrial and mission-critical environments."
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

export const solutionLinks = [
  {
    label: "Gas Suppression",
    href: "/gas-suppression",
    summary:
      "Clean-agent and engineered suppression systems for server rooms, electrical rooms and sensitive operational assets."
  },
  {
    label: "Fire Detection",
    href: "/fire-detection",
    summary:
      "Addressable detection, control panels, response zones and fault diagnostics for commercial and industrial sites."
  },
  {
    label: "Compliance & Maintenance",
    href: "/compliance-maintenance",
    summary:
      "Inspection, servicing, reporting and lifecycle maintenance for accountable fire-system ownership."
  },
  {
    label: "Critical Infrastructure",
    href: "/critical-infrastructure",
    summary:
      "Infrastructure protection for data centres, control rooms, electrical rooms and high-consequence operational sites."
  },
  {
    label: "Integrated Security",
    href: "/security-systems",
    summary:
      "CCTV, access control and monitoring integrated as supporting infrastructure around fire protection priorities."
  }
];

export const mainLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Sectors", href: "/industries" },
  { label: "Compliance", href: "/compliance-maintenance" },
  { label: "Emergency", href: "/emergency-support" },
  { label: "Assessment Intake", href: "/contact?intent=site-assessment" }
];

export const sitemapPages = [
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
  "compliance"
];

export const industries = [
  {
    title: "Data centres and server rooms",
    risk: "Clean-agent suppression, early detection and uptime-sensitive response logic.",
    priority: "Continuity"
  },
  {
    title: "Telecoms and control rooms",
    risk: "Protected electronics, controlled release, alarm routing and fault visibility.",
    priority: "Signal integrity"
  },
  {
    title: "Electrical rooms and switchgear spaces",
    risk: "Rapid detection, asset protection and suppression methods that limit collateral damage.",
    priority: "Asset protection"
  },
  {
    title: "Logistics and warehousing",
    risk: "Large-volume detection coverage, evacuation signalling and inspection cadence.",
    priority: "Coverage"
  },
  {
    title: "Industrial and process facilities",
    risk: "Risk-segmented zones, rugged detection choices and maintenance access planning.",
    priority: "Process risk"
  },
  {
    title: "Utilities and critical infrastructure",
    risk: "Compliance records, escalation pathways and response logic for high-consequence assets.",
    priority: "Resilience"
  },
  {
    title: "Healthcare and commercial infrastructure",
    risk: "Occupancy-aware detection, documented servicing and continuity-sensitive protection.",
    priority: "Occupancy"
  },
  {
    title: "Control rooms and operations centres",
    risk: "Fire detection and suppression architecture for spaces coordinating wider site response.",
    priority: "Operational command"
  }
];

export const assuranceItems = [
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

export const trustModules = [
  {
    title: "Compliance records",
    text: "Inspection and service records remain available for responsible persons, insurers and operational review.",
    status: "Records",
    tone: "cyan"
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
    tone: "cyan"
  }
];

export const capabilityProof = {
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

export const proofSignals = [
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

export const supportedEcosystem = [
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

export const complianceSignals = [
  "SANS 10139 alignment",
  "SANS 14520 alignment",
  "SAQCC proof signals",
  "Inspection-ready documentation",
  "Commercial & industrial only"
];

export const heroProofItems = [
  "Gas Suppression",
  "Fire Detection",
  "Commercial & Industrial",
  "SANS Alignment",
  "SAQCC Signals",
  "Lifecycle Support",
  "Emergency Pathway",
  "Mission-Critical Systems"
];
