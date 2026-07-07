import { useMemo, useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type RowSelectionState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDownIcon,
  CalendarDaysIcon,
  CircleDollarSignIcon,
  ListFilterIcon,
  SearchIcon,
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
import { DataTable } from "@/components/ui/data-table"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  compareDateOnly,
  currentDateOnly,
  formatDateOnlyForLocale,
} from "@/lib/date-only"
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
  | "renewal-asc"
  | "name-asc"
  | "price-asc"
  | "price-desc"
  | "start-desc"

type ChoiceOption<TValue extends string> = {
  description?: string
  label: string
  value: TValue
}

const cycleOptions: ChoiceOption<CycleFilter>[] = [
  { value: "all", label: "Tutte le frequenze" },
  { value: "monthly", label: "Mensili" },
  { value: "yearly", label: "Annuali" },
]

const renewalOptions: ChoiceOption<RenewalFilter>[] = [
  { value: "all", label: "Tutti i rinnovi" },
  { value: "overdue", label: "Rinnovi scaduti" },
  { value: "7-days", label: "Entro 7 giorni" },
  { value: "30-days", label: "Entro 30 giorni" },
  { value: "90-days", label: "Entro 90 giorni" },
]

const sortOptions: ChoiceOption<SortOption>[] = [
  {
    value: "renewal-asc",
    label: "Rinnovo piu vicino",
    description: "Porta in alto le scadenze imminenti.",
  },
  {
    value: "name-asc",
    label: "Nome A-Z",
    description: "Ordina alfabeticamente i servizi.",
  },
  {
    value: "price-asc",
    label: "Prezzo crescente",
    description: "Parte dalle spese piu leggere.",
  },
  {
    value: "price-desc",
    label: "Prezzo decrescente",
    description: "Mette in evidenza i costi piu alti.",
  },
  {
    value: "start-desc",
    label: "Iscrizione piu recente",
    description: "Mostra prima gli abbonamenti aggiunti di recente.",
  },
]

const sortStateByOption: Record<SortOption, SortingState> = {
  "renewal-asc": [{ id: "renewalDate", desc: false }],
  "name-asc": [{ id: "name", desc: false }],
  "price-asc": [{ id: "price", desc: false }],
  "price-desc": [{ id: "price", desc: true }],
  "start-desc": [{ id: "startDate", desc: true }],
}

const filterByName: FilterFn<Subscription> = (row, columnId, filterValue) => {
  const query = String(filterValue).trim().toLocaleLowerCase("it-IT")

  if (!query) {
    return true
  }

  return row
    .getValue<string>(columnId)
    .toLocaleLowerCase("it-IT")
    .includes(query)
}

const filterByCycle: FilterFn<Subscription> = (row, columnId, filterValue) => {
  return row.getValue<string>(columnId) === filterValue
}

const filterByRenewalWindow: FilterFn<Subscription> = (
  row,
  columnId,
  filterValue
) => {
  return matchesRenewalFilter(
    row.getValue<string>(columnId),
    filterValue as RenewalFilter,
    currentDateOnly()
  )
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pendingDeletion, setPendingDeletion] = useState<string[] | null>(null)

  const columns = useMemo<ColumnDef<Subscription>[]>(
    () => [
      {
        id: "select",
        enableColumnFilter: false,
        enableSorting: false,
        meta: {
          cellClassName: "w-10",
          headerClassName: "w-10",
        },
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(Boolean(checked))
            }
            aria-label="Seleziona tutti gli abbonamenti visibili"
          />
        ),
        cell: ({ row }) => (
          <div onClick={(event) => event.stopPropagation()}>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
              aria-label={`Seleziona ${row.original.name}`}
            />
          </div>
        ),
      },
      {
        accessorKey: "name",
        filterFn: filterByName,
        header: "Servizio",
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <SubscriptionLogo subscription={row.original} />
            <div className="min-w-0">
              <p className="max-w-52 truncate font-medium sm:max-w-none">
                {row.original.name}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="sm:hidden">
                  Rinnovo il {formatRenewalDate(row.original.renewalDate)}
                </span>
                <span className="hidden sm:inline">
                  Attivo dal {formatStartDate(row.original.startDate)}
                </span>
              </p>
            </div>
          </div>
        ),
        sortingFn: (left, right) =>
          left.original.name.localeCompare(right.original.name, "it-IT"),
      },
      {
        accessorKey: "price",
        header: "Prezzo",
        meta: {
          cellClassName:
            "text-right font-display text-lg lining-nums tabular-nums",
          headerClassName: "text-right",
        },
        cell: ({ row }) => formatCurrency(row.original.price),
      },
      {
        accessorKey: "billingCycle",
        enableSorting: false,
        filterFn: filterByCycle,
        header: "Frequenza",
        meta: {
          cellClassName: "hidden text-muted-foreground sm:table-cell",
          headerClassName: "hidden sm:table-cell",
        },
        cell: ({ row }) =>
          row.original.billingCycle === "monthly" ? "Mensile" : "Annuale",
      },
      {
        accessorKey: "renewalDate",
        filterFn: filterByRenewalWindow,
        header: "Prossimo rinnovo",
        meta: {
          cellClassName: "hidden sm:table-cell",
          headerClassName: "hidden sm:table-cell",
        },
        cell: ({ row }) => (
          <span className="flex items-center gap-2 text-muted-foreground">
            <CalendarDaysIcon aria-hidden="true" />
            {formatRenewalDate(row.original.renewalDate)}
          </span>
        ),
        sortingFn: (left, right) =>
          compareDateOnly(left.original.renewalDate, right.original.renewalDate),
      },
      {
        accessorKey: "startDate",
        enableColumnFilter: false,
        header: "",
        cell: () => null,
        sortingFn: (left, right) =>
          compareDateOnly(left.original.startDate, right.original.startDate),
      },
      {
        id: "actions",
        enableColumnFilter: false,
        enableSorting: false,
        meta: {
          cellClassName: "w-12",
          headerClassName: "w-12",
        },
        header: () => <span className="sr-only">Azioni</span>,
        cell: ({ row }) => (
          <div onClick={(event) => event.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Elimina ${row.original.name}`}
              onClick={() => setPendingDeletion([row.original.id])}
            >
              <Trash2Icon />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const columnFilters = useMemo<ColumnFiltersState>(
    () => [
      ...(query.trim() ? [{ id: "name", value: query }] : []),
      ...(cycleFilter !== "all"
        ? [{ id: "billingCycle", value: cycleFilter }]
        : []),
      ...(renewalFilter !== "all"
        ? [{ id: "renewalDate", value: renewalFilter }]
        : []),
    ],
    [cycleFilter, query, renewalFilter]
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table owns the table model lifecycle here.
  const table = useReactTable({
    columns,
    data: subscriptions,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      columnVisibility: {
        startDate: false,
      },
      rowSelection,
      sorting: sortStateByOption[sortOption],
    },
  })

  const visibleSubscriptions = table.getRowModel().rows
  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id)
  const filtersAreActive = cycleFilter !== "all" || renewalFilter !== "all"
  const sortingIsActive = sortOption !== "renewal-asc"

  function clearSelection() {
    setRowSelection({})
  }

  function changeCycleFilter(nextCycleFilter: CycleFilter) {
    setCycleFilter(nextCycleFilter)
    clearSelection()
  }

  function changeRenewalFilter(nextRenewalFilter: RenewalFilter) {
    setRenewalFilter(nextRenewalFilter)
    clearSelection()
  }

  function changeSortOption(nextSortOption: SortOption) {
    setSortOption(nextSortOption)
    clearSelection()
    setSortingOpen(false)
  }

  function resetFilters() {
    setCycleFilter("all")
    setRenewalFilter("all")
    clearSelection()
  }

  function confirmDeletion() {
    if (!pendingDeletion) {
      return
    }

    onDelete(pendingDeletion)
    clearSelection()
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
          placeholder="Cerca abbonamento..."
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

          <Popover
            open={filtersOpen}
            onOpenChange={(open) => {
              setFiltersOpen(open)
              if (open) {
                setSortingOpen(false)
              }
            }}
          >
            <PopoverTrigger
              render={
                <InputGroupButton
                  size="icon-sm"
                  variant={filtersAreActive || filtersOpen ? "secondary" : "ghost"}
                  aria-label="Filtra abbonamenti"
                />
              }
            >
              <ListFilterIcon />
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className="w-80 max-w-[calc(100vw-2rem)] sm:w-96">
              <PopoverHeader>
                <PopoverTitle>Affina archivio</PopoverTitle>
                <PopoverDescription>
                  Riduci l&apos;elenco per frequenza o per prossimita del rinnovo.
                </PopoverDescription>
              </PopoverHeader>
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Frequenza</FieldLabel>
                  <ToggleGroup
                    value={[cycleFilter]}
                    onValueChange={(value) =>
                      changeCycleFilter(
                        (value[0] as CycleFilter | undefined) ?? "all"
                      )
                    }
                    orientation="vertical"
                    spacing={1}
                    className="w-full items-stretch"
                  >
                    {cycleOptions.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
                <Field>
                  <FieldLabel>Prossimo rinnovo</FieldLabel>
                  <ToggleGroup
                    value={[renewalFilter]}
                    onValueChange={(value) =>
                      changeRenewalFilter(
                        (value[0] as RenewalFilter | undefined) ?? "all"
                      )
                    }
                    orientation="vertical"
                    spacing={1}
                    className="w-full items-stretch"
                  >
                    {renewalOptions.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
              </FieldGroup>
              {filtersAreActive && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <XIcon data-icon="inline-start" />
                    Azzera filtri
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Popover
            open={sortingOpen}
            onOpenChange={(open) => {
              setSortingOpen(open)
              if (open) {
                setFiltersOpen(false)
              }
            }}
          >
            <PopoverTrigger
              render={
                <InputGroupButton
                  size="icon-sm"
                  variant={sortingIsActive || sortingOpen ? "secondary" : "ghost"}
                  aria-label="Ordina abbonamenti"
                />
              }
            >
              <ArrowUpDownIcon />
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className="w-80 max-w-[calc(100vw-2rem)]">
              <PopoverHeader>
                <PopoverTitle>Ordina archivio</PopoverTitle>
                <PopoverDescription>
                  Scegli il criterio che mette in evidenza cio che vuoi controllare.
                </PopoverDescription>
              </PopoverHeader>
              <Field>
                <FieldLabel className="sr-only">Ordina per</FieldLabel>
                <ToggleGroup
                  value={[sortOption]}
                  onValueChange={(value) =>
                    changeSortOption(
                      (value[0] as SortOption | undefined) ?? "renewal-asc"
                    )
                  }
                  orientation="vertical"
                  spacing={1}
                  className="w-full items-stretch"
                >
                  {sortOptions.map((option) => (
                    <ToggleGroupItem
                      key={option.value}
                      value={option.value}
                      variant="outline"
                      size="sm"
                      className="h-auto w-full justify-start px-3 py-2"
                    >
                      <span className="flex flex-col items-start gap-0.5 text-left">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>

      <DataTable
        table={table}
        onRowClick={(row) => row.toggleSelected()}
        emptyState={
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Nessun risultato</p>
            <p className="text-xs text-muted-foreground">
              Modifica ricerca, filtri o ordinamento per riempire di nuovo
              l&apos;archivio.
            </p>
          </div>
        }
      />

      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {visibleSubscriptions.length} di {subscriptions.length} abbonamenti
          {selectedIds.length > 0 && ` · ${selectedIds.length} selezionati`}
        </p>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setPendingDeletion(selectedIds)}
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
              Questa operazione rimuovera definitivamente i dati salvati su
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
