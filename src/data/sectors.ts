export interface SectorData {
  id: string;
  meta: { title: string; description: string; };
  hero: { subtitle: string; title: string; description: string; icon: string; };
  overview: string;
  risks: { title: string; text: string; }[];
  systems: { label: string; href: string; text: string; }[];
  standards: string[];
  caseStudySlug?: string;
  intent: string;
  status: 'active' | 'draft' | 'archived';
}

export const sectors: Record<string, SectorData> = {
  "data-centres": {
    id: "data-centres",
    meta: {
      title: "Data Centre Fire Protection | Kharon",
      description: "Clean-agent gas suppression, very-early-warning detection and HVAC interlocks for data halls, server rooms and colocation facilities — designed for uptime and SANS 14520 compliance."
    },
    hero: {
      subtitle: "Sectors",
      title: "Data Centres",
      description: "Fire protection for data halls and server rooms that keeps suppression personnel-safe, avoids water near live IT load and holds up under tenant and insurer audits.",
      icon: "/brand/icons/sector-server-rack.svg"
    },
    overview: "Data centres protect concentrated, high-value IT load where a fire — or the wrong suppression method — means lost data, breached SLAs and failed tenant audits. We design clean-agent gaseous suppression with early-warning detection so a fault is caught and contained before it disrupts the hall. Detection, suppression release and HVAC are interlocked, and every system is handed over with the documentation a colocation operator needs for tenant and insurer review.",
    risks: [
      { title: "Continuity and SLA exposure", text: "Concentrated server load means a single incident can take down a hall and breach uptime commitments. Suppression has to act fast and leave equipment recoverable — water-based systems are unacceptable near live IT." },
      { title: "Personnel safety in occupied halls", text: "Legacy CO₂ systems pose a lethal risk to staff working in the room. Clean agents discharge at design concentrations that are safe for occupied spaces, with the discharge timing and integrity verified by test." },
      { title: "Audit and tenant compliance", text: "Colocation tenants and insurers demand evidence: room-integrity results, design-concentration calculations and as-built drawings. Missing documentation fails audits regardless of how well the hardware performs." }
    ],
    systems: [
      { label: "Gas Suppression", href: "/gas-suppression", text: "Clean-agent suppression (FM-200, Novec, inert gas) sized to SANS 14520 design concentrations, with room-integrity fan testing and a personnel-safe discharge profile." },
      { label: "Fire Detection", href: "/fire-detection", text: "Addressable and very-early-warning aspirating detection with cross-zoning to confirm a genuine event before suppression release." },
      { label: "Compliance & Maintenance", href: "/compliance-maintenance", text: "Scheduled servicing, agent-weight checks and integrity re-testing that keep the system audit-ready across its lifecycle." },
      { label: "Access Control", href: "/access-control", text: "Controlled entry to data halls and suppression zones, integrated so egress and door release remain safe during an alarm." }
    ],
    standards: ["SANS 10139", "SANS 246", "SANS 14520"],
    intent: "data-centre",
    caseStudySlug: "data-centre-clean-agent-upgrade",
    status: "active"
  },

  "electrical-rooms": {
    id: "electrical-rooms",
    meta: {
      title: "Electrical Room & Switchgear Fire Protection | Kharon",
      description: "Early detection and clean-agent suppression for switchrooms, MV/LV distribution and transformer spaces — limiting collateral damage and downtime to SANS 14520 and SANS 10142-1."
    },
    hero: {
      subtitle: "Sectors",
      title: "Electrical Rooms",
      description: "Protection for switchrooms, distribution boards and transformer spaces where an electrical fire develops fast and water-based response makes the damage worse.",
      icon: "/brand/icons/sector-switchgear.svg"
    },
    overview: "Electrical rooms concentrate energy, heat and ignition risk in a confined space. An arc fault or overheated connection can escalate before anyone is in the room, and conventional water suppression destroys switchgear and forces a long, costly rebuild. We design early detection paired with clean-agent suppression that catches incipient faults and extinguishes without leaving residue or conductive water on live equipment, keeping distribution recoverable and the site energised.",
    risks: [
      { title: "Rapid escalation from arc faults", text: "Overheated busbars, loose terminations and arc faults can develop into a fire in minutes, often in an unoccupied room. Detection has to identify heat and smoke early enough to act before switchgear is lost." },
      { title: "Collateral damage from the wrong agent", text: "Water and powder leave residue that corrodes and short-circuits switchgear, turning a contained fault into a full replacement. Clean agents extinguish without conductive or corrosive residue on energised equipment." },
      { title: "Downtime to critical distribution", text: "A switchroom outage can de-energise an entire facility. Protecting distribution assets keeps the rest of the site operational and avoids extended, expensive switchgear lead times." }
    ],
    systems: [
      { label: "Gas Suppression", href: "/gas-suppression", text: "Clean-agent and inert-gas suppression sized for switchroom volumes to SANS 14520, extinguishing without residue on live distribution equipment." },
      { label: "Fire Detection", href: "/fire-detection", text: "Addressable and aspirating detection tuned to pick up overheating and incipient smoke in dense electrical enclosures." },
      { label: "Compliance & Maintenance", href: "/compliance-maintenance", text: "Routine servicing, agent checks and detection testing coordinated around electrical-installation requirements and access constraints." },
      { label: "Fire Safety Signage", href: "/fire-safety-signage", text: "Clear room identification, suppression-release warning and escape signage for switchrooms and plant spaces." }
    ],
    standards: ["SANS 14520", "SANS 10142-1", "SANS 10108"],
    intent: "electrical-rooms",
    status: "active"
  },

  "warehousing-logistics": {
    id: "warehousing-logistics",
    meta: {
      title: "Warehouse & Logistics Fire Protection | Kharon",
      description: "Large-volume detection coverage and intelligible voice evacuation for high-bay warehouses and distribution centres — designed to SANS 10139 and SANS 60849."
    },
    hero: {
      subtitle: "Sectors",
      title: "Warehousing & Logistics",
      description: "Fire detection and voice evacuation for high-bay storage and distribution centres, where large open volumes and dense racking make early warning and clear egress hard to get right.",
      icon: "/brand/icons/sector-warehouse.svg"
    },
    overview: "Warehouses and distribution centres combine large open volumes, high-bay racking and a small, mobile workforce — conditions where smoke can travel far before it reaches a detector and a bell alone is inaudible across the floor. We design detection coverage matched to the building geometry and storage layout, paired with intelligible voice evacuation that gives staff clear, zoned instructions. The result is early warning across the full volume and an evacuation strategy that holds up to insurer and inspection scrutiny.",
    risks: [
      { title: "Coverage across large open volumes", text: "High ceilings and long sightlines dilute smoke before it reaches a point detector. Detection has to be zoned and positioned for the actual building geometry, not a generic grid, to give usable early warning." },
      { title: "Inaudible, unclear alarms", text: "Bell-only systems are drowned out by MHE and racking. Without intelligible voice messaging, staff spread across a large floor do not know where to go, slowing evacuation when minutes matter." },
      { title: "Rapid fire spread in dense racking", text: "Stacked, combustible stock and narrow aisles let a fire spread quickly and trap occupants. Early detection plus a documented evacuation sequence reduces the time between ignition and a clear floor." }
    ],
    systems: [
      { label: "Fire Detection", href: "/fire-detection", text: "Addressable detection zoned for high-bay coverage, with aspirating options where ceiling height defeats conventional point detectors." },
      { label: "PA / PE Systems", href: "/pa-pe-systems", text: "Voice evacuation and public address with zoned, intelligible messaging designed to SANS 60849 for clear, controlled egress." },
      { label: "Fire Safety Signage", href: "/fire-safety-signage", text: "Photoluminescent and illuminated escape signage that stays visible across long aisles and large floor plates." },
      { label: "CCTV", href: "/cctv", text: "Surveillance coverage for loading bays, yards and storage zones, supporting both security and incident review." }
    ],
    standards: ["SANS 10139", "SANS 60849", "SANS 10400-T"],
    intent: "warehousing",
    caseStudySlug: "warehouse-detection-and-evacuation",
    status: "active"
  },

  "industrial-facilities": {
    id: "industrial-facilities",
    meta: {
      title: "Industrial & Process Facility Fire Protection | Kharon",
      description: "Risk-segmented detection, rugged hardware selection and maintainable layouts for manufacturing and process plants — designed to SANS 10139, SANS 10108 and SANS 10400-T."
    },
    hero: {
      subtitle: "Sectors",
      title: "Industrial Facilities",
      description: "Fire detection and protection for manufacturing and process environments, where mixed hazards, harsh conditions and continuous operation make one-size-fits-all detection unreliable.",
      icon: "/brand/icons/sector-factory.svg"
    },
    overview: "Industrial and process facilities rarely present a single, uniform fire risk. Production lines, storage, plant rooms and hazardous-process areas each have different ignition sources, contaminants and access constraints. We segment the site into risk zones and select detection and protection suited to each — heat, flame or specialised detection where dust, fumes or temperature defeat standard smoke detectors. Layouts are planned for safe maintenance access during operation, and every zone is documented so the protection scheme stays defensible and serviceable.",
    risks: [
      { title: "Mixed and zone-specific hazards", text: "A single facility can span clean assembly areas, dusty stores and hazardous-process zones. Detection selected for one area will miss or false-alarm in another, so risk has to be segmented and addressed zone by zone." },
      { title: "Harsh environments defeat standard detection", text: "Dust, fumes, vibration and temperature swings blind or trip conventional smoke detectors. Rugged detection — heat, flame or aspirating with filtration — keeps coverage reliable where ordinary devices fail." },
      { title: "Maintenance access under continuous operation", text: "Plants that run around the clock can't shut down for awkward servicing. Detection and suppression have to be laid out so testing and maintenance happen safely without halting production." }
    ],
    systems: [
      { label: "Fire Detection", href: "/fire-detection", text: "Risk-segmented detection using heat, flame, smoke or aspirating devices matched to each zone's hazard and environmental conditions." },
      { label: "Gas Suppression", href: "/gas-suppression", text: "Engineered and clean-agent suppression for plant rooms, control cabinets and high-value process equipment to SANS 14520." },
      { label: "Compliance & Maintenance", href: "/compliance-maintenance", text: "Structured inspection and servicing scheduled around production windows, with records kept ready for audit and insurer review." },
      { label: "PA / PE Systems", href: "/pa-pe-systems", text: "Voice evacuation and public address that stay intelligible above process noise across large industrial floor areas." }
    ],
    standards: ["SANS 10139", "SANS 10108", "SANS 10400-T"],
    intent: "industrial",
    status: "active"
  },

  "control-rooms": {
    id: "control-rooms",
    meta: {
      title: "Control Room & Operations Centre Fire Protection | Kharon",
      description: "Detection, clean-agent suppression and integrated security for control rooms and operations centres that must keep running through an incident — to SANS 10139 and SANS 62676."
    },
    hero: {
      subtitle: "Sectors",
      title: "Control Rooms",
      description: "Fire protection and security for control rooms and operations centres — the spaces that have to stay staffed and operational while they coordinate the wider site's response.",
      icon: "/brand/icons/sector-control-room.svg"
    },
    overview: "A control room or operations centre is the space a site depends on during any incident, so its own protection cannot force an evacuation or knock out the consoles that run the response. We design early detection with clean-agent suppression that is safe for continuously occupied rooms and leaves electronics intact, integrated with the access control and surveillance that govern who reaches a sensitive space. The aim is a room that detects and contains a fault while staff keep operating, backed by documentation for audit.",
    risks: [
      { title: "Continuous occupancy and operation", text: "Control rooms are staffed around the clock and can't simply be evacuated and powered down. Suppression must be personnel-safe at design concentration and detection must avoid nuisance trips that disrupt operations." },
      { title: "Sensitive electronics and consoles", text: "Video walls, consoles and comms equipment are intolerant of water and powder. Clean-agent suppression extinguishes without residue, keeping the room's monitoring and coordination capability intact." },
      { title: "Access and physical security", text: "Operations centres hold sensitive systems and need controlled, auditable entry. Access control and surveillance must integrate with fire and egress so security never compromises safe evacuation." }
    ],
    systems: [
      { label: "Fire Detection", href: "/fire-detection", text: "Early and very-early-warning detection with cross-zoning to confirm genuine events and avoid disruptive false alarms in a staffed room." },
      { label: "Gas Suppression", href: "/gas-suppression", text: "Clean-agent suppression safe for continuously occupied control rooms, extinguishing without residue on consoles and comms equipment." },
      { label: "CCTV", href: "/cctv", text: "Surveillance design and retention to SANS 62676 for the operations centre and the wider areas it monitors." },
      { label: "Access Control", href: "/access-control", text: "Auditable electronic access to sensitive control spaces, integrated to SANS 60839-11-1 so egress stays safe during an alarm." }
    ],
    standards: ["SANS 10139", "SANS 62676", "SANS 60839-11-1"],
    intent: "control-rooms",
    status: "active"
  },

  "healthcare-commercial": {
    id: "healthcare-commercial",
    meta: {
      title: "Healthcare & Commercial Fire Protection | Kharon",
      description: "Occupancy-aware detection, phased evacuation and documented servicing for hospitals, clinics and commercial buildings — designed to SANS 10139, SANS 322 and SANS 14520."
    },
    hero: {
      subtitle: "Sectors",
      title: "Healthcare & Commercial",
      description: "Fire protection for hospitals, clinics and commercial buildings, where occupants may be unable to self-evacuate and continuity of care or business cannot stop for the wrong alarm.",
      icon: "/brand/icons/sector-healthcare.svg"
    },
    overview: "Healthcare and commercial buildings carry mixed occupancy — patients who can't self-evacuate, visitors unfamiliar with the building and staff who must keep services running. A blanket evacuation can be as harmful as the fire, so detection and alarm strategy have to support phased, defend-in-place response in clinical areas while protecting server rooms and plant. We design occupancy-aware detection, dependable evacuation signalling and a documented servicing regime that keeps the responsible person, insurers and health authorities satisfied.",
    risks: [
      { title: "Occupants who can't self-evacuate", text: "Patients in wards, theatres and high-dependency areas can't be moved quickly. Detection and alarm strategy must support phased evacuation and defend-in-place rather than forcing a single full-building clearance." },
      { title: "Continuity of care and business", text: "False alarms and unnecessary evacuations disrupt clinical care and trading. Reliable, cross-zoned detection reduces nuisance trips while still catching genuine events early." },
      { title: "Documented compliance for responsible persons", text: "Hospitals and commercial landlords carry a clear duty of care and recurring audits. Servicing, testing and defect records have to be complete and current to satisfy insurers and health authorities." }
    ],
    systems: [
      { label: "Fire Detection", href: "/fire-detection", text: "Addressable, occupancy-aware detection supporting phased evacuation and defend-in-place strategies in clinical and mixed-use buildings." },
      { label: "PA / PE Systems", href: "/pa-pe-systems", text: "Voice evacuation with phased, intelligible messaging that directs staff and visitors without triggering unnecessary full-building clearance." },
      { label: "Gas Suppression", href: "/gas-suppression", text: "Clean-agent suppression to SANS 14520 for server rooms, records stores and critical plant within healthcare and commercial sites." },
      { label: "Compliance & Maintenance", href: "/compliance-maintenance", text: "Structured servicing, testing and defect records that keep the responsible person audit-ready throughout the system lifecycle." }
    ],
    standards: ["SANS 10139", "SANS 322", "SANS 14520"],
    intent: "healthcare",
    status: "active"
  }
};

/** Helper to get a sector by route slug */
export function getSector(slug: string): SectorData | undefined {
  return sectors[slug];
}
