import {
  CloudIcon,
  LayoutGridIcon,
  Music2Icon,
  PlayIcon,
  Tv2Icon,
} from "lucide-react"

import type { Subscription } from "@/types/subscription"

function dateAfter(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export const initialSubscriptions: Subscription[] = [
  {
    id: "spotify",
    name: "Spotify",
    price: 10.99,
    billingCycle: "monthly",
    renewalDate: dateAfter(1),
    icon: Music2Icon,
  },
  {
    id: "youtube",
    name: "YouTube Premium",
    price: 13.99,
    billingCycle: "monthly",
    renewalDate: dateAfter(4),
    icon: PlayIcon,
  },
  {
    id: "netflix",
    name: "Netflix",
    price: 15.99,
    billingCycle: "monthly",
    renewalDate: dateAfter(8),
    icon: Tv2Icon,
  },
  {
    id: "icloud",
    name: "iCloud+",
    price: 2.99,
    billingCycle: "monthly",
    renewalDate: dateAfter(12),
    icon: CloudIcon,
  },
  {
    id: "figma",
    name: "Figma",
    price: 144,
    billingCycle: "yearly",
    renewalDate: dateAfter(42),
    icon: LayoutGridIcon,
  },
]
