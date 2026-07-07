import { describe, expect, it, vi } from "vitest"
import {
  loadSubscriptions,
  saveSubscriptions,
} from "@/lib/subscription-storage"
import type { Subscription } from "@/types/subscription"

const STORAGE_KEY = "re.subscriptions.v1"

const storedSubscription = {
  id: "notion",
  name: "Notion",
  price: 8.5,
  billingCycle: "monthly" as const,
  startDate: "2026-01-10",
  renewalDate: "2026-02-10",
  logoSvg: {
    light: "<svg>light</svg>",
    dark: "<svg>dark</svg>",
  },
}

describe("loadSubscriptions", () => {
  it("loads valid subscriptions and filters malformed items", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        storedSubscription,
        {
          ...storedSubscription,
          id: "invalid-price",
          price: "8.5",
        },
        {
          ...storedSubscription,
          id: "invalid-logo",
          logoSvg: {
            light: "<svg>light</svg>",
            dark: 12,
          },
        },
      ])
    )

    expect(loadSubscriptions()).toEqual([storedSubscription])
  })

  it("returns an empty array when storage is malformed", () => {
    window.localStorage.setItem(STORAGE_KEY, "{bad json")

    expect(loadSubscriptions()).toEqual([])
  })
})

describe("saveSubscriptions", () => {
  it("persists only the serializable storage fields", () => {
    const subscriptions: Subscription[] = [
      {
        ...storedSubscription,
        icon: "serializable-icon" as unknown as Subscription["icon"],
      },
    ]

    saveSubscriptions(subscriptions)

    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
    ).toEqual([storedSubscription])
  })

  it("fails silently when storage throws", () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage unavailable")
      })

    expect(() =>
      saveSubscriptions([
        {
          ...storedSubscription,
        },
      ])
    ).not.toThrow()
    expect(setItemSpy).toHaveBeenCalledOnce()
  })
})
