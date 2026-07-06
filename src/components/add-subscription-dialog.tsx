import { useState, type FormEvent } from "react"
import { CircleDollarSignIcon, PlusIcon } from "lucide-react"

import { DatePicker } from "@/components/date-picker"
import providersData from "@/data/subscription-providers.json"
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BillingCycle, Subscription } from "@/types/subscription"
import type {
  SubscriptionPreset,
  SubscriptionProvider,
} from "@/types/subscription-provider"

const providers = providersData as SubscriptionProvider[]

type PresetOption = {
  value: string
  label: string
  provider: SubscriptionProvider
  preset: SubscriptionPreset
}

const presetOptions: PresetOption[] = providers.flatMap((provider) =>
  provider.subscriptions.map((preset) => ({
    value: `${provider.id}:${preset.id}`,
    label: `${provider.name} · ${preset.name}`,
    provider,
    preset,
  }))
)

function filterPresetOption(option: PresetOption, query: string) {
  const searchableText = option.label.toLocaleLowerCase("it-IT")
  const terms = query.toLocaleLowerCase("it-IT").trim().split(/\s+/)

  return terms.every((term) => searchableText.includes(term))
}

type AddSubscriptionDialogProps = {
  onAdd: (subscription: Subscription) => void
}

function nextRenewalDate(billingCycle: BillingCycle) {
  const date = new Date()

  if (billingCycle === "yearly") {
    date.setFullYear(date.getFullYear() + 1)
  } else {
    date.setMonth(date.getMonth() + 1)
  }

  return date.toISOString().slice(0, 10)
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatPresetPrice(price: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(price)
}

function presetTitle(
  provider: SubscriptionProvider,
  preset: SubscriptionPreset
) {
  const providerName = provider.name.toLocaleLowerCase("it-IT")
  const presetName = preset.name.toLocaleLowerCase("it-IT")

  return presetName.includes(providerName)
    ? preset.name
    : `${provider.name} ${preset.name}`
}

function ProviderLogo({ provider }: { provider: SubscriptionProvider }) {
  return (
    <>
      <img
        src={provider.logoSvg.light}
        alt=""
        className="max-h-4 max-w-4 object-contain dark:hidden"
      />
      <img
        src={provider.logoSvg.dark}
        alt=""
        className="hidden max-h-4 max-w-4 object-contain dark:block"
      />
    </>
  )
}

export function AddSubscriptionDialog({ onAdd }: AddSubscriptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedPresetOption, setSelectedPresetOption] =
    useState<PresetOption | null>(null)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")
  const [startDate, setStartDate] = useState(todayDate)
  const [renewalDate, setRenewalDate] = useState(() =>
    nextRenewalDate("monthly")
  )

  const selectedProvider = selectedPresetOption?.provider

  function resetForm() {
    setSelectedPresetOption(null)
    setName("")
    setPrice("")
    setBillingCycle("monthly")
    setStartDate(todayDate())
    setRenewalDate(nextRenewalDate("monthly"))
  }

  function choosePreset(option: PresetOption | null) {
    setSelectedPresetOption(option)

    if (!option) {
      setName("")
      setPrice("")
      setBillingCycle("monthly")
      setRenewalDate(nextRenewalDate("monthly"))
      return
    }

    setName(presetTitle(option.provider, option.preset))
    setPrice(String(option.preset.price))
    setBillingCycle(option.preset.billingCycle)
    setRenewalDate(nextRenewalDate(option.preset.billingCycle))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onAdd({
      id: crypto.randomUUID(),
      name,
      price: Number(price),
      startDate,
      renewalDate,
      billingCycle,
      icon: selectedProvider ? undefined : CircleDollarSignIcon,
      logoSvg: selectedProvider?.logoSvg,
    })

    resetForm()
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
              Parti da un preset oppure inserisci una spesa ricorrente
              manualmente. Ogni campo resta modificabile.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <FieldSet>
              <FieldLegend variant="label">Preset</FieldLegend>
              <FieldDescription>
                Cerca un provider o un piano per compilare automaticamente i
                dettagli.
              </FieldDescription>
              <Field>
                <FieldLabel htmlFor="subscription-preset">
                  Abbonamento
                </FieldLabel>
                <Combobox
                  items={presetOptions}
                  value={selectedPresetOption}
                  onValueChange={choosePreset}
                  filter={filterPresetOption}
                >
                  <ComboboxInput
                    id="subscription-preset"
                    className="w-full"
                    placeholder="Cerca Spotify, Netflix, iCloud…"
                    showClear
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>Nessun abbonamento trovato.</ComboboxEmpty>
                    <ComboboxList>
                      {(option: PresetOption) => (
                        <ComboboxItem
                          key={option.value}
                          value={option}
                          className="py-2"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background">
                            <ProviderLogo provider={option.provider} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              {option.provider.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {option.preset.name}
                            </span>
                          </span>
                          <span className="mr-5 shrink-0 text-muted-foreground">
                            {formatPresetPrice(option.preset.price)}
                          </span>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            </FieldSet>

            <FieldSeparator>Dettagli modificabili</FieldSeparator>

            <Field>
              <FieldLabel htmlFor="subscription-name">Titolo</FieldLabel>
              <Input
                id="subscription-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="es. Apple Music"
                required
              />
            </Field>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="subscription-price">Prezzo (€)</FieldLabel>
                <Input
                  id="subscription-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
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
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="subscription-start-date">
                  Data prima iscrizione
                </FieldLabel>
                <DatePicker
                  id="subscription-start-date"
                  name="startDate"
                  value={startDate}
                  maxDate={new Date()}
                  onValueChange={setStartDate}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="subscription-renewal">
                  Prossimo rinnovo
                </FieldLabel>
                <DatePicker
                  id="subscription-renewal"
                  name="renewalDate"
                  value={renewalDate}
                  onValueChange={setRenewalDate}
                />
              </Field>
            </FieldGroup>
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
