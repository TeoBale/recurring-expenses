import type { LucideIcon } from "lucide-react"

export type BillingCycle = "monthly" | "yearly"

export type SubscriptionLogo = {
  light: string
  dark: string
}

export type Subscription = {
  id: string
  name: string
  price: number
  billingCycle: BillingCycle
  startDate: string
  renewalDate: string
  icon?: LucideIcon
  logoSvg?: SubscriptionLogo
}
