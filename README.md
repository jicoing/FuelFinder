# FindMyFuel

Find the cheapest fuel stations nearby, calculate trip costs, track mileage and save money on every fill-up. Works in India, US, UK, UAE and 20+ countries.

**Live:** [www.findmyfuel.site](https://www.findmyfuel.site)

## 🚀 Features

- **Fuel Station Locator** — Find nearby stations using GPS or ZIP code on an interactive map
- **Crowdsourced Fuel Prices** — Users report live prices; see latest petrol/diesel rates at each station
- **Fuel Efficiency Dashboard** — Track km/L, cost/km, monthly spending trends with charts
- **Trip Fuel Cost Calculator** — Estimate trip costs based on distance, mileage and fuel price
- **Fuel Logging** — Record every fill-up with amount, price, fuel type, and mileage
- **Saved Stations** — Bookmark favorite stations for quick access
- **Multi-Country Support** — Local currency, units (km/miles), and fuel types for 20+ countries
- **Mobile-First Design** — Optimized for iPhone SE (320px) through large tablets
- **Premium (₹120 / $1.49 one-time)** — Unlimited stations, export data, sync across devices

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, shadcn/ui |
| Mapping | React Leaflet, OpenStreetMap, Overpass API |
| Backend | Express, Supabase (Postgres + Auth + RLS) |
| Payments | Cashfree (India) |
| Mobile | Capacitor (Android) |
| Hosting | Vercel |

## 📦 Getting Started

### Prerequisites

- Node.js v18+
- Supabase project (for database & auth)

### Setup

```bash
git clone https://github.com/jicoing/FuelFinder.git
cd FuelFinder
npm install
cp .env.example .env   # Fill in Supabase & Cashfree keys
npm run dev             # http://localhost:5001
```

### Database

Run these in the Supabase SQL Editor:
1. `supabase/schema.sql` — Core tables
2. `migrations/add_fuel_logs.sql` — Fuel logs
3. `migrations/add_fuel_price_reports.sql` — Crowdsourced prices

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite + Express) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run check` | TypeScript type check |

## 📈 Roadmap

- [x] Crowdsourced fuel price reports
- [x] Fuel efficiency dashboard with charts
- [ ] Real-time price API integration (BPCL/IOCL)
- [ ] Price alerts & notifications
- [ ] Multi-vehicle support
- [ ] City-specific landing pages for SEO
- [ ] PWA offline mode

## 👤 Author

Built by [jicoing](https://jicoing.site) · [@jicoing](https://twitter.com/jicoing)

## ⚖️ License

MIT
