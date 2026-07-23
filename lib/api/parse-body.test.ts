import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseBody } from "./parse-body";

const schema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
});

function makeRequest(body: unknown, asText = false): Request {
  if (asText) {
    return new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "not-json",
    });
  }
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("parseBody", () => {
  it("returns data for valid JSON body", async () => {
    const result = await parseBody(
      makeRequest({ name: "ok", amount: 5 }),
      schema
    );
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data).toEqual({ name: "ok", amount: 5 });
    }
  });

  it("returns 400 for invalid JSON", async () => {
    const result = await parseBody(makeRequest(null, true), schema);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(400);
      const body = await result.error.json();
      expect(body.error).toBe("Invalid JSON body");
    }
  });

  it("returns 400 with issues for invalid shape", async () => {
    const result = await parseBody(
      makeRequest({ name: "", amount: -1 }),
      schema
    );
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(400);
      const body = await result.error.json();
      expect(body.issues).toBeDefined();
      expect(typeof body.error).toBe("string");
    }
  });
});
