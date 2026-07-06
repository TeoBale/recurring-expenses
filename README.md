# Re. — Recurring Expenses Tracker

A sleek, privacy-first web app to track your recurring subscriptions and visualise how much they actually cost you — down to the second.

## ✨ Features

- **Live spend counter** — a real-time rolling counter shows how much you've spent this month, updating every second with smooth digit animations.
- **Dashboard overview** — see your next three upcoming renewals at a glance.
- **Full subscription table** — browse, sort, and bulk-delete all your subscriptions in a responsive data table with row selection.
- **Quick-add with presets** — add subscriptions in seconds by picking from a curated list of popular services (Netflix, Spotify, iCloud, and many more) or create a fully custom entry.
- **Monthly & yearly billing** — supports both billing cycles, with prices automatically normalised to a monthly total.
- **Local storage persistence** — your data never leaves your browser. No accounts, no servers, no tracking.
- **Dark / light theme** — toggle between themes with a single click; the preference is remembered across sessions.
- **Fully responsive** — designed mobile-first with adaptive layouts for every screen size.

## 🛠 Tech Stack

| Layer        | Technology                                                |
| ------------ | --------------------------------------------------------- |
| Framework    | [React 19](https://react.dev) + TypeScript                |
| Build tool   | [Vite 8](https://vite.dev)                                |
| Styling      | [Tailwind CSS 4](https://tailwindcss.com)                 |
| Components   | [shadcn/ui](https://ui.shadcn.com)                        |
| Icons        | [Lucide](https://lucide.dev)                              |
| Animations   | [slot-text](https://github.com/nicksrandall/slot-text)    |
| Date utils   | [date-fns](https://date-fns.org)                          |
| Typography   | Inter (variable) + Instrument Serif                       |

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20 (or [Bun](https://bun.sh))

### Install & Run

```bash
# Clone the repo
git clone https://github.com/TeoBale/recurring-expenses.git
cd recurring-expenses

# Install dependencies
bun install   # or: npm install

# Start the dev server
bun dev       # or: npm run dev
```

The app will be available at **http://localhost:5173**.

### Other Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `bun run build`      | Type-check & production build      |
| `bun run preview`    | Preview the production build       |
| `bun run lint`       | Lint with ESLint                   |
| `bun run format`     | Format with Prettier               |
| `bun run typecheck`  | Run the TypeScript compiler check  |

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                  # shadcn/ui primitives (button, tabs, dialog, …)
│   ├── add-subscription-dialog.tsx
│   ├── date-picker.tsx
│   ├── live-spend-counter.tsx
│   ├── subscription-card.tsx
│   ├── subscriptions-empty-state.tsx
│   ├── subscriptions-table.tsx
│   └── theme-provider.tsx
├── data/
│   └── subscription-providers.json   # preset service catalogue
├── lib/
│   ├── subscription-storage.ts       # localStorage read / write
│   └── subscriptions.ts              # cost calculations & formatting
├── types/
│   └── subscription.ts               # shared TypeScript types
├── App.tsx
├── main.tsx
└── index.css
```

## 📄 License

This project is provided as-is for personal use.
