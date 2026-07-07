import { flexRender, type Row, type Table as TanStackTable } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type DataTableColumnMeta = {
  cellClassName?: string
  headerClassName?: string
}

type DataTableProps<TData> = {
  className?: string
  emptyState: React.ReactNode
  onRowClick?: (row: Row<TData>) => void
  table: TanStackTable<TData>
}

export function DataTable<TData>({
  className,
  emptyState,
  onRowClick,
  table,
}: DataTableProps<TData>) {
  const columnsCount = table.getVisibleLeafColumns().length

  return (
    <div className={cn("overflow-hidden rounded-xl border", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as
                  | DataTableColumnMeta
                  | undefined

                return (
                  <TableHead key={header.id} className={meta?.headerClassName}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as
                    | DataTableColumnMeta
                    | undefined

                  return (
                    <TableCell key={cell.id} className={meta?.cellClassName}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnsCount} className="h-32 text-center">
                {emptyState}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
