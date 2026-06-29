import { describe, expect, it } from "vitest";
import { health } from "../src/index";

describe("smoke", () => {
  it("returns healthy status", () => {
    expect(health().status).toBe("ok");
  });
});
