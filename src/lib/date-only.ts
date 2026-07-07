import {
  addMonths,
  addYears,
  differenceInCalendarDays,
  format,
  isValid,
  parse,
} from "date-fns"

import type { BillingCycle } from "@/types/subscription"

const DATE_ONLY_FORMAT = "yyyy-MM-dd"

export function formatDateOnly(date: Date) {
  return format(date, DATE_ONLY_FORMAT)
}

export function currentDateOnly(referenceDate: Date = new Date()) {
  return formatDateOnly(referenceDate)
}

export function parseDateOnly(value: string) {
  const parsedDate = parse(value, DATE_ONLY_FORMAT, new Date())

  if (!isValid(parsedDate) || formatDateOnly(parsedDate) !== value) {
    throw new RangeError(`Invalid date-only value: ${value}`)
  }

  return parsedDate
}

export function addBillingCycle(value: string, billingCycle: BillingCycle) {
  const date = parseDateOnly(value)
  const nextDate =
    billingCycle === "yearly" ? addYears(date, 1) : addMonths(date, 1)

  return formatDateOnly(nextDate)
}

export function compareDateOnly(left: string, right: string) {
  if (left === right) {
    return 0
  }

  return left < right ? -1 : 1
}

type DefaultRenewalDateOptions = {
  startDate?: string
  referenceDate?: string
}

export function defaultRenewalDate(
  billingCycle: BillingCycle,
  { startDate, referenceDate = currentDateOnly() }: DefaultRenewalDateOptions = {}
) {
  const anchorDate =
    startDate && compareDateOnly(startDate, referenceDate) > 0
      ? startDate
      : referenceDate

  return addBillingCycle(anchorDate, billingCycle)
}

export function daysUntilDateOnly(
  value: string,
  referenceDate: string = currentDateOnly()
) {
  return differenceInCalendarDays(
    parseDateOnly(value),
    parseDateOnly(referenceDate)
  )
}

export function formatDateOnlyForLocale(
  value: string,
  options: Intl.DateTimeFormatOptions,
  locale = "it-IT"
) {
  return new Intl.DateTimeFormat(locale, options).format(parseDateOnly(value))
}
