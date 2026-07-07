import { Suspense, lazy, useState } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Subscription } from "@/types/subscription"

const loadAddSubscriptionDialog = () => import("./add-subscription-dialog")

const LazyAddSubscriptionDialogContent = lazy(async () => {
  const module = await loadAddSubscriptionDialog()

  return {
    default: module.AddSubscriptionDialog,
  }
})

type LazyAddSubscriptionDialogProps = {
  onAdd: (subscription: Subscription) => void
}

type AddSubscriptionTriggerProps = {
  disabled?: boolean
  onClick?: () => void
  onFocus?: () => void
  onPointerEnter?: () => void
}

function preloadAddSubscriptionDialog() {
  void loadAddSubscriptionDialog()
}

function AddSubscriptionTrigger({
  disabled = false,
  onClick,
  onFocus,
  onPointerEnter,
}: AddSubscriptionTriggerProps) {
  return (
    <Button
      type="button"
      disabled={disabled}
      aria-busy={disabled || undefined}
      onClick={onClick}
      onFocus={onFocus}
      onPointerEnter={onPointerEnter}
    >
      <PlusIcon data-icon="inline-start" />
      Aggiungi
    </Button>
  )
}

export function LazyAddSubscriptionDialog({
  onAdd,
}: LazyAddSubscriptionDialogProps) {
  const [hasLoadedDialog, setHasLoadedDialog] = useState(false)
  const [shouldOpenOnLoad, setShouldOpenOnLoad] = useState(false)

  function preloadDialog() {
    preloadAddSubscriptionDialog()
  }

  function openDialog() {
    preloadAddSubscriptionDialog()
    setHasLoadedDialog(true)
    setShouldOpenOnLoad(true)
  }

  if (!hasLoadedDialog) {
    return (
      <AddSubscriptionTrigger
        onClick={openDialog}
        onFocus={preloadDialog}
        onPointerEnter={preloadDialog}
      />
    )
  }

  return (
    <Suspense fallback={<AddSubscriptionTrigger disabled />}>
      <LazyAddSubscriptionDialogContent
        onAdd={onAdd}
        defaultOpen={shouldOpenOnLoad}
      />
    </Suspense>
  )
}
