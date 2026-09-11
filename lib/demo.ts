import type { Action } from "./schema";

const SCENARIOS: Action[] = [
  {
    schemaVersion: "1.0",
    id: "H-1042",
    domain: "EMERGENCY",
    scenario: "Localized street flooding — River Rd",
    summary:
      "A photo shows a residential street under fast-rising water; a recorded voice report says the storm-water pump on River Rd has stopped and water is rising. Conditions suggest partial road closure risk within the hour.",
    severity: "CRITICAL",
    status: "DRAFT",
    confidence: 0.89,
    entities: [
      { type: "infrastructure", name: "River Rd pump station", value: "non-operational", confidence: 0.9 },
      { type: "condition", name: "rainfall", value: "heavy, sustained", confidence: 0.85 },
      { type: "location", name: "River Rd residential block", confidence: 0.88 },
      { type: "person", name: "Residents (12 households)", value: "potentially affected", confidence: 0.75 },
    ],
    location: { label: "River Rd, ~2 km north of central market", source: "voice + photo estimate" },
    sources: [
      { type: "photo", label: "Uploaded photo — flooded roadway", detail: "Water across curb height on River Rd.", cited: true },
      { type: "voice", label: "Voice report", detail: "\"The pump on River Rd stopped and water's rising fast.\"", cited: true },
    ],
    briefing:
      "Residential block on River Rd is flooding and rising fast. The storm-water pump at the River Rd station is reported non-operational. Fast-moving water now crosses the roadway at curb height, and continued heavy rainfall suggests partial road closure and possible property ingress within the hour. Residents on the lower half of the block are most exposed. Confirm pump status, stand up temporary deviation signage, and prepare sandbag distribution to the two lowest-lying properties.",
    recommendedActions: [
      { title: "Verify pump status and dispatch maintenance crew", target: "City Storm-water & Roads Dept", priority: "IMMEDIATE" },
      { title: "Activate temporary road closure + alternate routing", target: "Traffic Ops", priority: "IMMEDIATE" },
      { title: "Distribute sandbags to the 2 lowest-lying properties", target: "Civil Defense Unit", priority: "SOON" },
    ],
    safetyGate: {
      passed: true,
      reasons: [
        "Confidence 89% — photo + voice corroboration.",
        "Two independent channels agree on location and hazard.",
        "Ready for operator approval or edit.",
      ],
    },
    graphData: {
      nodes: [
        { id: "inc-1", label: "Street Flooding", type: "incident", size: 30 },
        { id: "loc-1", label: "River Rd", type: "location", size: 22 },
        { id: "infra-1", label: "Pump Station", type: "infrastructure", size: 22 },
        { id: "cond-1", label: "Heavy Rain", type: "condition", size: 18 },
        { id: "agency-1", label: "Roads Dept", type: "agency", size: 20 },
        { id: "agency-2", label: "Traffic Ops", type: "agency", size: 20 },
        { id: "person-1", label: "12 Households", type: "person", size: 18 },
      ],
      edges: [
        { source: "inc-1", target: "loc-1", label: "located at" },
        { source: "inc-1", target: "infra-1", label: "caused by" },
        { source: "cond-1", target: "inc-1", label: "aggravates" },
        { source: "inc-1", target: "person-1", label: "threatens" },
        { source: "agency-1", target: "infra-1", label: "maintains" },
        { source: "agency-2", target: "loc-1", label: "routes" },
      ],
    },
    timeline: [
      { time: "T-45 min", label: "Pump failure detected", detail: "River Rd pump station went offline", status: "done" },
      { time: "T-30 min", label: "Water levels rising", detail: "Street-level flooding reported by residents", status: "done" },
      { time: "Now", label: "HERALD intake", detail: "Photo + voice report analyzed", status: "active" },
      { time: "T+15 min", label: "Dispatch crew", detail: "Pending operator approval", status: "pending" },
      { time: "T+60 min", label: "Road closure effective", detail: "Traffic rerouted via Market St", status: "pending" },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    schemaVersion: "1.0",
    id: "H-1043",
    domain: "EMERGENCY",
    scenario: "Building fire — Apartment complex",
    summary:
      "Smoke and flames visible on the 3rd floor of a residential apartment block. Multiple residents evacuating. Nearest hydrant location unclear from available photo.",
    severity: "CRITICAL",
    status: "DRAFT",
    confidence: 0.92,
    entities: [
      { type: "infrastructure", name: "Maple Heights Apt Block", value: "3rd floor fire", confidence: 0.95 },
      { type: "person", name: "~40 residents", value: "evacuating", confidence: 0.8 },
      { type: "vehicle", name: "Fire Engine 7", value: "en route", confidence: 0.7 },
    ],
    location: { label: "14 Maple Heights, Sector 9", source: "text estimate" },
    sources: [
      { type: "photo", label: "Photo — smoke from 3rd floor", detail: "Flames visible from east side of building.", cited: true },
      { type: "text", label: "Text alert from resident", detail: "\"Fire in the building everyone get out\"", cited: true },
    ],
    briefing:
      "Residential apartment fire confirmed on the 3rd floor of Maple Heights, Sector 9. Flames and heavy smoke visible from the east facade. Approximately 40 residents in the building, several already evacuating. Fire Engine 7 is en route. Primary concerns: structural integrity of upper floors, smoke inhalation risk, and need for secondary evacuation of adjacent units. Confirm water supply access and initiate full building evacuation protocol.",
    recommendedActions: [
      { title: "Establish fire perimeter and full evacuation", target: "Fire Dept Command", priority: "IMMEDIATE" },
      { title: "Secure water supply — locate nearest hydrant", target: "Fire Engine 7 crew", priority: "IMMEDIATE" },
      { title: "Set up medical triage at parking lot", target: "EMS Unit 3", priority: "SOON" },
    ],
    safetyGate: {
      passed: true,
      reasons: [
        "Confidence 92% — photo + text corroboration.",
        "Fire confirmed by visual and textual evidence.",
      ],
    },
    graphData: {
      nodes: [
        { id: "inc-2", label: "Building Fire", type: "incident", size: 30 },
        { id: "loc-2", label: "Maple Heights", type: "location", size: 22 },
        { id: "infra-2", label: "3rd Floor", type: "infrastructure", size: 20 },
        { id: "person-2", label: "40 Residents", type: "person", size: 20 },
        { id: "vehicle-2", label: "Fire Engine 7", type: "vehicle", size: 18 },
        { id: "agency-3", label: "Fire Dept", type: "agency", size: 20 },
        { id: "agency-4", label: "EMS Unit 3", type: "agency", size: 18 },
      ],
      edges: [
        { source: "inc-2", target: "loc-2", label: "at" },
        { source: "inc-2", target: "infra-2", label: "floor" },
        { source: "inc-2", target: "person-2", label: "endangers" },
        { source: "vehicle-2", target: "inc-2", label: "responding" },
        { source: "agency-3", target: "vehicle-2", label: "dispatches" },
        { source: "agency-4", target: "loc-2", label: "triage at" },
      ],
    },
    timeline: [
      { time: "T-12 min", label: "Fire reported", detail: "911 call from resident", status: "done" },
      { time: "T-8 min", label: "Engine 7 dispatched", detail: "En route from Station 4", status: "done" },
      { time: "Now", label: "HERALD intake", detail: "Photo + text analyzed", status: "active" },
      { time: "T+5 min", label: "Engine on scene", detail: "Establish water supply", status: "pending" },
      { time: "T+30 min", label: "Fire contained", detail: "Expected — pending conditions", status: "pending" },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    schemaVersion: "1.0",
    id: "H-1044",
    domain: "HEALTH",
    scenario: "Mass casualty — Road accident",
    summary:
      "Multi-vehicle pileup on the highway near Exit 14. At least 3 vehicles involved. Multiple injuries reported. Ambulances needed urgently.",
    severity: "HIGH",
    status: "DRAFT",
    confidence: 0.84,
    entities: [
      { type: "infrastructure", name: "Highway Exit 14", value: "partially blocked", confidence: 0.9 },
      { type: "vehicle", name: "3+ vehicles", value: "damaged", confidence: 0.85 },
      { type: "person", name: "Multiple injured", value: "unknown count", confidence: 0.7 },
    ],
    location: { label: "National Highway, Exit 14 — westbound", source: "text" },
    sources: [
      { type: "text", label: "Highway patrol dispatch", detail: "\"Multi-vehicle accident at Exit 14, send all available units.\"", cited: true },
      { type: "voice", label: "Witness call", detail: "\"I see at least three cars smashed up, people are hurt.\"", cited: true },
    ],
    briefing:
      "Multi-vehicle pileup reported at National Highway Exit 14, westbound lanes. At least three vehicles involved with multiple injuries. Highway partially blocked causing secondary congestion risk. Immediate needs: ambulances for triage and transport, highway patrol for traffic control, and fire crew for extrication if anyone is trapped. Injury severity unknown — treat as mass casualty until assessed.",
    recommendedActions: [
      { title: "Dispatch 2+ ambulances to Exit 14", target: "EMS Command", priority: "IMMEDIATE" },
      { title: "Close westbound lanes + divert traffic", target: "Highway Patrol", priority: "IMMEDIATE" },
      { title: "Deploy rescue crew for extrication", target: "Fire & Rescue Unit 5", priority: "IMMEDIATE" },
    ],
    safetyGate: {
      passed: false,
      reasons: [
        "Confidence 84% — text + voice only, no photo evidence.",
        "Injury count unknown — escalate to triage protocol.",
        "Held for operator verification of vehicle count.",
      ],
    },
    graphData: {
      nodes: [
        { id: "inc-3", label: "Pileup", type: "incident", size: 30 },
        { id: "loc-3", label: "Exit 14", type: "location", size: 22 },
        { id: "vehicle-3a", label: "Car A", type: "vehicle", size: 16 },
        { id: "vehicle-3b", label: "Car B", type: "vehicle", size: 16 },
        { id: "vehicle-3c", label: "Car C", type: "vehicle", size: 16 },
        { id: "agency-5", label: "EMS Command", type: "agency", size: 20 },
        { id: "person-3", label: "Injured", type: "person", size: 20 },
      ],
      edges: [
        { source: "inc-3", target: "loc-3", label: "at" },
        { source: "vehicle-3a", target: "inc-3", label: "involved" },
        { source: "vehicle-3b", target: "inc-3", label: "involved" },
        { source: "vehicle-3c", target: "inc-3", label: "involved" },
        { source: "inc-3", target: "person-3", label: "injures" },
        { source: "agency-5", target: "inc-3", label: "responding" },
      ],
    },
    timeline: [
      { time: "T-18 min", label: "Accident reported", detail: "Multiple 911 calls", status: "done" },
      { time: "T-10 min", label: "Patrol dispatched", detail: "Units en route", status: "done" },
      { time: "Now", label: "HERALD intake", detail: "Text + voice analyzed", status: "active" },
      { time: "T+8 min", label: "EMS on scene", detail: "Triage begins", status: "pending" },
      { time: "T+45 min", label: "Lanes reopen", detail: "After investigation", status: "pending" },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    schemaVersion: "1.0",
    id: "H-1045",
    domain: "CIVIC",
    scenario: "Gas leak — Residential area",
    summary:
      "Strong gas odor reported in a residential neighborhood. Multiple houses affected. Possible pipeline issue. Residents instructed to stay indoors.",
    severity: "HIGH",
    status: "DRAFT",
    confidence: 0.78,
    entities: [
      { type: "infrastructure", name: "Gas pipeline — Block C", value: "suspected leak", confidence: 0.75 },
      { type: "condition", name: "Gas odor", value: "strong, widespread", confidence: 0.85 },
      { type: "person", name: "Block C residents", value: "~30 households", confidence: 0.8 },
    ],
    location: { label: "Block C, Greenfield Colony", source: "text" },
    sources: [
      { type: "text", label: "Resident complaint", detail: "\"Strong gas smell since morning, getting worse.\"", cited: true },
    ],
    briefing:
      "Multiple residents in Block C, Greenfield Colony report a strong gas odor. The smell is widespread, suggesting a pipeline issue rather than a single household leak. Approximately 30 households are potentially affected. No explosion reported at this time. Immediate risk: ignition source exposure. Evacuation perimeter should be established, gas supply isolated, and ventilation assessment conducted before any investigation.",
    recommendedActions: [
      { title: "Isolate gas supply to Block C", target: "Gas Company Emergency", priority: "IMMEDIATE" },
      { title: "Establish 100m evacuation perimeter", target: "Local Police", priority: "IMMEDIATE" },
      { title: "Ventilation assessment of affected buildings", target: "Fire Hazmat Unit", priority: "SOON" },
    ],
    safetyGate: {
      passed: false,
      reasons: [
        "Confidence 78% — text source only, no photo/voice.",
        "Gas leak severity cannot be confirmed without instrumentation.",
        "Held for operator verification.",
      ],
    },
    graphData: {
      nodes: [
        { id: "inc-4", label: "Gas Leak", type: "incident", size: 30 },
        { id: "loc-4", label: "Block C", type: "location", size: 22 },
        { id: "infra-4", label: "Gas Pipeline", type: "infrastructure", size: 20 },
        { id: "cond-4", label: "Gas Odor", type: "condition", size: 18 },
        { id: "person-4", label: "30 Households", type: "person", size: 20 },
        { id: "agency-6", label: "Gas Company", type: "agency", size: 20 },
        { id: "agency-7", label: "Police", type: "agency", size: 18 },
      ],
      edges: [
        { source: "inc-4", target: "loc-4", label: "at" },
        { source: "infra-4", target: "inc-4", label: "causes" },
        { source: "cond-4", target: "inc-4", label: "indicates" },
        { source: "inc-4", target: "person-4", label: "affects" },
        { source: "agency-6", target: "infra-4", label: "owns" },
        { source: "agency-7", target: "loc-4", label: "secures" },
      ],
    },
    timeline: [
      { time: "T-3 hrs", label: "Odor first reported", detail: "Initial complaints from residents", status: "done" },
      { time: "T-1 hr", label: "Widespread reports", detail: "Multiple households confirm", status: "done" },
      { time: "Now", label: "HERALD intake", detail: "Text analyzed", status: "active" },
      { time: "T+10 min", label: "Gas company en route", detail: "Emergency crew dispatched", status: "pending" },
      { time: "T+2 hrs", label: "Resolution expected", detail: "Pipe isolation + repair", status: "pending" },
    ],
    createdAt: new Date().toISOString(),
  },
];

/**
 * Demo mode: when no GEMINI_API_KEY is present (or ?demo=1), the pipeline returns
 * a realistic canned Action after a short delay so the deployed link and pitch
 * never fail — even mid-quota or mid-demo.
 */
export function demoAction(seed = 1): Action {
  const n = SCENARIOS.length;
  const safe = Number.isFinite(seed) ? Math.floor(seed) : 1;
  return SCENARIOS[((safe - 1) % n + n) % n];
}

/** Get all available scenarios for the scenario picker. */
export function getAllScenarios(): { id: string; scenario: string; severity: string; domain: string }[] {
  return SCENARIOS.map((s) => ({ id: s.id, scenario: s.scenario, severity: s.severity, domain: s.domain }));
}
