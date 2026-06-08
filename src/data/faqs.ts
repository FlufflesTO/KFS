/**
 * Centralised FAQ store. Each entry is reusable across resource and service pages
 * and drives FAQ JSON-LD via generateFAQSchema (see GuidePage / ServicePage).
 * Group with `category` (matches a service slug or a domain) to pull a focused set
 * onto a given page.
 */

export interface FAQData {
  id: string;
  q: string;
  a: string;
  category: string;
  status: "active" | "draft" | "archived";
}

export const faqs: Record<string, FAQData> = {
  responsible_person: {
    id: "responsible_person",
    category: "compliance",
    status: "active",
    q: "Who is legally responsible for fire-system compliance?",
    a: "The building owner or appointed responsible person carries the duty to keep fire and life-safety systems in working order and to keep evidence of inspection, servicing and any defect rectification. That duty can be supported by a competent service provider, but it cannot be delegated away. In practice, an insurer or auditor will ask the responsible person for the records — so the documentation has to exist and be current."
  },
  inspection_cadence: {
    id: "inspection_cadence",
    category: "compliance",
    status: "active",
    q: "How often must fire systems be inspected and serviced?",
    a: "Maintenance is a recurring process, not a single annual visit. As a rule of thumb, simple visual and functional checks are done monthly by an on-site person, more detailed inspections quarterly, and full competent-person servicing annually — with the exact tasks set by the standard for each system (SANS 10139 for detection, SANS 14520 for suppression, SANS 10114-2 for emergency lighting, SANS 1253 for fire doors). Our maintenance checklists break the cadence down system by system."
  },
  addressable_vs_conventional: {
    id: "addressable_vs_conventional",
    category: "fire-detection",
    status: "active",
    q: "What is the difference between addressable and conventional fire detection?",
    a: "Conventional detection reports a fire to a zone — a group of devices — but not which device triggered. Addressable detection gives every device a unique address, so the panel shows the exact location and reports faults at device level. For most commercial and industrial buildings, addressable is the better choice: faster location, granular fault reporting and the flexible cause-and-effect needed to drive suppression, dampers and evacuation."
  },
  gas_agent_choice: {
    id: "gas_agent_choice",
    category: "gas-suppression",
    status: "active",
    q: "Which gas suppression agent is right for my space?",
    a: "It depends on whether the room is occupied, the assets being protected and the space available for cylinders. Chemical clean agents (such as FM-200 or Novec 1230) act in seconds, leave no residue and need less storage. Inert gases (such as argon or IG-541 blends) are people-safe by design but need more cylinder space. CO₂ is effective but only suitable where occupancy can be excluded. We size the agent and design concentration to your specific room — and confirm the enclosure can actually hold it. See the gas suppression guide for detail."
  },
  room_integrity_test: {
    id: "room_integrity_test",
    category: "gas-suppression",
    status: "active",
    q: "Why does my server room need a room-integrity test?",
    a: "A gas suppression system only works if the enclosure holds the agent at design concentration for the required hold time. A room-integrity (door-fan) test measures how leaky the room is and predicts whether it will retain the agent. It is needed at commissioning and should be repeated periodically, because changes after handover — a new cable tray, an altered duct, a failed damper — can quietly defeat an otherwise correct system."
  },
  fire_door_compliance: {
    id: "fire_door_compliance",
    category: "fire-doors",
    status: "active",
    q: "What makes a fire door compliant?",
    a: "The fire rating belongs to the complete tested assembly: the rated leaf, a compatible frame, intumescent and smoke seals, rated hinges and hardware, a working self-closing device, and any matching glazing — all undamaged and within the tested gap tolerances, with evidence of the door's rating. Swapping in non-rated hardware, propping the door open, or letting seals fail can void the rating. Fire doors are governed by SANS 1253 and SANS 10400-T and need routine checks plus periodic competent inspection."
  },
  cctv_retention: {
    id: "cctv_retention",
    category: "cctv",
    status: "active",
    q: "How long should we keep CCTV footage?",
    a: "There is no single fixed period — set retention deliberately against operational need and any insurer or sector requirement, then size storage to match. Recorded footage is personal information under POPIA, so it must be handled lawfully: purpose-limited, access-controlled, kept no longer than needed, protected against misuse, and accompanied by signage notifying people that the area is monitored."
  },
  intrusion_grade: {
    id: "intrusion_grade",
    category: "intrusion-detection",
    status: "active",
    q: "What grade of intrusion alarm do we need?",
    a: "Intrusion systems under SANS 50131 are graded 1 to 4 according to the risk and the likely attacker's capability. The grade determines detection technology, tamper resistance and the alarm-signalling path. Matching the grade to the real risk matters both ways — under-grading leaves a gap, over-grading wastes budget — which is why we start from a risk assessment rather than a product."
  },
  access_control_egress: {
    id: "access_control_egress",
    category: "access-control",
    status: "active",
    q: "Will access control stop people escaping in a fire?",
    a: "It must not — and a correctly designed system never does. Under SANS 60839-11-1, access control is integrated with the fire system so that on a fire alarm, doors on escape routes fail to a safe state and people can always get out, while security is preserved elsewhere. Egress and life-safety always take precedence over security objectives."
  },
  integration: {
    id: "integration",
    category: "security-systems",
    status: "active",
    q: "Can fire and security systems be integrated?",
    a: "Yes, and there are real benefits: CCTV verifying an intrusion or access event, access control releasing on fire alarm, and a single point of monitoring all reduce response time and false dispatches. Integration must respect life-safety priorities — fire and egress always take precedence — and the connecting infrastructure follows the relevant installation standards. See the CCTV and security guide for how this is approached."
  },
  handover_documentation: {
    id: "handover_documentation",
    category: "compliance",
    status: "active",
    q: "What documentation should we receive after installation?",
    a: "A complete handover should give you everything needed to operate, maintain and prove the system: as-built drawings and zone plans, a verified cause-and-effect matrix, device-level commissioning test results, the commissioning or service certificate, operator instructions, and a recommended maintenance schedule. This is the evidence an insurer or auditor expects to see — incomplete documentation is treated as an incomplete system."
  },
  commercial_only: {
    id: "commercial_only",
    category: "general",
    status: "active",
    q: "Do you only work on commercial and industrial sites?",
    a: "Yes. Kharon designs, installs, services and maintains fire and security systems for commercial, industrial and critical-infrastructure environments — data centres, electrical rooms, warehousing, manufacturing, control rooms, healthcare and similar facilities. We do not position our work as consumer or residential security."
  }
};

/** All active FAQs as a {q, a} array, in declaration order. */
export function getFaqs(): { q: string; a: string }[] {
  return Object.values(faqs)
    .filter((f) => f.status === "active")
    .map((f) => ({ q: f.q, a: f.a }));
}

/** Active FAQs for a given category (e.g. a service slug or "compliance"). */
export function getFaqsByCategory(category: string): { q: string; a: string }[] {
  return Object.values(faqs)
    .filter((f) => f.status === "active" && f.category === category)
    .map((f) => ({ q: f.q, a: f.a }));
}
