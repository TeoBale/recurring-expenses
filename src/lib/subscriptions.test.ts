import { describe, expect, it } from "vitest"
import {
  formatCurrency,
  formatRenewalDate,
  monthProgress,
  monthlyCost,
  totalMonthlyCost,
} from "@/lib/subscriptions"
import type { Subscription } from "@/types/subscription"

const monthlySubscription: Subscription = {
  id: "netflix",
  name: "Netflix",
  price: 12.99,
  billingCycle: "monthly",
  startDate: "2026-01-01",
  renewalDate: "2026-02-01",
}

const yearlySubscription: Subscription = {
  id: "spotify",
  name: "Spotify",
  price: 120,
  billingCycle: "yearly",
  startDate: "2026-01-01",
  renewalDate: "2027-01-01",
}

describe("subscription helpers", () => {
  it("normalizes monthly and yearly subscriptions into monthly cost", () => {
    expect(monthlyCost(monthlySubscription)).toBe(12.99)
    expect(monthlyCost(yearlySubscription)).toBe(10)
    expect(
      totalMonthlyCost([monthlySubscription, yearlySubscription])
    ).toBeCloseTo(22.99)
  })

  it("calculates the month progress for a representative mid-month date", () => {
    expect(monthProgress(new Date(2026, 0, 16, 12))).toBe(0.5)
  })

  it("formats currency values for the Italian locale", () => {
    expect(formatCurrency(12.5)).toBe("€12,50")
  })

  it("formats renewal dates with day and abbreviated month", () => {
    expect(formatRenewalDate("2026-02-14")).toBe("14 feb")
  })
})
