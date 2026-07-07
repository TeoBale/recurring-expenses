import { useState } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { formatDateOnly, parseDateOnly } from "@/lib/date-only"
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
  maxDate?: string
}

const START_MONTH = parseDateOnly("1990-01-01")
const END_MONTH = parseDateOnly("2100-12-31")

export function DatePicker({
  id,
  name,
  value,
  onValueChange,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseDateOnly(value)
  const maximumDate = maxDate ? parseDateOnly(maxDate) : END_MONTH

  function selectDate(date: Date | undefined) {
    if (!date) {
      return
    }

    onValueChange(formatDateOnly(date))
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
            startMonth={START_MONTH}
            endMonth={maximumDate}
            disabled={maxDate ? { after: maximumDate } : undefined}
          />
        </PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={value} />
    </>
  )
}
