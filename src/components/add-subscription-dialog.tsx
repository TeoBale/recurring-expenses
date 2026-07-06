import { useState, type FormEvent } from "react"
import { CircleDollarSignIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BillingCycle, Subscription } from "@/types/subscription"

type AddSubscriptionDialogProps = {
  onAdd: (subscription: Subscription) => void
}

function defaultRenewalDate() {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString().slice(0, 10)
}

export function AddSubscriptionDialog({ onAdd }: AddSubscriptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    onAdd({
      id: crypto.randomUUID(),
      name: String(form.get("name")),
      price: Number(form.get("price")),
      renewalDate: String(form.get("renewalDate")),
      billingCycle,
      icon: CircleDollarSignIcon,
    })

    event.currentTarget.reset()
    setBillingCycle("monthly")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Aggiungi
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nuovo abbonamento</DialogTitle>
            <DialogDescription>
              Inserisci i dati essenziali. Per ora resteranno solo in questa
              sessione.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="subscription-name">Servizio</FieldLabel>
              <Input
                id="subscription-name"
                name="name"
                placeholder="es. Apple Music"
                required
              />
            </Field>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="subscription-price">Prezzo</FieldLabel>
                <Input
                  id="subscription-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="9,99"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="subscription-cycle">Frequenza</FieldLabel>
                <Select
                  value={billingCycle}
                  onValueChange={(value) =>
                    value && setBillingCycle(value as BillingCycle)
                  }
                >
                  <SelectTrigger id="subscription-cycle" className="w-full">
                    <SelectValue>
                      {billingCycle === "monthly" ? "Mensile" : "Annuale"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="monthly">Mensile</SelectItem>
                      <SelectItem value="yearly">Annuale</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <Field>
              <FieldLabel htmlFor="subscription-renewal">
                Prossimo rinnovo
              </FieldLabel>
              <Input
                id="subscription-renewal"
                name="renewalDate"
                type="date"
                defaultValue={defaultRenewalDate()}
                required
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Annulla
            </DialogClose>
            <Button type="submit">Salva abbonamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
