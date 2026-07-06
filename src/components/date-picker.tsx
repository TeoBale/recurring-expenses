import { useState } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
  id: string
  name: string
  value: string
  onValueChange: (value: string) => void
  maxDate?: Date
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function serializeDate(date: Date) {
  return format(date, "yyyy-MM-dd")
}

export function DatePicker({
  id,
  name,
  value,
  onValueChange,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseDate(value)

  function selectDate(date: Date | undefined) {
    if (!date) {
      return
    }

    onValueChange(serializeDate(date))
    setOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className="w-full justify-between"
            />
          }
        >
          {format(selectedDate, "PPP", { locale: it })}
          <CalendarIcon data-icon="inline-end" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={selectDate}
            locale={it}
            captionLayout="dropdown"
            startMonth={new Date(1990, 0)}
            endMonth={maxDate ?? new Date(2100, 11)}
            disabled={maxDate ? { after: maxDate } : undefined}
          />
        </PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={value} />
    </>
  )
}
