import { z } from "zod";

export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional()
});
export type BaseEntity = z.infer<typeof BaseEntitySchema>;

export const JobSchema = z.object({
  id: z.string().uuid(),
  systemId: z.string().uuid(),
  assignedTechnicianId: z.string().uuid().nullable(),
  scheduledDate: z.string().datetime(),
  status: z.enum(["Scheduled", "In Progress", "Completed", "Invoiced"]),
  jobType: z.string().min(2).max(80),
  siteNotes: z.string().max(1000).nullable(),
  priority: z.enum(["Critical", "High", "Normal", "Low"]),
  isEmergency: z.boolean(),
  requiredByDate: z.string().nullable(),
  estimatedDurationMinutes: z.number().int().min(1).max(480).nullable()
});
export type Job = z.infer<typeof JobSchema>;

export const JobCreateSchema = z.object({
  action: z.literal("create"),
  systemId: z.string().uuid(),
  assignedTechnicianId: z.string().uuid().optional().nullable(),
  scheduledDate: z.string(),
  status: z.enum(["Scheduled", "In Progress", "Completed", "Invoiced"]).optional(),
  jobType: z.string().min(2).max(80).optional(),
  siteNotes: z.string().max(1000).optional().nullable(),
  priority: z.enum(["Critical", "High", "Normal", "Low"]).optional(),
  isEmergency: z.union([z.boolean(), z.number()]).optional(),
  requiredByDate: z.string().optional().nullable(),
  estimatedDurationMinutes: z.number().int().min(1).max(480).optional().nullable()
});

export const JobUpdateSchema = z.object({
  action: z.literal("update"),
  id: z.string().uuid(),
  systemId: z.string().uuid(),
  assignedTechnicianId: z.string().uuid().optional().nullable(),
  scheduledDate: z.string(),
  status: z.enum(["Scheduled", "In Progress", "Completed", "Invoiced"]).optional(),
  jobType: z.string().min(2).max(80).optional(),
  siteNotes: z.string().max(1000).optional().nullable(),
  priority: z.enum(["Critical", "High", "Normal", "Low"]).optional(),
  isEmergency: z.union([z.boolean(), z.number()]).optional(),
  requiredByDate: z.string().optional().nullable(),
  estimatedDurationMinutes: z.number().int().min(1).max(480).optional().nullable()
});

export const JobAssignSchema = z.object({
  action: z.literal("assign"),
  jobId: z.string().uuid(),
  technicianId: z.string().uuid().optional().nullable()
});

export const JobSetDispatchSchema = z.object({
  action: z.literal("setDispatch"),
  jobId: z.string().uuid(),
  priority: z.enum(["Critical", "High", "Normal", "Low"]),
  isEmergency: z.union([z.boolean(), z.number()]),
  requiredByDate: z.string().optional().nullable(),
  estimatedDurationMinutes: z.number().int().min(1).max(480).optional().nullable()
});
