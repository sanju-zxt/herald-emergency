import { describe, it, expect } from "vitest";
import { stripJsonFences, tryParse } from "../gemini";

describe("stripJsonFences", () => {
  it("returns JSON body when wrapped in ```json fences", () => {
    const input = '```json\n{"a":1}\n```';
    expect(stripJsonFences(input)).toBe('{"a":1}');
  });

  it("returns JSON body when wrapped in plain ``` fences", () => {
    const input = '```\n{"a":1}\n```';
    expect(stripJsonFences(input)).toBe('{"a":1}');
  });

  it("strips leading text before the first {", () => {
    const input = 'Here is the result: {"a":1}';
    expect(stripJsonFences(input)).toBe('{"a":1}');
  });

  it("passes through a clean JSON string unchanged", () => {
    const input = '{"a":1}';
    expect(stripJsonFences(input)).toBe('{"a":1}');
  });
});

describe("tryParse", () => {
  it("parses a simple JSON object", () => {
    expect(tryParse('{"a":1}')).toEqual({ a: 1 });
  });

  it("parses a string with trailing text after a balanced object", () => {
    expect(tryParse('{"a":1} some trailing words')).toEqual({ a: 1 });
  });

  it("throws when no JSON object is present", () => {
    expect(() => tryParse("garbage no braces here")).toThrow();
  });
});
