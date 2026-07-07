import { describe, expect, it } from "vitest"

import {
  addBillingCycle,
  compareDateOnly,
  currentDateOnly,
  daysUntilDateOnly,
  defaultRenewalDate,
  parseDateOnly,
} from "@/lib/date-only"

describe("date-only helpers", () => {
  it("serializes local near-midnight dates without shifting to the previous UTC day", () => {
    expect(currentDateOnly(new Date(2026, 6, 7, 0, 30))).toBe("2026-07-07")
  })

  it("parses stored date-only strings and rejects malformed values", () => {
    expect(parseDateOnly("2026-07-07")).toEqual(new Date(2026, 6, 7))
    expect(() => parseDateOnly("2026-02-31")).toThrow(RangeError)
  })

  it("adds monthly billing cycles with end-of-month clamping", () => {
    expect(addBillingCycle("2024-01-31", "monthly")).toBe("2024-02-29")
    expect(addBillingCycle("2025-01-31", "monthly")).toBe("2025-02-28")
  })

  it("adds yearly billing cycles with leap-day clamping", () => {
    expect(addBillingCycle("2024-02-29", "yearly")).toBe("2025-02-28")
  })

  it("compares stored date-only strings chronologically", () => {
    expect(
      ["2026-07-14", "2026-07-02", "2026-07-09"].toSorted(compareDateOnly)
    ).toEqual(["2026-07-02", "2026-07-09", "2026-07-14"])
  })

  it("derives renewal defaults from the later of the start date or today", () => {
    expect(
      defaultRenewalDate("yearly", {
        startDate: "2026-07-01",
        referenceDate: "2026-07-07",
      })
    ).toBe("2027-07-07")

    expect(
      defaultRenewalDate("monthly", {
        startDate: "2026-08-15",
        referenceDate: "2026-07-07",
      })
    ).toBe("2026-09-15")
  })

  it("computes renewal-day deltas for filter boundaries", () => {
    const referenceDate = "2026-07-07"

    expect(daysUntilDateOnly("2026-07-06", referenceDate)).toBe(-1)
    expect(daysUntilDateOnly("2026-07-14", referenceDate)).toBe(7)
    expect(daysUntilDateOnly("2026-08-06", referenceDate)).toBe(30)
    expect(daysUntilDateOnly("2026-10-05", referenceDate)).toBe(90)
  })
})
