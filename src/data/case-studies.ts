/**
 * Case study data — illustrative, representative engagements (anonymised / mock).
 * Structure per the agreed format: sector, problem, system, intervention,
 * documentation produced, outcome, proof, CTA.
 *
 * NOTE: These are representative examples for demonstration. They do not name real
 * clients. Keep claims technically accurate and defensible.
 */

export interface CaseStudy {
  slug: string;
  title: string;
  sector: string;
  /** route to the most relevant sector page */
  sectorHref?: string;
  problem: string;
  system: string;
  intervention: string;
  documentation: string[];
  outcome: string;
  /** optional headline metrics */
  metrics?: { label: string; value: string }[];
  /** optional proof image in /public */
  image?: string;
  imageAlt?: string;
  /** contact intent for the CTA */
  intent: string;
  /** related solution pages */
  related?: { label: string; href: string }[];
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "data-centre-clean-agent-upgrade",
    title: "Clean-agent suppression upgrade for a colocation data hall",
    sector: "Data Centres",
    sectorHref: "/sectors/data-centres",
    problem:
      "An ageing CO₂ system protected a live colocation hall, creating a personnel-safety risk and failing a tenant compliance audit.",
    system: "Gaseous suppression (SANS 14520) with addressable detection (SANS 10139) and HVAC interlock.",
    intervention:
      "Phased cut-over to an FM-200 clean-agent system with cross-zoned detection, room-integrity (fan) testing and an HVAC shutdown interlock — completed without taking the hall offline.",
    documentation: [
      "Room-integrity test certificate",
      "SANS 14520 design concentration calculation",
      "As-built detection zone drawings",
      "Commissioning and handover pack"
    ],
    outcome:
      "Passed the tenant compliance audit on re-inspection; personnel-safe agent with sub-10-second design concentration and zero downtime during cut-over.",
    metrics: [
      { label: "Hall downtime", value: "Minimal" },
      { label: "Audit result", value: "Pass" },
      { label: "Design concentration", value: "Compliant" }
    ],
    intent: "data-centre",
    related: [
      { label: "Gas Suppression", href: "/gas-suppression" },
      { label: "Fire Detection", href: "/fire-detection" }
    ]
  },
  {
    slug: "warehouse-detection-and-evacuation",
    title: "Detection and voice evacuation for a high-bay distribution centre",
    sector: "Warehousing & Logistics",
    sectorHref: "/sectors/warehousing-logistics",
    problem:
      "A high-bay distribution centre had patchy detection coverage and a bell-only alarm that was inaudible across the racking, risking slow evacuation.",
    system: "Addressable detection (SANS 10139) with voice evacuation / PA (SANS 60849, SANS 54-16).",
    intervention:
      "Re-zoned addressable detection for high-bay coverage and installed a voice-evacuation system with intelligible, zoned messaging and a clear egress sequence.",
    documentation: [
      "Detection coverage and zone plan",
      "Voice-alarm intelligibility report",
      "Evacuation cause-and-effect matrix",
      "Annual maintenance schedule"
    ],
    outcome:
      "Full audible and intelligible coverage across the facility; documented evacuation strategy accepted by the insurer.",
    metrics: [
      { label: "Coverage", value: "Comprehensive" },
      { label: "Intelligibility", value: "Pass" }
    ],
    intent: "warehousing",
    related: [
      { label: "Fire Detection", href: "/fire-detection" },
      { label: "PA / PE Systems", href: "/pa-pe-systems" }
    ]
  },
  {
    slug: "electrical-room-inert-gas-suppression",
    title: "Inert-gas suppression for a main switchgear and electrical room",
    sector: "Electrical Rooms",
    sectorHref: "/sectors/electrical-rooms",
    problem:
      "A main LV switchgear room protecting a continuous-process site had no automatic suppression, so an electrical fire risked extended outage and collateral damage to adjacent panels.",
    system: "Inert-gas suppression (SANS 14520) with addressable detection (SANS 10139) and HVAC damper interlock.",
    intervention:
      "Designed and installed an argon-based inert-gas system with cross-zoned detection, sized to the room volume and design concentration, with pre-discharge warning, abort station and automatic damper closure to preserve enclosure integrity.",
    documentation: [
      "SANS 14520 design concentration and cylinder sizing calculation",
      "Room-integrity (door-fan) test report",
      "Detection and release cause-and-effect matrix",
      "Commissioning certificate and operator instructions"
    ],
    outcome:
      "People-safe automatic protection for the switchgear room with verified hold time; detection and damper interlocks demonstrated at commissioning and accepted by the site's risk engineer.",
    metrics: [
      { label: "Agent", value: "People-safe" },
      { label: "Integrity test", value: "Pass" },
      { label: "Interlocks", value: "Verified" }
    ],
    intent: "electrical-rooms",
    related: [
      { label: "Gas Suppression", href: "/gas-suppression" },
      { label: "Electrical Rooms", href: "/sectors/electrical-rooms" }
    ]
  },
  {
    slug: "healthcare-detection-and-evacuation",
    title: "Occupancy-aware detection and voice evacuation for a healthcare facility",
    sector: "Healthcare & Commercial",
    sectorHref: "/sectors/healthcare-commercial",
    problem:
      "A multi-storey healthcare facility with dependent occupants needed reliable early detection and a phased, intelligible evacuation strategy that would not cause panic among patients.",
    system: "Addressable detection (SANS 10139) with voice evacuation (SANS 60849, SANS 54-16) and emergency lighting (SANS 10114-2).",
    intervention:
      "Installed addressable detection with multi-sensor devices in mixed clinical environments and a zoned voice-evacuation system supporting phased, staff-managed evacuation, with verified escape-route emergency lighting.",
    documentation: [
      "Detection coverage and zone plan",
      "Phased evacuation cause-and-effect matrix",
      "Voice-alarm intelligibility report",
      "Emergency-lighting duration-test record"
    ],
    outcome:
      "Early, location-specific detection with a controlled phased-evacuation strategy and intelligible messaging across all occupied zones; full handover documentation for the responsible person.",
    metrics: [
      { label: "Evacuation", value: "Phased" },
      { label: "Intelligibility", value: "Pass" },
      { label: "Coverage", value: "Comprehensive" }
    ],
    intent: "healthcare",
    related: [
      { label: "Fire Detection", href: "/fire-detection" },
      { label: "PA / PE Systems", href: "/pa-pe-systems" },
      { label: "Healthcare & Commercial", href: "/sectors/healthcare-commercial" }
    ]
  },
  {
    slug: "control-room-integrated-security",
    title: "Integrated CCTV, access and intrusion for an operations control room",
    sector: "Control Rooms",
    sectorHref: "/sectors/control-rooms",
    problem:
      "A site operations control room ran CCTV, access control and intrusion detection as disconnected systems, slowing verification and producing false dispatches.",
    system: "Integrated security: CCTV (SANS 62676), access control (SANS 60839-11-1) and intrusion detection (SANS 50131).",
    intervention:
      "Unified the three systems under a single monitoring view so intrusion and access events trigger associated camera verification, with access control configured to fail safe on fire alarm to protect egress.",
    documentation: [
      "CCTV coverage and image-quality plan",
      "Access-control configuration and fail-safe egress matrix",
      "Intrusion grading and signalling report",
      "Integration commissioning record"
    ],
    outcome:
      "Faster, camera-verified response to security events and fewer false dispatches, with egress protected on fire alarm; a single operator view across all three systems.",
    metrics: [
      { label: "Verification", value: "Unified" },
      { label: "Egress", value: "Fail-safe" },
      { label: "False dispatch", value: "Reduced" }
    ],
    intent: "integrated-security",
    related: [
      { label: "Integrated Security", href: "/security-systems" },
      { label: "CCTV", href: "/cctv" },
      { label: "Access Control", href: "/access-control" }
    ]
  },
  {
    slug: "fire-door-survey-and-remediation",
    title: "Fire-door survey and remediation across a multi-tenant building",
    sector: "Healthcare & Commercial",
    sectorHref: "/sectors/healthcare-commercial",
    problem:
      "A multi-tenant commercial building failed a compliance review on its fire doors — propped doors, failed seals and non-rated hardware compromised compartmentation.",
    system: "Fire-door assemblies and ironmongery (SANS 1253, SANS 10400-T, SANS 51155).",
    intervention:
      "Surveyed every fire door against its certification, then remediated defects: replaced intumescent and smoke seals, refitted rated hardware and self-closers, corrected gap tolerances and fitted alarm-released electromagnetic hold-opens where doors needed to stay open in normal use.",
    documentation: [
      "Door-by-door inspection schedule and defect register",
      "Remedial works record with before/after status",
      "Hardware and seal specification against ratings",
      "Remedial certification for completed assemblies"
    ],
    outcome:
      "Compartmentation restored across the building with a documented, door-by-door evidence trail; the building passed re-inspection.",
    metrics: [
      { label: "Doors surveyed", value: "Full set" },
      { label: "Re-inspection", value: "Pass" },
      { label: "Evidence", value: "Door-level" }
    ],
    intent: "fire-doors",
    related: [
      { label: "Fire Doors", href: "/fire-doors" },
      { label: "Architectural Ironmongery", href: "/architectural-ironmongery" }
    ]
  },
  {
    slug: "warehouse-access-control-upgrade",
    title: "Access-control upgrade with fire-safe egress for a distribution site",
    sector: "Warehousing & Logistics",
    sectorHref: "/sectors/warehousing-logistics",
    problem:
      "A distribution site relied on mechanical keys with no audit trail, and several secured doors on escape routes had no defined fail-safe behaviour in a fire.",
    system: "Electronic access control (SANS 60839-11-1) integrated with the fire detection system (SANS 10139).",
    intervention:
      "Installed electronic access control with credentialed entry and a full event audit trail, integrated with the fire panel so doors on escape routes release to a safe state on alarm while security is preserved elsewhere.",
    documentation: [
      "Access-control design and door schedule",
      "Fail-safe egress cause-and-effect matrix",
      "Integration test record with the fire system",
      "Commissioning certificate and operator instructions"
    ],
    outcome:
      "Auditable, credential-based access replacing mechanical keys, with verified fail-safe egress on every escape-route door confirmed at commissioning.",
    metrics: [
      { label: "Audit trail", value: "Full" },
      { label: "Egress", value: "Fail-safe" },
      { label: "Integration", value: "Verified" }
    ],
    intent: "access-control",
    related: [
      { label: "Access Control", href: "/access-control" },
      { label: "Integrated Security", href: "/security-systems" },
      { label: "Warehousing & Logistics", href: "/sectors/warehousing-logistics" }
    ]
  }
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug);
}
