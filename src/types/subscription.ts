import type { LucideIcon } from "lucide-react"

export type BillingCycle = "monthly" | "yearly"

export type Subscription = {
  id: string
  name: string
  price: number
  billingCycle: BillingCycle
  renewalDate: string
  icon: LucideIcon
}
