import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import App from "@/App"
import { ThemeProvider } from "@/components/theme-provider"
import type { Subscription } from "@/types/subscription"

const STORAGE_KEY = "re.subscriptions.v1"

type RenderedApp = {
  container: HTMLDivElement
  cleanup: () => Promise<void>
}

function findButton(label: string) {
  return Array.from(document.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === label
  )
}

function findButtonContainingText(label: string) {
  return Array.from(document.querySelectorAll("button")).find((button) =>
    button.textContent?.includes(label)
  )
}

function findButtonByAriaLabel(label: string) {
  return document.querySelector(
    `button[aria-label="${label}"]`
  ) as HTMLButtonElement | null
}

function getVisibleTableNames() {
  return Array.from(document.querySelectorAll("tbody tr"))
    .map((row) =>
      row.querySelector("td:nth-child(2) p")?.textContent?.trim() ?? null
    )
    .filter((value): value is string => Boolean(value))
}

async function waitFor<T>(
  callback: () => T | null | undefined,
  timeoutMs = 3000
) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const result = callback()

    if (result) {
      return result
    }

    await act(async () => {
      await Promise.resolve()
    })
    await new Promise((resolve) => window.setTimeout(resolve, 16))
  }

  throw new Error("Timed out while waiting for the lazy surface to resolve.")
}

async function renderApp(
  subscriptions: Omit<Subscription, "icon">[] = []
): Promise<RenderedApp> {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))

  const container = document.createElement("div")
  document.body.appendChild(container)

  const root = createRoot(container)

  await act(async () => {
    root.render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    )
  })

  return {
    container,
    cleanup: async () => {
      await act(async () => {
        root.unmount()
      })
      container.remove()
    },
  }
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? false : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  })
})

afterEach(() => {
  document.body.innerHTML = ""
})

describe("App lazy subscription surfaces", () => {
  it("opens the add-subscription flow after the deferred dialog loads", async () => {
    const { cleanup } = await renderApp([
      {
        id: "spotify",
        name: "Spotify Premium",
        price: 10.99,
        billingCycle: "monthly",
        startDate: "2026-01-01",
        renewalDate: "2026-07-14",
      },
    ])

    const addButton = findButton("Aggiungi")
    expect(addButton).toBeDefined()

    await act(async () => {
      addButton?.click()
    })

    await waitFor(() =>
      document.body.textContent?.includes("Nuovo abbonamento") ? true : null
    )

    expect(document.body.textContent).toContain("Nuovo abbonamento")

    await cleanup()
  })

  it("renders the subscriptions archive after switching tabs", async () => {
    const { cleanup } = await renderApp([
      {
        id: "netflix",
        name: "Netflix Standard",
        price: 15.99,
        billingCycle: "monthly",
        startDate: "2025-10-01",
        renewalDate: "2026-07-20",
      },
    ])

    const subscriptionsTab = findButton("Abbonamenti")
    expect(subscriptionsTab).toBeDefined()

    await act(async () => {
      subscriptionsTab?.click()
    })

    const searchInput = await waitFor(() =>
      document.querySelector(
        'input[aria-label="Cerca abbonamento"]'
      ) as HTMLInputElement | null
    )

    expect(searchInput).toBeInstanceOf(HTMLInputElement)
    expect(document.body.textContent).toContain("Netflix Standard")

    await cleanup()
  })

  it("shows filter and sort controls in overlays and applies them to the archive", async () => {
    const { cleanup, container } = await renderApp([
      {
        id: "spotify",
        name: "Spotify Premium",
        price: 10.99,
        billingCycle: "monthly",
        startDate: "2025-10-01",
        renewalDate: "2026-07-14",
      },
      {
        id: "superhuman",
        name: "Superhuman",
        price: 30,
        billingCycle: "yearly",
        startDate: "2026-01-15",
        renewalDate: "2026-07-21",
      },
      {
        id: "notion",
        name: "Notion AI",
        price: 120,
        billingCycle: "yearly",
        startDate: "2024-11-03",
        renewalDate: "2026-08-01",
      },
    ])

    const subscriptionsTab = findButton("Abbonamenti")
    expect(subscriptionsTab).toBeDefined()

    await act(async () => {
      subscriptionsTab?.click()
    })

    await waitFor(() =>
      document.querySelector('input[aria-label="Cerca abbonamento"]')
        ? true
        : null
    )

    expect(document.body.textContent).not.toContain("Affina archivio")
    expect(getVisibleTableNames()).toEqual([
      "Spotify Premium",
      "Superhuman",
      "Notion AI",
    ])

    const filterButton = findButtonByAriaLabel("Filtra abbonamenti")
    expect(filterButton).toBeInstanceOf(HTMLButtonElement)

    await act(async () => {
      filterButton?.click()
    })

    await waitFor(() =>
      document.body.textContent?.includes("Affina archivio") ? true : null
    )

    expect(container.textContent).not.toContain("Affina archivio")

    const yearlyFilter = findButton("Annuali")
    expect(yearlyFilter).toBeDefined()

    await act(async () => {
      yearlyFilter?.click()
    })

    await waitFor(() =>
      getVisibleTableNames().length === 2 ? true : null
    )

    expect(getVisibleTableNames()).toEqual(["Superhuman", "Notion AI"])

    const resetFiltersButton = findButton("Azzera filtri")
    expect(resetFiltersButton).toBeDefined()

    await act(async () => {
      resetFiltersButton?.click()
    })

    await waitFor(() =>
      getVisibleTableNames().length === 3 ? true : null
    )

    expect(getVisibleTableNames()).toEqual([
      "Spotify Premium",
      "Superhuman",
      "Notion AI",
    ])

    const sortButton = findButtonByAriaLabel("Ordina abbonamenti")
    expect(sortButton).toBeInstanceOf(HTMLButtonElement)

    await act(async () => {
      sortButton?.click()
    })

    await waitFor(() =>
      document.body.textContent?.includes("Ordina archivio") ? true : null
    )

    expect(container.textContent).not.toContain("Ordina archivio")

    const priceDescending = findButtonContainingText("Prezzo decrescente")
    expect(priceDescending).toBeDefined()

    await act(async () => {
      priceDescending?.click()
    })

    await waitFor(() =>
      getVisibleTableNames()[0] === "Notion AI" ? true : null
    )

    expect(getVisibleTableNames()).toEqual([
      "Notion AI",
      "Superhuman",
      "Spotify Premium",
    ])

    await cleanup()
  })
})
