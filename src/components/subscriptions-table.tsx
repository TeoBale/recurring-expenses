import { useMemo, useState } from "react"
import {
  CalendarDaysIcon,
  CircleDollarSignIcon,
  ListFilterIcon,
  SearchIcon,
  ArrowUpDownIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { compareDateOnly, formatDateOnlyForLocale } from "@/lib/date-only"
import {
  formatCurrency,
  formatRenewalDate,
  matchesRenewalFilter,
  type RenewalFilter,
} from "@/lib/subscriptions"
import type { Subscription } from "@/types/subscription"

type SubscriptionsTableProps = {
  subscriptions: Subscription[]
  onDelete: (subscriptionIds: string[]) => void
}

type CycleFilter = "all" | Subscription["billingCycle"]
type SortOption =
  "renewal-asc" | "name-asc" | "price-asc" | "price-desc" | "start-desc"

const cycleLabels: Record<CycleFilter, string> = {
  all: "Tutte le frequenze",
  monthly: "Mensili",
  yearly: "Annuali",
}

const renewalLabels: Record<RenewalFilter, string> = {
  all: "Tutti i rinnovi",
  overdue: "Rinnovo scaduto",
  "7-days": "Entro 7 giorni",
  "30-days": "Entro 30 giorni",
  "90-days": "Entro 90 giorni",
}

const sortLabels: Record<SortOption, string> = {
  "renewal-asc": "Rinnovo più vicino",
  "name-asc": "Nome A–Z",
  "price-asc": "Prezzo crescente",
  "price-desc": "Prezzo decrescente",
  "start-desc": "Iscrizione più recente",
}

function formatStartDate(value: string) {
  return formatDateOnlyForLocale(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function SubscriptionLogo({ subscription }: { subscription: Subscription }) {
  const Icon = subscription.icon ?? CircleDollarSignIcon

  return (
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
  )
}

export function SubscriptionsTable({
  subscriptions,
  onDelete,
}: SubscriptionsTableProps) {
  const [query, setQuery] = useState("")
  const [cycleFilter, setCycleFilter] = useState<CycleFilter>("all")
  const [renewalFilter, setRenewalFilter] = useState<RenewalFilter>("all")
  const [sortOption, setSortOption] = useState<SortOption>("renewal-asc")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortingOpen, setSortingOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [pendingDeletion, setPendingDeletion] = useState<string[] | null>(null)

  const visibleSubscriptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("it-IT")
    const filteredSubscriptions = subscriptions.filter(
      (subscription) =>
        subscription.name
          .toLocaleLowerCase("it-IT")
          .includes(normalizedQuery) &&
        (cycleFilter === "all" || subscription.billingCycle === cycleFilter) &&
        matchesRenewalFilter(subscription.renewalDate, renewalFilter)
    )

    return filteredSubscriptions.toSorted((a, b) => {
      if (sortOption === "name-asc")
        return a.name.localeCompare(b.name, "it-IT")
      if (sortOption === "price-asc") return a.price - b.price
      if (sortOption === "price-desc") return b.price - a.price
      if (sortOption === "start-desc")
        return compareDateOnly(b.startDate, a.startDate)
      return compareDateOnly(a.renewalDate, b.renewalDate)
    })
  }, [cycleFilter, query, renewalFilter, sortOption, subscriptions])

  const visibleIds = visibleSubscriptions.map((subscription) => subscription.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someVisibleSelected =
    !allVisibleSelected && visibleIds.some((id) => selectedIds.has(id))
  const filtersAreActive = cycleFilter !== "all" || renewalFilter !== "all"
  const sortingIsActive = sortOption !== "renewal-asc"

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function toggleSubscription(subscriptionId: string, selected?: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      const shouldSelect = selected ?? !next.has(subscriptionId)
      if (shouldSelect) {
        next.add(subscriptionId)
      } else {
        next.delete(subscriptionId)
      }
      return next
    })
  }

  function toggleAllVisible(selected: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      visibleIds.forEach((id) => {
        if (selected) {
          next.add(id)
        } else {
          next.delete(id)
        }
      })
      return next
    })
  }

  function resetFilters() {
    setCycleFilter("all")
    setRenewalFilter("all")
    clearSelection()
  }

  function confirmDeletion() {
    if (!pendingDeletion) return

    onDelete(pendingDeletion)
    setSelectedIds((current) => {
      const next = new Set(current)
      pendingDeletion.forEach((id) => next.delete(id))
      return next
    })
    setPendingDeletion(null)
  }

  const pendingDeletionName =
    pendingDeletion?.length === 1
      ? subscriptions.find(
          (subscription) => subscription.id === pendingDeletion[0]
        )?.name
      : undefined

  return (
    <div className="flex flex-col gap-3">
      <InputGroup className="h-10">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            clearSelection()
          }}
          placeholder="Cerca abbonamento…"
          aria-label="Cerca abbonamento"
        />
        <InputGroupAddon align="inline-end" className="gap-1">
          {query && (
            <InputGroupButton
              size="icon-sm"
              onClick={() => {
                setQuery("")
                clearSelection()
              }}
              aria-label="Azzera ricerca"
            >
              <XIcon />
            </InputGroupButton>
          )}

          <InputGroupButton
            size="icon-sm"
            variant={filtersAreActive ? "secondary" : "ghost"}
            aria-label="Filtra abbonamenti"
            onMouseDown={(event) => {
              event.preventDefault()
              setFiltersOpen((open) => !open)
              setSortingOpen(false)
            }}
          >
            <ListFilterIcon />
          </InputGroupButton>

          <InputGroupButton
            size="icon-sm"
            variant={sortingIsActive ? "secondary" : "ghost"}
            aria-label="Ordina abbonamenti"
            onMouseDown={(event) => {
              event.preventDefault()
              setSortingOpen((open) => !open)
              setFiltersOpen(false)
            }}
          >
            <ArrowUpDownIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {filtersOpen && (
        <div className="rounded-xl border bg-muted/20 p-3">
          <FieldGroup className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Frequenza</FieldLabel>
              <Select
                value={cycleFilter}
                onValueChange={(value) => {
                  if (value) {
                    setCycleFilter(value as CycleFilter)
                    clearSelection()
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{cycleLabels[cycleFilter]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.entries(cycleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Prossimo rinnovo</FieldLabel>
              <Select
                value={renewalFilter}
                onValueChange={(value) => {
                  if (value) {
                    setRenewalFilter(value as RenewalFilter)
                    clearSelection()
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{renewalLabels[renewalFilter]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.entries(renewalLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          {filtersAreActive && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={resetFilters}
            >
              <XIcon data-icon="inline-start" />
              Azzera filtri
            </Button>
          )}
        </div>
      )}

      {sortingOpen && (
        <div className="rounded-xl border bg-muted/20 p-3">
          <Field>
            <FieldLabel>Ordina per</FieldLabel>
            <Select
              value={sortOption}
              onValueChange={(value) => {
                if (value) {
                  setSortOption(value as SortOption)
                  clearSelection()
                }
              }}
            >
              <SelectTrigger className="w-full sm:max-w-xs">
                <SelectValue>{sortLabels[sortOption]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(sortLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  onCheckedChange={toggleAllVisible}
                  aria-label="Seleziona tutti gli abbonamenti visibili"
                />
              </TableHead>
              <TableHead>Servizio</TableHead>
              <TableHead className="text-right">Prezzo</TableHead>
              <TableHead className="hidden sm:table-cell">Frequenza</TableHead>
              <TableHead className="hidden sm:table-cell">
                Prossimo rinnovo
              </TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Azioni</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleSubscriptions.map((subscription) => {
              const isSelected = selectedIds.has(subscription.id)

              return (
                <TableRow
                  key={subscription.id}
                  data-state={isSelected ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={() => toggleSubscription(subscription.id)}
                >
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        toggleSubscription(subscription.id, checked)
                      }
                      aria-label={`Seleziona ${subscription.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <SubscriptionLogo subscription={subscription} />
                      <div className="min-w-0">
                        <p className="max-w-52 truncate font-medium sm:max-w-none">
                          {subscription.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="sm:hidden">
                            Rinnovo il{" "}
                            {formatRenewalDate(subscription.renewalDate)}
                          </span>
                          <span className="hidden sm:inline">
                            Attivo dal {formatStartDate(subscription.startDate)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-display text-lg lining-nums tabular-nums">
                    {formatCurrency(subscription.price)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {subscription.billingCycle === "monthly"
                      ? "Mensile"
                      : "Annuale"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDaysIcon className="size-4" aria-hidden="true" />
                      {formatRenewalDate(subscription.renewalDate)}
                    </span>
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Elimina ${subscription.name}`}
                      onClick={() => setPendingDeletion([subscription.id])}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}

            {visibleSubscriptions.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-sm font-medium">Nessun risultato</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Modifica o azzera i filtri per vedere gli abbonamenti.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {visibleSubscriptions.length} di {subscriptions.length} abbonamenti
          {selectedIds.size > 0 && ` · ${selectedIds.size} selezionati`}
        </p>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setPendingDeletion([...selectedIds])}
            >
              <Trash2Icon data-icon="inline-start" />
              Elimina selezionati
            </Button>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingDeletion !== null}
        onOpenChange={(open) => !open && setPendingDeletion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {pendingDeletion?.length === 1
                ? `Eliminare ${pendingDeletionName}?`
                : `Eliminare ${pendingDeletion?.length ?? 0} abbonamenti?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Questa operazione rimuoverà definitivamente i dati salvati su
              questo dispositivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDeletion}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
