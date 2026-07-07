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
})
