import { useEffect, useMemo, useState } from "react"

import {
  formatCurrency,
  monthProgress,
  totalMonthlyCost,
} from "@/lib/subscriptions"
import type { Subscription } from "@/types/subscription"

export function useLiveSpend(subscriptions: Subscription[]) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const monthlyTotal = useMemo(
    () => totalMonthlyCost(subscriptions),
    [subscriptions]
  )
  const accrued = monthlyTotal * monthProgress(now)

  return {
    amount: formatCurrency(accrued, 6),
    monthlyTotal,
  }
}
