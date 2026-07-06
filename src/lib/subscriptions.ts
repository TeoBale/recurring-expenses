import type { Subscription } from "@/types/subscription"

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
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`))
}
