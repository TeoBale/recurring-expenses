import { useMemo, useState } from "react"
import {
  ArrowRightIcon,
  CreditCardIcon,
  MoonIcon,
  SunIcon,
  WalletCardsIcon,
} from "lucide-react"

import { AddSubscriptionDialog } from "@/components/add-subscription-dialog"
import { LiveSpendCounter } from "@/components/live-spend-counter"
import { SubscriptionCard } from "@/components/subscription-card"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { initialSubscriptions } from "@/data/subscriptions"
import { formatCurrency, totalMonthlyCost } from "@/lib/subscriptions"
import type { Subscription } from "@/types/subscription"

type View = "dashboard" | "subscriptions"

function App() {
  const [activeView, setActiveView] = useState<View>("dashboard")
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(initialSubscriptions)
  const { theme, setTheme } = useTheme()

  const sortedSubscriptions = useMemo(
    () =>
      [...subscriptions].sort(
        (a, b) =>
          new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
      ),
    [subscriptions]
  )

  const monthlyTotal = totalMonthlyCost(subscriptions)

  function addSubscription(subscription: Subscription) {
    setSubscriptions((current) => [...current, subscription])
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Tabs
      value={activeView}
      onValueChange={(value) => setActiveView(value as View)}
      className="min-h-svh gap-0"
    >
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-xl">
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
        <TabsContent value="dashboard">
          <LiveSpendCounter subscriptions={subscriptions} />

          <section className="mx-auto flex max-w-3xl flex-col gap-5 pb-20">
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

            <div className="flex flex-col gap-3">
              {sortedSubscriptions.slice(0, 3).map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  compact
                />
              ))}
            </div>
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

            <div className="grid gap-3 sm:grid-cols-3">
              <Card size="sm">
                <CardHeader>
                  <CardDescription>Abbonamenti attivi</CardDescription>
                  <CardTitle className="font-display text-3xl">
                    {subscriptions.length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WalletCardsIcon className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardDescription>Spesa mensile</CardDescription>
                  <CardTitle className="font-display text-3xl">
                    {formatCurrency(monthlyTotal)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CreditCardIcon className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardDescription>Proiezione annuale</CardDescription>
                  <CardTitle className="font-display text-3xl">
                    {formatCurrency(monthlyTotal * 12)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Basata sul totale attuale
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              {sortedSubscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                />
              ))}
            </div>
          </section>
        </TabsContent>
      </main>
    </Tabs>
  )
}

export default App
