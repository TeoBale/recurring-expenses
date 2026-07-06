import { useEffect, useMemo, useState } from "react"
import { SlotText } from "slot-text/react"

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
    <section className="flex min-h-[40svh] flex-col items-center justify-center gap-4 py-8 text-center sm:min-h-[42svh]">
      <div
        className="max-w-full overflow-hidden font-display text-[clamp(4rem,15vw,7.5rem)] leading-none tracking-[-0.035em] lining-nums tabular-nums"
        aria-label={`${formatCurrency(accrued, 6)} spesi questo mese`}
      >
        <SlotText text={formatCurrency(accrued, 6)} options={slotOptions} />
      </div>
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        {subscriptions.length === 0 ? (
          "Aggiungi il primo abbonamento per vedere la spesa crescere in tempo reale."
        ) : (
          <>
            Ogni secondo conta. I tuoi abbonamenti valgono circa{" "}
            <span className="font-medium whitespace-nowrap text-foreground">
              {formatCurrency(monthlyTotal)} al mese
            </span>
            .
          </>
        )}
      </p>
    </section>
  )
}
