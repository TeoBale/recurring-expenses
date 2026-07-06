import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRightIcon, MoonIcon, SunIcon } from "lucide-react"
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react"

import { AddSubscriptionDialog } from "@/components/add-subscription-dialog"
import {
  LiveSpendAmount,
  LiveSpendCounter,
} from "@/components/live-spend-counter"
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
import { useLiveSpend } from "@/hooks/use-live-spend"
import type { Subscription } from "@/types/subscription"

type View = "dashboard" | "subscriptions"

const pageTransitionClassName =
  "mx-auto col-start-1 row-start-1 w-full max-w-7xl px-4 delay-[260ms] transition-[opacity,transform] duration-200 ease-out data-[starting-style]:translate-y-1 data-[starting-style]:opacity-0 data-[ending-style]:-translate-y-1 data-[ending-style]:opacity-0 data-[ending-style]:delay-0 motion-reduce:delay-0 motion-reduce:transform-none motion-reduce:transition-none sm:px-6 lg:px-8"

function App() {
  const [activeView, setActiveView] = useState<View>("dashboard")
  const [isDashboardScrolled, setIsDashboardScrolled] = useState(false)
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(loadSubscriptions)
  const mainRef = useRef<HTMLElement>(null)
  const { theme, setTheme } = useTheme()
  const shouldReduceMotion = useReducedMotion()
  const { amount, monthlyTotal } = useLiveSpend(subscriptions)
  const isCounterDocked = activeView !== "dashboard" || isDashboardScrolled

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

  function changeView(view: View) {
    setActiveView(view)
    setIsDashboardScrolled(false)
    mainRef.current?.scrollTo({ top: 0 })
  }

  function handleMainScroll() {
    if (activeView !== "dashboard" || !mainRef.current) {
      return
    }

    const scrollTop = mainRef.current.scrollTop
    setIsDashboardScrolled((current) =>
      current ? scrollTop > 1 : scrollTop > 72
    )
  }

  return (
    <LayoutGroup id="live-spend">
      <Tabs
        value={activeView}
        onValueChange={(value) => changeView(value as View)}
        className="h-svh gap-0 overflow-hidden"
      >
        <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto grid min-h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0 justify-self-start">
              <AnimatePresence initial={false} mode="popLayout">
                {isCounterDocked ? (
                  <motion.button
                    key="counter"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    onClick={() => changeView("dashboard")}
                    aria-label="Torna al contatore principale"
                  >
                    <LiveSpendAmount amount={amount} compact />
                  </motion.button>
                ) : (
                  <motion.button
                    key="logo"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="font-display text-xl tracking-tight"
                    onClick={() => changeView("dashboard")}
                    aria-label="Vai alla dashboard"
                  >
                    Re.
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

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
          ref={mainRef}
          onScroll={handleMainScroll}
          className={cn(
            "grid min-h-0 w-full flex-1 grid-cols-1 overflow-y-auto [overflow-anchor:none]",
            activeView === "dashboard" &&
              "scroll-fade-b snap-y snap-proximity scroll-pt-[16svh] scroll-smooth scroll-fade-b-24 motion-reduce:scroll-auto"
          )}
        >
          <TabsContent value="dashboard" className={pageTransitionClassName}>
            <LiveSpendCounter
              amount={amount}
              monthlyTotal={monthlyTotal}
              hasSubscriptions={subscriptions.length > 0}
              isActive={!isCounterDocked}
            />

            <section className="mx-auto flex max-w-3xl snap-start flex-col gap-3 pb-[24svh]">
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
                  onClick={() => changeView("subscriptions")}
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
                <motion.div
                  initial={shouldReduceMotion ? false : "hidden"}
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        delayChildren: 0.3,
                        staggerChildren: 0.055,
                      },
                    },
                  }}
                  className="flex flex-col gap-3"
                >
                  {sortedSubscriptions.map((subscription) => (
                    <motion.div
                      key={subscription.id}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 0.2,
                            ease: [0.22, 1, 0.36, 1],
                          },
                        },
                      }}
                    >
                      <SubscriptionCard subscription={subscription} compact />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </section>
          </TabsContent>

          <TabsContent
            value="subscriptions"
            className={pageTransitionClassName}
          >
            <section className="flex flex-col gap-8 py-10 sm:py-14">
              <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
                <div className="max-w-xl">
                  <p className="text-sm text-muted-foreground">
                    Il tuo archivio
                  </p>
                  <h1 className="mt-1 font-display text-4xl tracking-tight sm:text-5xl">
                    Abbonamenti
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Tutte le spese ricorrenti, le frequenze e le prossime date
                    di rinnovo in un unico posto.
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
    </LayoutGroup>
  )
}

export default App
