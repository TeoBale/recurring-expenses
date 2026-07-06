import { useEffect, useMemo, useState } from "react"
import { SlotText } from "slot-text/react"

import { Badge } from "@/components/ui/badge"
import {
  formatCurrency,
  monthProgress,
  totalMonthlyCost,
} from "@/lib/subscriptions"
import type { Subscription } from "@/types/subscription"

const slotOptions = {
  direction: "up" as const,
  duration: 420,
  stagger: 12,
  skipUnchanged: true,
}

type LiveSpendCounterProps = {
  subscriptions: Subscription[]
}

export function LiveSpendCounter({ subscriptions }: LiveSpendCounterProps) {
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

  return (
    <section className="flex min-h-[48svh] flex-col items-center justify-center gap-5 py-16 text-center sm:min-h-[54svh]">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Live</Badge>
        <p className="text-sm text-muted-foreground">
          Spesa accumulata questo mese
        </p>
      </div>
      <div
        className="max-w-full overflow-hidden font-display text-[clamp(3.25rem,10vw,7.5rem)] leading-none tracking-[-0.075em] tabular-nums"
        aria-label={`${formatCurrency(accrued, 6)} spesi questo mese`}
      >
        <SlotText text={formatCurrency(accrued, 6)} options={slotOptions} />
      </div>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Ogni secondo conta. I tuoi abbonamenti valgono circa{" "}
        <span className="font-medium text-foreground">
          {formatCurrency(monthlyTotal)} al mese
        </span>
        .
      </p>
    </section>
  )
}
