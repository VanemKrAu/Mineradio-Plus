import { z } from "zod";
import { ProviderIdSchema, ProviderCapabilitySchema } from "./provider";

export const ProviderStatusEntrySchema = z.object({
  providerId: ProviderIdSchema,
  available: z.boolean(),
  capabilities: z.array(ProviderCapabilitySchema).default([]),
  message: z.string().optional()
});

export type ProviderStatusEntry = z.infer<typeof ProviderStatusEntrySchema>;

export const HealthProviderStatusSchema = z.object({
  version: z.string(),
  providers: z.array(ProviderStatusEntrySchema).default([])
});

export const HealthResponseSchema = z.object({
  ok: z.literal(true),
  appVersion: z.string(),
  apiVersion: z.string(),
  schemaVersion: z.string(),
  providers: z.array(z.string()),
  providerStatus: HealthProviderStatusSchema.optional()
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
