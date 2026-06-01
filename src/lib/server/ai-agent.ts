/**
 * Project Sentinel - AI Agent Service
 * Purpose: Higher-level AI workflows using @openrouter/agent for tool-based reasoning.
 *           Used by API endpoints to perform multi-step AI tasks.
 * Dependencies: @openrouter/agent, ./openrouter.js
 * Structural Role: Agent orchestration layer
 */

import { OpenRouter, callModel, tool, stepCountIs } from "@openrouter/agent";
import { z } from "zod";

// @ts-ignore - cloudflare:workers module
import { env } from "cloudflare:workers";

function resolveBindings(): Record<string, unknown> {
  try {
    if (env && (env as any).OPENROUTER_API_KEY) return env as unknown as Record<string, unknown>;
  } catch { /* not in Cloudflare context */ }
  return (globalThis as any).__env__ || process?.env || {};
}

function getApiKey(): string {
  return String(resolveBindings().OPENROUTER_API_KEY || "");
}

function getClient(): OpenRouter {
  return new OpenRouter({ apiKey: getApiKey() });
}

// ── Maintenance Request Triage Agent ───────────────────────────────────────

export async function triageMaintenanceRequest(
  customerMessage: string,
  customerName: string,
  siteAddress: string
): Promise<{
  requestType: string;
  urgency: "low" | "medium" | "high" | "emergency";
  systemType: string;
  recommendedJobType: string;
  priority: string;
  summary: string;
}> {
  const lookupSystemTypes = tool({
    name: "lookup_system_types",
    description: "Look up supported fire & security system types and request categories",
    inputSchema: z.object({}),
    execute: async () => ({
      systemTypes: [
        "Gas Suppression",
        "Fire Detection",
        "Compliance & Maintenance",
        "Critical Infrastructure",
        "Integrated Security",
      ],
      requestTypes: [
        "Emergency technical support",
        "Gas suppression evaluation",
        "Fire detection system review",
        "Compliance inspection",
        "Maintenance assessment",
      ],
    }),
  });

  const result = callModel(getClient(), {
    model: "deepseek/deepseek-chat",
    input: [
      `Customer: ${customerName}`,
      `Site: ${siteAddress}`,
      `Message: ${customerMessage}`,
      "",
      "Analyze this maintenance request. Return ONLY a JSON object with these fields:",
      '- requestType: best match from system lookup',
      '- urgency: one of "low", "medium", "high", "emergency"',
      '- systemType: best matching system type from lookup',
      '- recommendedJobType: one of "Service", "Repair", "Inspection", "Emergency Call-out"',
      '- priority: one of "Normal", "High", "Critical"',
      '- summary: one-sentence summary for the dispatch team',
    ].join("\n"),
    tools: [lookupSystemTypes],
    stopWhen: stepCountIs(3),
  });

  const text = await result.getText();
  const cleaned = text.replace(/```(?:json)?\s*/g, "").trim();
  return JSON.parse(cleaned);
}

// ── Defect Analysis Agent ──────────────────────────────────────────────────

export async function analyzeDefect(
  defectDescription: string,
  systemType: string,
  coverageArea: string
): Promise<{
  severity: "Critical" | "Major" | "Minor" | "Observation";
  sansClauseRef: string;
  certificateBlocking: boolean;
  analysis: string;
}> {
  const result = callModel(getClient(), {
    model: "deepseek/deepseek-chat",
    input: [
      `System: ${systemType}`,
      `Coverage area: ${coverageArea}`,
      `Defect description: ${defectDescription}`,
      "",
      "Analyze this fire & security system defect. Return ONLY a JSON object with:",
      '- severity: one of "Critical", "Major", "Minor", "Observation" (per SANS 10139 / SANS 1475 standards)',
      '- sansClauseRef: relevant SANS clause reference (e.g. "SANS 10139 §8.7.2") or empty string',
      '- certificateBlocking: true or false (whether this defect would block a compliance certificate)',
      '- analysis: 1-2 sentence technical assessment of the defect',
    ].join("\n"),
    stopWhen: stepCountIs(1),
  });

  const text = await result.getText();
  const cleaned = text.replace(/```(?:json)?\s*/g, "").trim();
  return JSON.parse(cleaned);
}

// ── Invoice Description Generator ──────────────────────────────────────────

export async function generateInvoiceDescription(
  jobType: string,
  systemType: string,
  techComments: string,
  followUpActions: string
): Promise<{ description: string; sageReference: string }> {
  const result = callModel(getClient(), {
    model: "deepseek/deepseek-chat",
    input: [
      `Job type: ${jobType}`,
      `System: ${systemType}`,
      `Technician comments: ${techComments}`,
      `Follow-up actions: ${followUpActions}`,
      "",
      "Generate a professional invoice line-item description and a Sage accounting reference.",
      "Return ONLY a JSON object with:",
      '- description: concise professional description suitable for a tax invoice (max 200 chars)',
      '- sageReference: short reference code for Sage accounting (max 20 chars, alphanumeric + hyphens)',
    ].join("\n"),
    stopWhen: stepCountIs(1),
  });

  const text = await result.getText();
  const cleaned = text.replace(/```(?:json)?\s*/g, "").trim();
  return JSON.parse(cleaned);
}
