import { expect, test } from "bun:test";
import { HealthResponseSchema } from "./health";

test("health response parses the baseline health payload", () => {
  const parsed = HealthResponseSchema.parse({
    ok: true,
    appVersion: "0.0.0-dev",
    apiVersion: "0.1.0",
    schemaVersion: "0.1.0",
    providers: []
  });
  expect(parsed.providers).toEqual([]);
});

test("health response carries provider status matrix for sidecar readiness", () => {
  const parsed = HealthResponseSchema.parse({
    ok: true,
    appVersion: "0.0.0-dev",
    apiVersion: "0.1.0",
    schemaVersion: "0.1.0",
    providers: ["netease"],
    providerStatus: {
      version: "0.1.0",
      providers: [
        {
          providerId: "netease",
          available: true,
          capabilities: ["search", "songUrl"],
          message: "online"
        }
      ]
    }
  });
  expect(!!parsed.providerStatus).toBe(true);
  expect(parsed.providerStatus?.providers[0].providerId).toBe("netease");
});

test("health response rejects payload missing apiVersion", () => {
  expect(() =>
    HealthResponseSchema.parse({
      ok: true,
      appVersion: "0.0.0-dev",
      schemaVersion: "0.1.0",
      providers: []
    })
  ).toThrow();
});
