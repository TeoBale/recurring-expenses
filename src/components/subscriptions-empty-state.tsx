import { WalletCardsIcon } from "lucide-react"

import { AddSubscriptionDialog } from "@/components/add-subscription-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import type { Subscription } from "@/types/subscription"

type SubscriptionsEmptyStateProps = {
  className?: string
  onAdd: (subscription: Subscription) => void
}

export function SubscriptionsEmptyState({
  className,
  onAdd,
}: SubscriptionsEmptyStateProps) {
  return (
    <Empty className={cn("border", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WalletCardsIcon />
        </EmptyMedia>
        <EmptyTitle>Ancora nessun abbonamento</EmptyTitle>
        <EmptyDescription>
          Aggiungi la tua prima spesa ricorrente per iniziare a vedere quanto
          incide nel tempo.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <AddSubscriptionDialog onAdd={onAdd} />
      </EmptyContent>
    </Empty>
  )
}
