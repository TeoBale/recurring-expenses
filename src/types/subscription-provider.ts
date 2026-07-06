import type { BillingCycle, SubscriptionLogo } from "@/types/subscription"

export type SubscriptionPreset = {
  id: string
  name: string
  price: number
  billingCycle: BillingCycle
}

export type SubscriptionProvider = {
  id: string
  name: string
  logoSvg: SubscriptionLogo
  market: "IT"
  currency: "EUR"
  subscriptions: SubscriptionPreset[]
}
