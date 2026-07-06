import { motion, useReducedMotion } from "motion/react"
import { SlotText } from "slot-text/react"

import { formatCurrency } from "@/lib/subscriptions"
import { cn } from "@/lib/utils"

const slotOptions = {
  direction: "up" as const,
  duration: 420,
  stagger: 12,
  skipUnchanged: true,
}

type LiveSpendCounterProps = {
  amount: string
  monthlyTotal: number
  hasSubscriptions: boolean
  isActive: boolean
}

type LiveSpendAmountProps = {
  amount: string
  compact?: boolean
}

export function LiveSpendAmount({
  amount,
  compact = false,
}: LiveSpendAmountProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      layoutId="live-spend-counter"
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
      }
      className={cn(
        "overflow-hidden font-display leading-none lining-nums tabular-nums",
        compact
          ? "max-w-32 text-lg tracking-tight sm:max-w-48 sm:text-2xl"
          : "max-w-full text-[clamp(4rem,15vw,7.5rem)] tracking-[-0.035em]"
      )}
      aria-label={`${amount} spesi questo mese`}
    >
      <SlotText
        text={amount}
        options={
          shouldReduceMotion ? { ...slotOptions, duration: 0 } : slotOptions
        }
      />
    </motion.div>
  )
}

export function LiveSpendCounter({
  amount,
  monthlyTotal,
  hasSubscriptions,
  isActive,
}: LiveSpendCounterProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="flex min-h-[40svh] snap-start items-center justify-center py-8 text-center sm:min-h-[42svh]">
      <motion.div
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : -12 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
        }
        className="flex flex-col items-center gap-4"
        aria-hidden={!isActive}
      >
        {isActive && <LiveSpendAmount amount={amount} />}
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {!hasSubscriptions ? (
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
      </motion.div>
    </section>
  )
}
