import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  CircleDollarSignIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  formatCurrency,
  formatRenewalDate,
  monthProgress,
  monthlyCost,
} from "@/lib/subscriptions"
import { cn } from "@/lib/utils"
import type { Subscription } from "@/types/subscription"

type SubscriptionCardProps = {
  subscription: Subscription
  compact?: boolean
}

export function SubscriptionCard({
  subscription,
  compact = false,
}: SubscriptionCardProps) {
  const Icon = subscription.icon ?? CircleDollarSignIcon
  const cycleLabel =
    subscription.billingCycle === "monthly" ? "/ mese" : "/ anno"
  const spentThisMonth = monthlyCost(subscription) * monthProgress(new Date())

  return (
    <Card
      size={compact ? "sm" : "default"}
      className={cn(compact && "gap-1.5 py-2")}
    >
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            {subscription.logoSvg ? (
              <>
                <img
                  src={subscription.logoSvg.light}
                  alt=""
                  className="max-h-6 max-w-6 object-contain dark:hidden"
                />
                <img
                  src={subscription.logoSvg.dark}
                  alt=""
                  className="hidden max-h-6 max-w-6 object-contain dark:block"
                />
              </>
            ) : (
              <Icon className="size-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate">{subscription.name}</CardTitle>
            <CardDescription>{cycleLabel.slice(2)}</CardDescription>
          </div>
        </div>
        <CardAction className="text-right">
          <p className="font-display text-xl leading-none">
            {formatCurrency(subscription.price)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{cycleLabel}</p>
        </CardAction>
      </CardHeader>
      {!compact && (
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Accumulati nel mese</p>
          <Badge variant="outline">{formatCurrency(spentThisMonth, 4)}</Badge>
        </CardContent>
      )}
      <CardFooter
        className={cn("justify-between gap-3", compact && "px-3 py-1.5")}
      >
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDaysIcon className="size-3.5" aria-hidden="true" />
          Rinnovo il {formatRenewalDate(subscription.renewalDate)}
        </span>
        <Button
          variant="ghost"
          size={compact ? "icon-xs" : "icon-sm"}
          aria-label={`Apri ${subscription.name}`}
        >
          <ArrowUpRightIcon />
        </Button>
      </CardFooter>
    </Card>
  )
}
