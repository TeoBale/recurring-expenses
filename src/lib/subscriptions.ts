import type { Subscription } from "@/types/subscription"
import {
  currentDateOnly,
  daysUntilDateOnly,
  formatDateOnlyForLocale,
} from "@/lib/date-only"

export type RenewalFilter =
  | "all"
  | "overdue"
  | "7-days"
  | "30-days"
  | "90-days"

export function monthlyCost(subscription: Subscription) {
  return subscription.billingCycle === "monthly"
    ? subscription.price
    : subscription.price / 12
}

export function totalMonthlyCost(subscriptions: Subscription[]) {
  return subscriptions.reduce(
    (total, subscription) => total + monthlyCost(subscription),
    0
  )
}

export function monthProgress(date: Date) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return (
    (date.getTime() - monthStart.getTime()) /
    (nextMonth.getTime() - monthStart.getTime())
  )
}

export function formatCurrency(value: number, decimals = 2) {
  return `€${value.toLocaleString("it-IT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function formatRenewalDate(value: string) {
  return formatDateOnlyForLocale(value, {
    day: "numeric",
    month: "short",
  })
}

export function matchesRenewalFilter(
  renewalDate: string,
  filter: RenewalFilter,
  referenceDate: string = currentDateOnly()
) {
  if (filter === "all") {
    return true
  }

  const daysUntilRenewal = daysUntilDateOnly(renewalDate, referenceDate)

  if (filter === "overdue") {
    return daysUntilRenewal < 0
  }

  const maximumDays = Number(filter.split("-")[0])
  return daysUntilRenewal >= 0 && daysUntilRenewal <= maximumDays
}
