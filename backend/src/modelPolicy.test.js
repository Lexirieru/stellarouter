import { describe, expect, test } from "bun:test";
import {
  annotateCatalog,
  DEFAULT_MODEL,
  enabledModels,
  gateModel,
  isModelEnabled,
  IS_MAINNET,
  TESTNET_MODELS,
} from "./modelPolicy.js";

// Tests run with the default STELLAR_NETWORK (testnet).
describe("model policy (testnet)", () => {
  test("defaults to free models only", () => {
    expect(IS_MAINNET).toBe(false);
    expect(TESTNET_MODELS.length).toBeGreaterThan(0);
    for (const m of TESTNET_MODELS) expect(m.endsWith(":free")).toBe(true);
    expect(DEFAULT_MODEL).toBe(TESTNET_MODELS[0]);
  });

  test("enables only the allow-list", () => {
    expect(isModelEnabled(TESTNET_MODELS[0])).toBe(true);
    expect(isModelEnabled("openai/gpt-4o-mini")).toBe(false);
    expect(isModelEnabled(undefined)).toBe(false);
    expect(enabledModels()).toEqual(TESTNET_MODELS);
  });

  test("gateModel fills the default and rejects mainnet-only models", () => {
    const body = { messages: [] };
    expect(gateModel(body)).toBeNull();
    expect(body.model).toBe(DEFAULT_MODEL);

    const err = gateModel({ model: "openai/gpt-4o" });
    expect(err?.error).toBe("model_unavailable_on_testnet");
    expect(err?.availability).toBe("mainnet");
    expect(err?.enabled_models).toEqual(TESTNET_MODELS);
  });

  test("annotateCatalog labels and floats enabled models first", () => {
    const out = annotateCatalog({
      data: [
        { id: "openai/gpt-4o" },
        { id: TESTNET_MODELS[0] },
        { id: "anthropic/claude-3.5-sonnet" },
      ],
    });
    expect(out.data[0].id).toBe(TESTNET_MODELS[0]);
    expect(out.data[0]).toMatchObject({ enabled: true, availability: "now" });
    expect(out.data[1]).toMatchObject({ enabled: false, availability: "mainnet" });
    expect(out.network).toBe("stellar:testnet");
    expect(out.enabled_models).toEqual(TESTNET_MODELS);
  });
});
