import type { Subscription } from "@/types/subscription"

const SUBSCRIPTIONS_STORAGE_KEY = "re.subscriptions.v1"

type StoredSubscription = Omit<Subscription, "icon">

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isStoredSubscription(value: unknown): value is StoredSubscription {
  if (!isRecord(value)) {
    return false
  }

  const hasValidLogo =
    value.logoSvg === undefined ||
    (isRecord(value.logoSvg) &&
      typeof value.logoSvg.light === "string" &&
      typeof value.logoSvg.dark === "string")

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    (value.billingCycle === "monthly" || value.billingCycle === "yearly") &&
    typeof value.startDate === "string" &&
    typeof value.renewalDate === "string" &&
    hasValidLogo
  )
}

export function loadSubscriptions(): Subscription[] {
  try {
    const storedValue = window.localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY)

    if (!storedValue) {
      return []
    }

    const parsedValue: unknown = JSON.parse(storedValue)

    return Array.isArray(parsedValue)
      ? parsedValue.filter(isStoredSubscription)
      : []
  } catch {
    return []
  }
}

export function saveSubscriptions(subscriptions: Subscription[]) {
  try {
    const storedSubscriptions: StoredSubscription[] = subscriptions.map(
      ({ id, name, price, billingCycle, startDate, renewalDate, logoSvg }) => ({
        id,
        name,
        price,
        billingCycle,
        startDate,
        renewalDate,
        logoSvg,
      })
    )

    window.localStorage.setItem(
      SUBSCRIPTIONS_STORAGE_KEY,
      JSON.stringify(storedSubscriptions)
    )
  } catch {
    // The app remains usable when storage is unavailable or full.
  }
}
