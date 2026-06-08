/**
 * Centralised service-page content store.
 * Each key matches the route slug; pages import and pass to ServicePage layout.
 */

export interface ServiceData {
  id: string;
  meta: { title: string; description: string };
  hero: { subtitle: string; title: string; description: string; icon: string };
  overview: string;
  problem: { heading: string; body: string; points: string[] };
  capabilitiesHeading?: string;
  capabilities: { title: string; text: string }[];
  standards: string[];
  faqs?: { q: string; a: string }[];
  caseStudySlug?: string;
  intent: string;
  /** optional DisclaimerNote variant to render before WhatHappensNext */
  disclaimerVariant?: "sans" | "privacy" | "sla" | "case-study" | "product-suitability" | "fire-door";
  leadMagnetId?: string;
  status: "active" | "draft" | "archived";
}

export const services: Record<string, ServiceData> = {
  "fire-detection": {
    id: "fire-detection",
    meta: {
      title: "Fire Detection Systems: Design, Install & Maintain | Kharon",
      description: "Addressable and specialist fire detection designed for early, reliable warning. Engineered and maintained to SANS 10139, SANS 322, SANS 246 and EN 54."
    },
    hero: {
      subtitle: "Fire Protection",
      title: "Fire Detection",
      description: "Addressable and specialist detection systems engineered for early, reliable warning and precise fault location across complex sites.",
      icon: "/brand/icons/service-fire-detection.svg"
    },
    overview: "We design, install and maintain fire-detection systems that identify a fire early and drive the right response. The work spans detector selection for the environment, addressable zoning, cause-and-effect programming, and integration with alarms, suppression and building systems — engineered and documented to SANS 10139.",
    problem: {
      heading: "Late detection and nuisance alarms both cost you — one in damage, the other in trust.",
      body: "Detection that triggers too late gives occupants no margin and lets a fire take hold. Detection that triggers too often trains people to ignore it and prompts staff to disable devices. Both come down to the same root cause: detectors and zoning that were not matched to the actual environment. Reliable early warning depends on selecting the right detection technology for each space and proving the system end to end.",
      points: [
        "Standard smoke detectors in dusty, humid or high-airflow areas cause repeated false alarms.",
        "Coarse zoning that cannot pinpoint where an event is, slowing response and investigation.",
        "Detection that is not linked to a defined cause-and-effect, so an alarm triggers nothing useful.",
        "Systems that are installed and forgotten, with no maintenance record when an inspection arrives."
      ]
    },
    capabilities: [
      { title: "Addressable detection", text: "Individually addressed devices for precise fault and event location, maintainable layouts and clear zone reporting, designed to SANS 10139." },
      { title: "Specialist detection", text: "Aspirating smoke detection, flame and linear heat detection for high-airflow, high-ceiling or harsh environments where point detectors are unreliable." },
      { title: "Environment-matched device selection", text: "Detector type chosen for each space — including electronic-equipment areas (SANS 246) and hospital environments (SANS 322) — to give early warning without nuisance alarms." },
      { title: "Cause-and-effect logic", text: "Programmed response logic that maps each detection event to defined actions: alarms, suppression release, HVAC shutdown and interlocks, documented as a cause-and-effect matrix." },
      { title: "Panel integration and monitoring", text: "Centralised control with event logging, fault diagnostics and remote monitoring so faults are seen and acted on, not discovered at the next inspection." },
      { title: "Maintenance and certification", text: "Scheduled servicing, testing and a documented maintenance record that keeps the system compliant and defensible for insurers and authorities." }
    ],
    standards: ["SANS 10139", "SANS 322", "SANS 246", "SANS 54 (EN 54)"],
    intent: "fire-detection",
    faqs: [
      { q: "What is the difference between addressable and conventional detection?", a: "A conventional system reports an alarm by zone, so you know roughly where but not which device. An addressable system identifies the exact device, giving faster location of both alarms and faults. For anything beyond a small, simple site we design addressable systems for this reason." },
      { q: "How do you reduce false alarms?", a: "Most false alarms come from the wrong detector in the wrong place. We match detection technology to each environment — for example aspirating detection in high-airflow areas — and use cause-and-effect logic and verification so a single transient event does not trigger a full response." },
      { q: "Can detection trigger suppression and shut down equipment?", a: "Yes. We program a cause-and-effect matrix so a confirmed event can release suppression, shut down HVAC and trigger interlocks in the correct sequence. This is documented and tested at commissioning." }
    ],
    caseStudySlug: "data-centre-clean-agent-upgrade",
    status: "active"
  },

  "gas-suppression": {
    id: "gas-suppression",
    meta: {
      title: "Gas Suppression: Clean-Agent & Gaseous Systems | Kharon",
      description: "Engineered clean-agent and gaseous fire suppression for server rooms, switchrooms and archives. Designed, integrity-tested and maintained to SANS 14520."
    },
    hero: {
      subtitle: "Fire Protection",
      title: "Gas Suppression",
      description: "Clean-agent and gaseous suppression engineered to put out a fire fast, without water or residue, in spaces where downtime and damage are unacceptable.",
      icon: "/brand/icons/service-fire-suppression.svg"
    },
    overview: "We design, install and maintain gaseous fire-suppression systems for spaces where water would cause as much harm as the fire — server rooms, switchrooms, control centres and archives. The work covers agent selection, design-concentration calculation, room-integrity testing and integration with detection, so the system reaches and holds the concentration needed to extinguish a fire safely.",
    problem: {
      heading: "Water-based suppression protects the building. It can destroy what's inside it.",
      body: "In a data hall, switchroom or archive, the assets at risk are the electronics and records themselves. A sprinkler discharge — or an older CO₂ system that is unsafe around people — can mean the fire is out but the room is a write-off, or staff cannot safely be present. Gaseous suppression extinguishes the fire without residue, but only works if the agent reaches design concentration and the room holds it long enough. That depends on accurate design and a sealed enclosure, both of which must be proven, not assumed.",
      points: [
        "Sprinkler or mist discharge in a server room damages the very assets it protects.",
        "Legacy CO₂ systems create a personnel-safety hazard in occupied spaces.",
        "An under-sized or wrongly calculated system never reaches the concentration needed to extinguish.",
        "A leaky enclosure lets the agent escape before it can hold, so the fire reignites."
      ]
    },
    capabilities: [
      { title: "Total-flooding clean-agent systems", text: "Volume protection for server rooms, control centres and archives using clean agents that suppress fire without residue and reach design concentration quickly, designed to SANS 14520." },
      { title: "In-cabinet and localised protection", text: "Targeted suppression for high-value switchgear and individual racks, detecting and suppressing within the enclosure before a fire spreads to the wider room." },
      { title: "Design-concentration calculation", text: "Agent quantity and discharge calculated for the protected volume and hazard, so the system reaches and holds the concentration required to extinguish the fire." },
      { title: "Room-integrity (fan) testing", text: "Enclosure integrity testing to confirm the room holds the agent for the required retention time, with results documented as part of the handover." },
      { title: "Detection and interlock integration", text: "Cross-zoned detection, HVAC shutdown and damper interlocks programmed into a cause-and-effect matrix so discharge happens only on a confirmed event, in the right sequence." },
      { title: "Commissioning, certification and maintenance", text: "Design calculations, integrity certificates and as-built drawings handed over, with scheduled servicing that keeps the system compliant and defensible." }
    ],
    standards: ["SANS 14520", "SANS 15779", "SANS 13565", "SANS 306-4", "SANS 10108"],
    intent: "gas-suppression",
    faqs: [
      { q: "Is gaseous suppression safe to use in occupied rooms?", a: "Clean-agent systems are designed to extinguish fire at concentrations that are safe for people, which is why they have largely replaced older CO₂ systems in occupied spaces. Design concentration, room exhaust and warning signals are all set so the space can be protected without endangering occupants." },
      { q: "Why does the room have to be integrity-tested?", a: "A gaseous system only works if the enclosure holds the agent at design concentration for the required retention time. A fan (room-integrity) test measures how well the room seals and identifies leakage paths to fix. Without it, the agent can escape before the fire is fully out." },
      { q: "Can we replace an old CO₂ system without taking the room offline?", a: "Often, yes. A phased cut-over to a clean-agent system can be planned around a live environment, with detection and interlocks staged so protection is maintained throughout. We assess the room and set out a cut-over sequence before any work begins." }
    ],
    caseStudySlug: "data-centre-clean-agent-upgrade",
    status: "active"
  },

  "pa-pe-systems": {
    id: "pa-pe-systems",
    meta: {
      title: "Public Address & Voice Evacuation Systems | Kharon",
      description: "Voice evacuation and public address systems engineered for clear, intelligible messaging across large sites. Aligned to SANS 60849, SANS 54-16 and SANS 54-24."
    },
    hero: {
      subtitle: "Fire Protection",
      title: "Public Address & Voice Evacuation",
      description: "Voice-alarm and public-address systems that deliver intelligible, zoned instructions so occupants know what to do and where to go during an incident.",
      icon: "/brand/icons/service-fire-detection.svg"
    },
    overview: "We design, install and maintain voice-alarm (VA) and public-address (PA) systems that turn an alarm condition into clear spoken instructions. The work covers acoustic assessment, amplifier and loudspeaker design, zoning, and integration with fire detection so that the right message reaches the right area at the right time.",
    problem: {
      heading: "A bell tells people something is wrong. It does not tell them what to do.",
      body: "On large or complex sites, tone-only alarms are often inaudible over background noise and give occupants no direction. The result is hesitation, crowding at the wrong exits, and slow evacuation. A voice-evacuation system replaces ambiguity with specific, intelligible instructions, but only if it is designed for the acoustics of the space and proven to be understood.",
      points: [
        "Tone-only alarms are inaudible across high-bay racking, plant rooms and noisy production floors.",
        "Poor loudspeaker placement and reverberant spaces produce announcements that cannot be understood.",
        "Without zoning, every area hears the same message, causing congestion instead of orderly egress.",
        "Systems that are never intelligibility-tested can pass a visual inspection yet fail when it matters."
      ]
    },
    capabilities: [
      { title: "Acoustic and intelligibility design", text: "Loudspeaker layout and amplifier sizing based on the room's acoustics and background noise, designed to meet the speech-intelligibility targets in SANS 60849 and verified on commissioning." },
      { title: "Zoned message control", text: "Independently addressable zones so each area receives the correct alert, evacuate or all-clear message, supporting phased evacuation strategies where required." },
      { title: "Integration with fire detection", text: "The voice-alarm system is driven by the detection cause-and-effect matrix, so a confirmed event automatically triggers the correct sequence of messages without manual intervention." },
      { title: "Pre-recorded and live messaging", text: "Pre-recorded evacuation and alert messages for consistency, plus a controlled live-paging facility for marshals and emergency responders to give real-time instructions." },
      { title: "Monitored, fault-tolerant lines", text: "Continuously monitored loudspeaker circuits and standby power so a single cable or amplifier fault is reported and does not silence a whole zone." },
      { title: "Commissioning and documentation", text: "Intelligibility measurements, zone plans and a cause-and-effect matrix handed over as a defensible record for insurers, consultants and authorities." }
    ],
    standards: ["SANS 60849", "SANS 54-16", "SANS 54-24"],
    intent: "pa-pe",
    faqs: [
      { q: "What is the difference between a public address and a voice-evacuation system?", a: "A public-address system distributes general announcements. A voice-evacuation system is a life-safety system: its messages, zoning, monitoring and power supply are engineered and tested to deliver intelligible evacuation instructions during a fire. We design PA and VA so they work together where a single platform serves both functions." },
      { q: "How do you prove the system can actually be understood?", a: "Intelligibility is measured on site at commissioning rather than assumed from the design. We document the results against the speech-intelligibility targets in SANS 60849 and include them in the handover pack." },
      { q: "Can a voice-evacuation system be added to our existing fire alarm?", a: "Often, yes. We assess the existing detection panel and cause-and-effect logic to confirm it can drive a voice-alarm system, then design the loudspeaker and amplifier layout for your spaces. Where the panel cannot support it, we set out the upgrade options." }
    ],
    caseStudySlug: "warehouse-detection-and-evacuation",
    status: "active"
  },

  "fire-safety-signage": {
    id: "fire-safety-signage",
    meta: {
      title: "Fire Safety Signage & Photoluminescent Wayfinding | Kharon",
      description: "Compliant fire-safety signage and photoluminescent escape-route marking, surveyed and specified to SANS 1186 and SANS 10400-T."
    },
    hero: {
      subtitle: "Fire Protection",
      title: "Fire Safety Signage",
      description: "Escape-route, equipment and prohibition signage specified, sized and positioned so people can find their way out and locate fire equipment under stress.",
      icon: "/brand/icons/service-engineering.svg"
    },
    overview: "We survey, specify and install fire-safety signage and photoluminescent wayfinding so that escape routes, fire equipment and hazards are clearly identified throughout a building. The work covers the correct symbols, sizing for viewing distance, mounting heights and placement consistent with SANS 1186 and the building regulations in SANS 10400-T.",
    problem: {
      heading: "Signage is the cheapest part of a fire strategy and the first thing an inspection fails on.",
      body: "Signs are often added piecemeal over a building's life: wrong symbols, faded boards, signage hidden behind stock or fittings, and exit markings that disappear the moment the lights go out. In an emergency, occupants who do not know the building rely entirely on these signs. When they are inconsistent or invisible, people miss exits and cannot find extinguishers or call points.",
      points: [
        "Outdated or non-standard symbols that occupants and inspectors do not recognise.",
        "Signs sized or mounted for the wrong viewing distance, so they cannot be read in time.",
        "Escape-route markings that are unreadable in smoke or a power failure.",
        "Fire equipment and call points with no location signage, delaying response."
      ]
    },
    capabilities: [
      { title: "Signage survey and gap analysis", text: "A walk-through of escape routes, final exits, fire-equipment points and hazard areas against SANS 1186 and SANS 10400-T, producing a schedule of what is missing, non-compliant or in the wrong place." },
      { title: "Correct symbols and sizing", text: "Standardised safety symbols selected and sized for the actual viewing distance and mounting height, so signs are legible from where occupants will see them." },
      { title: "Photoluminescent wayfinding", text: "Low-level and escape-route photoluminescent marking that stays visible in smoke or a power failure, complementing emergency lighting along the route to a final exit." },
      { title: "Escape-route and exit identification", text: "Consistent directional and exit signage that resolves ambiguous junctions and dead-ends, guiding occupants to the nearest safe exit." },
      { title: "Equipment and hazard marking", text: "Clear identification of extinguishers, hose reels, call points and hazards so responders and occupants can locate equipment quickly." },
      { title: "Documented sign schedule", text: "An as-installed sign schedule and floor plan that supports inspections and gives facilities teams a maintainable record of every sign on site." }
    ],
    standards: ["SANS 1186-1", "SANS 1186-3", "SANS 1186-5", "SANS 10400-T"],
    intent: "signage",
    faqs: [
      { q: "Do photoluminescent signs replace emergency lighting?", a: "No. Photoluminescent wayfinding complements emergency lighting; it remains visible during a power failure and in low smoke conditions but does not replace illuminated escape-route lighting. We specify the two to work together along the escape route." },
      { q: "How is the correct sign size decided?", a: "Sign size is driven by the maximum viewing distance to that sign and the relevant SANS 1186 requirements. We measure each location during the survey rather than fitting a single size everywhere." },
      { q: "Can you bring an older building's signage up to standard?", a: "Yes. We carry out a gap analysis against SANS 1186 and SANS 10400-T, then provide a prioritised schedule so signage can be corrected in a planned, budgeted way rather than all at once." }
    ],
    status: "active"
  },

  "fire-doors": {
    id: "fire-doors",
    meta: {
      title: "Fire Doors: Supply, Installation & Inspection | Kharon",
      description: "Certified fire doors supplied, installed and inspected as complete assemblies — leaf, frame, ironmongery and seals — to SANS 1253 and SANS 10400-T."
    },
    hero: {
      subtitle: "Fire Protection",
      title: "Fire Doors",
      description: "Fire-rated doorsets supplied, installed and inspected as complete, certified assemblies so they hold back fire and smoke for the rated period.",
      icon: "/brand/icons/service-engineering.svg"
    },
    overview: "We supply, install and inspect fire doors as complete certified assemblies — the leaf, frame, intumescent and smoke seals, hinges, closers and other ironmongery. A fire door only performs to its rating when every component is compatible and correctly fitted, so we treat the doorset as a single tested system rather than a collection of parts.",
    problem: {
      heading: "A fire door is only fire-rated if the whole assembly is — and most fail on the details.",
      body: "Fire doors are routine to look at and easy to compromise. A replaced closer, a packed-out gap, a painted-over seal or a wedge holding it open can void the rating of an otherwise sound door. Because the failures are small and incremental, they pass unnoticed until an inspection or, worse, a fire finds the weak point. Compliance depends on the complete assembly being correct and demonstrably maintained.",
      points: [
        "Gaps around the leaf outside tolerance, letting smoke and fire bypass the seals.",
        "Non-compatible or missing ironmongery that voids the doorset's tested rating.",
        "Intumescent and smoke seals damaged, painted over, or never fitted.",
        "Self-closing devices removed or defeated, leaving doors propped open."
      ]
    },
    capabilities: [
      { title: "Certified doorset supply", text: "Fire-rated doorsets supplied as tested assemblies with the leaf, frame and seals matched to the required rating, so the installed door reflects what was actually tested." },
      { title: "Compliant installation", text: "Installation to the manufacturer's certified detail, with gap tolerances, frame fixings and seals fitted correctly so the door performs to its rated period in line with SANS 1253." },
      { title: "Controlled door hardware", text: "Hinges, closers and latching specified to be compatible with the doorset and rated for self-closing performance, including controlled closing devices to SANS 51155 where required." },
      { title: "Inspection and condition surveys", text: "Systematic fire-door inspections against gap tolerances, seal condition, ironmongery and closing function, producing a defect register prioritised by risk." },
      { title: "Remedial works", text: "Correction of common failures — adjusting gaps, replacing seals and non-compatible hardware, and reinstating self-closing devices — to return the assembly to its rated condition." },
      { title: "Records and labelling", text: "An inspection record and door schedule that gives facilities teams a defensible, maintainable register of every fire door and its current condition." }
    ],
    standards: ["SANS 1253", "SANS 10400-T", "SANS 51155"],
    intent: "fire-doors",
    faqs: [
      { q: "Why can't we just replace a fire door's closer or handle ourselves?", a: "A fire door is certified as a complete assembly. Fitting hardware that was not part of the tested doorset, or installing it incorrectly, can void the door's rating. We specify compatible, rated hardware and record the change so the assembly stays certifiable." },
      { q: "How often should fire doors be inspected?", a: "Inspection frequency depends on the building's use and traffic; high-traffic doors degrade faster. We recommend a routine schedule and set it out after surveying your doors, with the inspection record forming the basis of ongoing maintenance." },
      { q: "Can existing fire doors be repaired rather than replaced?", a: "Frequently, yes. Many failures — gaps, damaged seals, missing or defeated closers — are remediable and far cheaper than replacement. Where a leaf or frame is damaged beyond the certified tolerance, we recommend replacement and explain why." }
    ],
    disclaimerVariant: "fire-door",
    caseStudySlug: "fire-door-survey-and-remediation",
    status: "active"
  },

  "cctv": {
    id: "cctv",
    meta: {
      title: "CCTV & Video Surveillance | Kharon Fire & Security",
      description: "IP CCTV and video surveillance design, installation and maintenance aligned to SANS 62676. HD cameras, recording, remote viewing and analytics for commercial, industrial and critical sites."
    },
    hero: {
      subtitle: "Security",
      title: "CCTV & Video Surveillance",
      description: "IP video surveillance designed for real coverage, clear recordings and evidence you can rely on — specified, installed and maintained to SANS 62676.",
      icon: "/brand/icons/service-cctv.svg"
    },
    overview: "We design, install and maintain IP CCTV systems for commercial, industrial and critical-infrastructure sites. That covers camera selection and placement, network and storage design, recording retention, remote and mobile viewing, and ongoing maintenance — built to give usable images day and night, not just cameras on a wall.",
    problem: {
      heading: "Most CCTV fails when you actually need the footage",
      body: "Cameras get installed, but coverage has blind spots, night images are unusable, storage overwrites the clip you needed, or the recorder has been offline for weeks without anyone noticing. The result is an investment that does not stand up at the moment it matters.",
      points: [
        "Blind spots and poor camera placement leaving entries, yards and high-value areas uncovered.",
        "Insufficient resolution or low-light performance, producing footage that cannot identify a person or plate.",
        "Recording retention too short, or storage not sized for the camera count and frame rate.",
        "No health monitoring, so failed cameras or a stopped recorder go unnoticed until footage is needed."
      ]
    },
    capabilities: [
      { title: "Site survey and coverage design", text: "We survey the site, map field-of-view against the areas and detail you need (detect, recognise or identify), and design camera placement to remove blind spots across perimeters, entrances and internal zones." },
      { title: "IP cameras and lenses", text: "Fixed, varifocal, dome, bullet and PTZ cameras selected for the scene — including low-light and infrared models for night coverage, and wide-dynamic-range cameras for high-contrast entrances and loading bays." },
      { title: "Recording, storage and retention", text: "Network video recorders and storage sized for your camera count, resolution, frame rate and required retention period, with RAID and redundancy options where continuity matters." },
      { title: "Remote and mobile viewing", text: "Secure live and recorded access from desktop and mobile, with role-based user accounts so the right people see the right cameras, and controlled export of evidence clips." },
      { title: "Video analytics", text: "Where it adds value: line-crossing, intrusion zones, loitering and people or vehicle classification to cut nuisance alerts and surface events that need attention, rather than hours of footage to review." },
      { title: "Maintenance and health monitoring", text: "Scheduled servicing, firmware updates, lens cleaning and recording verification, with health monitoring that flags offline cameras or a stopped recorder before you need the footage." }
    ],
    standards: ["SANS 62676"],
    intent: "cctv",
    faqs: [
      { q: "How long is footage kept?", a: "Retention is a design decision driven by camera count, resolution, frame rate and your operational or insurance requirements. We size storage to your target retention period — typically measured in weeks — and confirm it in the system design." },
      { q: "Can CCTV integrate with our access control and alarms?", a: "Yes. CCTV is most effective as part of an integrated platform, where camera events link to access control and intrusion detection. See our Integrated Security page for how the systems work together." },
      { q: "Do you maintain existing CCTV installations?", a: "We do. We can assess an existing system, identify coverage gaps and recording issues, and put a maintenance schedule in place — or plan a phased upgrade where the current equipment no longer meets requirements." }
    ],
    disclaimerVariant: "privacy",
    status: "active"
  },

  "intrusion-detection": {
    id: "intrusion-detection",
    meta: {
      title: "Intrusion Detection Systems | Kharon Fire & Security",
      description: "Intrusion detection and alarm systems designed, installed and maintained to SANS 50131. Perimeter and internal detection, zoning, monitoring and signalling for commercial, industrial and critical sites."
    },
    hero: {
      subtitle: "Security",
      title: "Intrusion Detection",
      description: "Alarm systems that detect entry reliably and signal it without delay — designed, installed and maintained to SANS 50131, with detection chosen for the way your site is actually used.",
      icon: "/brand/icons/service-cctv.svg"
    },
    overview: "We design, install and maintain intrusion detection and alarm systems for commercial, industrial and critical-infrastructure sites. That includes perimeter and internal detection, control panels and zoning, tamper protection, and monitoring and signalling — engineered to catch genuine intrusion while keeping false alarms low.",
    problem: {
      heading: "An alarm only protects you if it detects, and is trusted",
      body: "Systems that cry wolf get ignored, and partial coverage leaves an obvious way in. Frequent false activations erode response, while gaps in detection or a signalling path that can be cut quietly mean a real break-in goes unanswered.",
      points: [
        "False alarms from poor detector choice or placement, leading to ignored activations and lost response.",
        "Coverage gaps at perimeters, roof access, service doors or internal high-value areas.",
        "No zoning, so an alarm tells you the site is breached but not where to look.",
        "Single, unmonitored signalling path that can fail or be defeated without anyone knowing."
      ]
    },
    capabilities: [
      { title: "Risk-based detection design", text: "We assess the site, its layout and how it is used, then design detection to match — so coverage follows the real risk and detector choice suits each space, keeping false activations low." },
      { title: "Perimeter and internal detection", text: "Door and window contacts, passive infrared and dual-technology motion detectors, beam and external detection, and vibration or shock sensors for walls, safes and high-value assets." },
      { title: "Control panels and zoning", text: "Grade-appropriate control panels with clear zoning, part-set options for occupied and out-of-hours use, and tamper protection across devices and wiring." },
      { title: "Monitoring and signalling", text: "Connection to a monitoring centre with dual-path signalling (network and cellular) so a single failure or cut line does not silence the system, with verified alarm handling to support response." },
      { title: "Integration with CCTV and access control", text: "Alarm events can trigger camera recording and bookmarks and tie into access control, so an activation comes with visual verification and context. See our Integrated Security page." },
      { title: "Maintenance and testing", text: "Scheduled servicing, battery and detector testing, walk-tests and signalling verification, with records kept so the system stays reliable and demonstrably maintained." }
    ],
    standards: ["SANS 50131"],
    intent: "intrusion",
    faqs: [
      { q: "How do you reduce false alarms?", a: "False alarms usually come from the wrong detector in the wrong place. We match detector technology to each space, position devices to avoid common triggers, use dual-technology detectors where appropriate, and commission with walk-tests before handover." },
      { q: "Can the alarm be monitored off-site?", a: "Yes. We connect the system to a monitoring centre with dual-path signalling over network and cellular, so an activation is reported even if one path fails, supporting a timely response." },
      { q: "Can it work with our CCTV?", a: "It can. Linking intrusion detection to CCTV gives visual verification of an activation — cameras record and bookmark the event so responders see what triggered the alarm and where." }
    ],
    status: "active"
  },

  "access-control": {
    id: "access-control",
    meta: {
      title: "Access Control Systems | Kharon Fire & Security",
      description: "Electronic access control design, installation and maintenance aligned to SANS 60839-11-1. Readers, controllers, doors and audit trails — with fire-alarm release and fail-safe egress built in."
    },
    hero: {
      subtitle: "Security",
      title: "Access Control",
      description: "Control who goes where, keep an audit trail, and never trap anyone in a fire — electronic access control designed, installed and maintained to SANS 60839-11-1.",
      icon: "/brand/icons/service-access-control.svg"
    },
    overview: "We design, install and maintain electronic access control for commercial, industrial and critical-infrastructure sites — readers, controllers, locking hardware, software and audit trails. Every design is built around safe egress, with fire-alarm release and fail-safe behaviour so security never compromises life safety. Our access control team currently also handles fire doors and architectural ironmongery operationally; see our dedicated Fire Doors and Architectural Ironmongery pages for those disciplines.",
    problem: {
      heading: "Access control must restrict entry without blocking escape",
      body: "A door that keeps intruders out can also trap people in an emergency if it is not designed correctly. Add lost keys, no record of who went where, and locking hardware that fails the wrong way, and a security measure becomes a liability.",
      points: [
        "Locked egress doors that do not release on fire alarm, creating a life-safety and code risk.",
        "No audit trail, so there is no record of who accessed a controlled area and when.",
        "Lost keys and shared credentials that cannot be revoked, undermining the whole system.",
        "Locking hardware that fails in the wrong state — fail-locked where it should fail-safe."
      ]
    },
    capabilities: [
      { title: "Credentials and readers", text: "Card, fob, PIN, mobile and biometric credentials with readers chosen for the environment and security level, so access is convenient for users and simple to revoke when needed." },
      { title: "Controllers and software", text: "Door controllers and management software for access rules by person, group, door and schedule, with multi-site administration and clear, exportable reporting." },
      { title: "Locking hardware and egress", text: "Electric strikes, maglocks and electric locks specified with the correct fail-safe or fail-secure behaviour, request-to-exit devices and manual override, so escape is always possible." },
      { title: "Fire-alarm integration and safe release", text: "Controlled doors interface with the fire detection system to release on alarm, holding egress open along escape routes — security and life safety designed to work together, not against each other." },
      { title: "Audit trails and reporting", text: "Time-stamped records of every access event, with reporting for investigations, compliance and operational review — so you can always answer who went where and when." },
      { title: "Maintenance and access reviews", text: "Scheduled servicing of readers, controllers and locking hardware, fire-release testing, and support to keep credential lists and access rights current as people and roles change." }
    ],
    standards: ["SANS 60839-11-1"],
    intent: "access-control",
    faqs: [
      { q: "Will the doors still open in a fire?", a: "Yes — that is non-negotiable. Controlled doors on escape routes are integrated with the fire detection system and specified with fail-safe behaviour so they release on alarm. Manual override and request-to-exit devices ensure people can always get out." },
      { q: "Do you handle fire doors and ironmongery too?", a: "Our access control team currently handles fire doors and architectural ironmongery operationally alongside access control. The technical detail for each lives on our Fire Doors and Architectural Ironmongery pages." },
      { q: "Can access control integrate with CCTV and alarms?", a: "Yes. Access events can trigger CCTV recording and tie into intrusion detection for a single operating picture. See our Integrated Security page for how the systems combine." }
    ],
    caseStudySlug: "warehouse-access-control-upgrade",
    status: "active"
  },

  "security-systems": {
    id: "security-systems",
    meta: {
      title: "Integrated Security Systems | Kharon Fire & Security",
      description: "Integrated security: CCTV, access control and intrusion detection designed to work as one system, with life-safety priority. Aligned to SANS 62676, SANS 60839-11-1 and SANS 50131."
    },
    hero: {
      subtitle: "Security",
      title: "Integrated Security",
      description: "CCTV, access control and intrusion detection designed as one system — so an alarm comes with the footage and the context, and security never overrides safe escape.",
      icon: "/brand/icons/service-cctv.svg"
    },
    overview: "We design, install and maintain integrated security systems that bring CCTV, access control and intrusion detection together under one operating picture. Instead of separate systems that do not talk to each other, an alarm triggers the right cameras, access events carry context, and operators see what is happening in one place — with fire and life-safety always taking priority.",
    problem: {
      heading: "Separate systems leave gaps between them",
      body: "When cameras, alarms and access control are installed and run in isolation, the gaps between them are where incidents slip through. An alarm fires with no footage attached, operators switch between disconnected screens, and nobody has a single, time-aligned record of what happened.",
      points: [
        "Alarms without visual verification, so every activation needs a manual check.",
        "Operators juggling separate CCTV, alarm and access systems instead of one picture.",
        "No correlated, time-stamped record across systems when an incident is investigated.",
        "Security automation that ignores fire and life-safety, risking locked escape routes."
      ]
    },
    capabilities: [
      { title: "Unified design across systems", text: "We design CCTV, access control and intrusion detection to a single plan — shared cabling, network and storage strategy, and a consistent operating model — rather than three systems bolted together after the fact." },
      { title: "Event correlation and verification", text: "An intrusion activation or access event links to the relevant cameras, so footage is recorded and bookmarked automatically and operators get visual verification instead of a bare alarm." },
      { title: "Single operating picture", text: "Cameras, doors and alarms presented through one interface with role-based access, so operators monitor and respond from one place and an incident produces one correlated record." },
      { title: "Life-safety priority", text: "Integration is built so fire and life-safety override security — controlled doors release on fire alarm and escape routes stay open. Security supports safety; it never blocks it (SANS 10400-T)." },
      { title: "Scalable, standards-based architecture", text: "Open, IP-based design that scales across doors, cameras and sites and supports phased rollout, built on structured cabling so the system can grow without being ripped out and replaced." },
      { title: "Maintenance across the whole system", text: "One maintenance relationship covering CCTV, access control and intrusion detection — scheduled servicing, health monitoring and testing — so the integrated system stays reliable end to end." }
    ],
    standards: ["SANS 62676", "SANS 60839-11-1", "SANS 50131", "SANS 10400-T", "SANS 10142-1"],
    intent: "integrated-security",
    faqs: [
      { q: "What does integrating these systems actually give us?", a: "Mainly faster, better-informed response and a single record. An alarm arrives with the footage attached, operators work from one screen instead of three, and an incident produces one correlated, time-aligned trail across CCTV, access and intrusion — rather than fragments from separate systems." },
      { q: "How do you keep security from compromising fire safety?", a: "Life safety takes priority by design. Controlled doors on escape routes are interfaced with the fire detection system to release on alarm, and the integration is built so fire and life-safety always override security automation." },
      { q: "Can we start with one system and integrate later?", a: "Yes. We build on an open, IP-based, standards-aligned architecture, so you can begin with CCTV, access control or intrusion detection and bring the others into the same operating picture in phases. See our CCTV, Access Control and Intrusion Detection pages." }
    ],
    caseStudySlug: "control-room-integrated-security",
    status: "active"
  },

  "architectural-ironmongery": {
    id: "architectural-ironmongery",
    meta: {
      title: "Architectural Ironmongery | Kharon Fire & Security",
      description: "Architectural ironmongery supply, specification and installation aligned to SANS 1253, SANS 51155 and SANS 10400-T. Hinges, closers, locks, exit hardware and seals matched to fire-door and egress requirements."
    },
    hero: {
      subtitle: "Security",
      title: "Architectural Ironmongery",
      description: "The hinges, closers, locks and exit hardware that make a door secure, compliant and safe to escape through — specified and installed to SANS 1253, SANS 51155 and SANS 10400-T.",
      icon: "/brand/icons/service-engineering.svg"
    },
    overview: "We specify, supply and install architectural ironmongery — hinges, door closers, locks, exit devices, handles, seals and accessories — matched to the door, its fire rating and its role in escape. Correct ironmongery is what lets a fire door self-close, latch and resist fire as tested, and what lets people escape under load through an exit door. We schedule it properly, install it correctly, and keep it serviced.",
    problem: {
      heading: "The wrong ironmongery defeats the door",
      body: "A certified fire door is only compliant with the ironmongery it was tested with. Mismatched or missing components break the fire rating, leave escape doors hard to open, and turn a documented assembly into one nobody can stand behind.",
      points: [
        "Non-compliant or substituted components that invalidate a fire door's certification.",
        "Closers that fail to fully close and latch the door, so it cannot perform in a fire.",
        "Exit hardware missing or wrong for the occupancy, making escape under load slow or difficult.",
        "Worn hinges, seals and closers left unmaintained, degrading both fire and security performance."
      ]
    },
    capabilities: [
      { title: "Ironmongery scheduling and specification", text: "We produce a door-by-door ironmongery schedule, specifying each component to suit the door, its fire rating, the traffic it carries and its escape function — so nothing is left to chance on site." },
      { title: "Hinges, closers and seals", text: "Hinges, controlled door closers and intumescent and smoke seals selected and set so fire doors self-close and latch reliably, and smoke and fire are held back as tested." },
      { title: "Locks, latches and handles", text: "Mortice locks, latches, lever handles and cylinders matched to the door's security level and fire rating, coordinated with any electronic access control on the same opening." },
      { title: "Exit and panic hardware", text: "Panic and emergency exit devices specified to suit the occupancy and escape requirements, so doors on escape routes open quickly and reliably under load (SANS 51155 / EN 1155 where applicable)." },
      { title: "Supply and installation", text: "We supply compliant components and install them correctly, preserving the certified performance of fire-door assemblies and keeping the documentation defensible." },
      { title: "Maintenance and replacement", text: "Scheduled inspection and servicing of closers, hinges, seals and exit hardware, with like-for-like compliant replacement of worn or damaged components to keep doors performing." }
    ],
    standards: ["SANS 1253", "SANS 51155", "SANS 10400-T"],
    intent: "ironmongery",
    faqs: [
      { q: "Why does ironmongery affect a fire door's certification?", a: "A fire door is certified as a complete assembly, including its hinges, closer, locks and seals. Changing or omitting components from the tested specification can invalidate the rating. We schedule and install ironmongery to keep the assembly compliant." },
      { q: "How does this relate to your Fire Doors service?", a: "They go together. Ironmongery is the hardware that makes a fire-door assembly work. We can supply and install the ironmongery alone, or as part of a full fire-door package — see our Fire Doors page." },
      { q: "Can you coordinate ironmongery with access control?", a: "Yes. On openings with electronic access control, the mechanical ironmongery and the electric locking are specified together so the door is secure, compliant and still safe to escape through. See our Access Control page." }
    ],
    status: "active"
  },

  "compliance-maintenance": {
    id: "compliance-maintenance",
    meta: {
      title: "Compliance & Maintenance | Kharon",
      description: "Structured inspection, servicing and maintenance reporting for fire detection, gas suppression and integrated protection systems."
    },
    hero: {
      subtitle: "Compliance & Support",
      title: "Compliance & Maintenance",
      description: "Inspection, servicing, reporting and lifecycle maintenance for accountable fire-system ownership.",
      icon: "/brand/icons/service-engineering.svg"
    },
    overview: "Our maintenance approach treats inspection, testing, and reporting as integral parts of the protection system. Every service visit generates comprehensive documentation that demonstrates ongoing compliance and system integrity.",
    problem: {
      heading: "A protection system that is not maintained is not protecting",
      body: "Inspection and maintenance gaps leave systems unreliable, compliance records incomplete, and insurers or authorities without the evidence they need. Structured servicing closes these gaps.",
      points: [
        "Detection or suppression systems installed but never re-tested against their original design basis.",
        "Missing or incomplete maintenance records that fail an inspection or insurer audit.",
        "No structured defect tracking, so faults drift from one service visit to the next.",
        "Lifecycle costs and replacement planning not visible until a system fails."
      ]
    },
    capabilities: [
      { title: "Site assessment", text: "Requirements start with the protected room, asset value, occupancy, detection risk and continuity requirement." },
      { title: "Detection and release logic", text: "Addressable detection, alarm signalling, suppression release and response paths are structured around maintainable cause-and-effect design." },
      { title: "Documented servicing", text: "Inspection, testing, servicing and reporting are treated as part of the protection system, not an afterthought." },
      { title: "Inspection-ready documentation", text: "All maintenance activities create verifiable records for regulatory compliance and operational review." }
    ],
    standards: ["SANS 10139", "SANS 14520"],
    intent: "compliance",
    disclaimerVariant: "sans",
    status: "active"
  },

  "emergency-support": {
    id: "emergency-support",
    meta: {
      title: "Emergency Support | Kharon",
      description: "Operational response pathways for protection-system faults, compliance interventions and maintenance escalations."
    },
    hero: {
      subtitle: "Emergency Support",
      title: "Emergency Support",
      description: "Direct response pathways for protection-system faults, compliance interventions, and urgent escalations on critical sites.",
      icon: "/brand/icons/severity-critical.svg"
    },
    overview: "Structured response procedures for protection system emergencies and critical incidents. Every reported fault is classified on contact to ensure the right response reaches you at the right time.",
    problem: {
      heading: "When a protection system fails, the response has to be fast and structured",
      body: "Unplanned faults in fire detection, gas suppression or security systems create immediate operational risk. Without a clear escalation path, response times slip and documentation is lost.",
      points: [
        "Fire panel faults, suppression impairments or systems going offline without a clear response path.",
        "No severity classification, so every call is treated the same regardless of risk.",
        "Missing documentation means fault history and resolution are not tracked.",
        "After-hours faults with no escalation procedure."
      ]
    },
    capabilities: [
      { title: "Critical fault triage", text: "Fire panel fault, suppression impaired, system offline — urgent telephone triage for active faults with priority dispatch subject to site location, access and support agreement." },
      { title: "Urgent technical review", text: "Detector fault, isolated zone, maintenance overrun — same-day technical review where available, next available technician visit subject to scheduling and access." },
      { title: "Planned maintenance", text: "Routine service, documentation update, minor fault — scheduled contact and scheduled maintenance visit." },
      { title: "Documented close-out", text: "All work is documented. A close-out report is issued and linked to the client's service record." }
    ],
    standards: [],
    intent: "emergency",
    disclaimerVariant: "sla",
    status: "active"
  }
};

/** Helper to get a service by route slug */
export function getService(slug: string): ServiceData | undefined {
  return services[slug];
}
