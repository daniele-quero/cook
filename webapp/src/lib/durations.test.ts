import { describe, expect, it } from "vitest";
import { formatDuration } from "./durations";

describe("formatDuration", () => {
  it("returns undefined when no duration is given", () => {
    expect(formatDuration(undefined)).toBeUndefined();
  });

  it("formats an ISO 8601 duration into total minutes", () => {
    expect(formatDuration("PT1H30M")).toBe("90 min");
    expect(formatDuration("PT45M")).toBe("45 min");
  });

  it("returns the original string when it doesn't match the expected pattern", () => {
    expect(formatDuration("not-a-duration")).toBe("not-a-duration");
  });

  it("returns undefined for a zero duration", () => {
    expect(formatDuration("PT0M")).toBeUndefined();
  });
});
