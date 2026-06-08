import type { CaseStudyModel } from "@sentinel/types";
export type { CaseStudyModel };

export const caseStudies: CaseStudyModel[] = [
  {
    id: "mock-case-study-1",
    title: "Mock Case Study Placeholder",
    slug: "mock-case-study-placeholder",
    clientName: "Acme Corp",
    sectorId: "sector-1",
    challenge: "Pending challenge definition",
    solution: "Pending solution definition",
    results: ["Increased efficiency", "Reduced costs"],
    isMock: true,
    internalStatus: "Status: Placeholder case study representative scenario pending client-approved proof.",
    proofIds: ["proof-1", "proof-2"]
  }
];
