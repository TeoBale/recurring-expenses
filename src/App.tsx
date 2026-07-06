import { useEffect, useMemo, useState } from "react"
import { ArrowRightIcon, MoonIcon, SunIcon } from "lucide-react"

import { AddSubscriptionDialog } from "@/components/add-subscription-dialog"
import { LiveSpendCounter } from "@/components/live-spend-counter"
import { SubscriptionCard } from "@/components/subscription-card"
import { SubscriptionsEmptyState } from "@/components/subscriptions-empty-state"
import { SubscriptionsTable } from "@/components/subscriptions-table"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  loadSubscriptions,
  saveSubscriptions,
} from "@/lib/subscription-storage"
import { cn } from "@/lib/utils"
import type { Subscription } from "@/types/subscription"

type View = "dashboard" | "subscriptions"

function App() {
  const [activeView, setActiveView] = useState<View>("dashboard")
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(loadSubscriptions)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    saveSubscriptions(subscriptions)
  }, [subscriptions])

  const sortedSubscriptions = useMemo(
    () =>
      [...subscriptions].sort(
        (a, b) =>
          new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
      ),
    [subscriptions]
  )

  function addSubscription(subscription: Subscription) {
    setSubscriptions((current) => [...current, subscription])
  }

  function deleteSubscriptions(subscriptionIds: string[]) {
    const idsToDelete = new Set(subscriptionIds)
    setSubscriptions((current) =>
      current.filter((subscription) => !idsToDelete.has(subscription.id))
    )
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Tabs
      value={activeView}
      onValueChange={(value) => setActiveView(value as View)}
      className="h-svh gap-0 overflow-hidden"
    >
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto grid min-h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="justify-self-start font-display text-xl tracking-tight"
            onClick={() => setActiveView("dashboard")}
            aria-label="Vai alla dashboard"
          >
            Re.
          </button>

          <TabsList aria-label="Navigazione principale">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="subscriptions">Abbonamenti</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 justify-self-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Cambia tema"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>
            <div className="hidden sm:block">
              <AddSubscriptionDialog onAdd={addSubscription} />
            </div>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto min-h-0 w-full max-w-7xl flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8",
          activeView === "dashboard" && "scroll-fade-b scroll-fade-b-24"
        )}
      >
        <TabsContent value="dashboard">
          <LiveSpendCounter subscriptions={subscriptions} />

          <section className="mx-auto flex max-w-3xl flex-col gap-3 pb-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Prossimi rinnovi
                </p>
                <h1 className="mt-1 font-display text-3xl tracking-tight">
                  In arrivo
                </h1>
              </div>
              <Button
                variant="ghost"
                onClick={() => setActiveView("subscriptions")}
              >
                Vedi tutti
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>

            {sortedSubscriptions.length === 0 ? (
              <SubscriptionsEmptyState
                className="min-h-64"
                onAdd={addSubscription}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {sortedSubscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    compact
                  />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="subscriptions">
          <section className="flex flex-col gap-8 py-10 sm:py-14">
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
              <div className="max-w-xl">
                <p className="text-sm text-muted-foreground">Il tuo archivio</p>
                <h1 className="mt-1 font-display text-4xl tracking-tight sm:text-5xl">
                  Abbonamenti
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Tutte le spese ricorrenti, le frequenze e le prossime date di
                  rinnovo in un unico posto.
                </p>
              </div>
              <div className="sm:hidden">
                <AddSubscriptionDialog onAdd={addSubscription} />
              </div>
            </div>

            {subscriptions.length === 0 ? (
              <SubscriptionsEmptyState
                className="min-h-96"
                onAdd={addSubscription}
              />
            ) : (
              <SubscriptionsTable
                subscriptions={sortedSubscriptions}
                onDelete={deleteSubscriptions}
              />
            )}
          </section>
        </TabsContent>
      </main>
    </Tabs>
  )
}

export default App
