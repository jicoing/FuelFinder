# FindMyFuel

FindMyFuel is a comprehensive web and mobile application designed to help travelers and commuters optimize their fuel consumption and manage their vehicle expenses. From finding the nearest service stations to logging every fill-up, FindMyFuel provides the tools you need to stay in control of your journey.

## 🚀 Features

*   **Fuel Station Locator:** Find nearby fuel stations using precise geolocation or ZIP codes, displayed on an interactive map.
*   **Trip Fuel Cost Calculator:** Plan your budget by estimating fuel costs based on distance, vehicle efficiency, and local prices.
*   **Saved Stations:** Bookmark your favorite, trusted fuel stations for quick access.
*   **Fuel Logging:** Record detailed logs for every fill-up, including amount, price, fuel type, and mileage.
*   **Fuel History & Analysis:** Track your usage trends with comprehensive history logs per station, including calculated fuel rates (cost per liter).
*   **Multi-Country Support:** Seamless adaptation for different regions with local currency and unit support (KM/Miles).
*   **Mobile-First Design:** Optimized interaction flow for mobile devices, allowing for quick station selection and logging on the go.

## 🛠 Tech Stack

*   **Frontend:** React (TypeScript), Vite, Tailwind CSS, Framer Motion, shadcn/ui.
*   **Mapping:** React Leaflet, OpenStreetMap/Overpass API.
*   **Backend/Storage:** Supabase, Drizzle ORM (PostgreSQL).
*   **Payments:** Cashfree Integration.
*   **Mobile:** Capacitor for cross-platform deployment.

## 📦 Getting Started

### Prerequisites

*   Node.js (v18+)
*   NPM or Yarn
*   A Supabase account (for database/auth)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jicoing/FuelFinder.git
    cd FuelFinder
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Copy the example environment file and update it with your Supabase and API credentials:
    ```bash
    cp FuelFinder/.env.example FuelFinder/.env
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 📜 Available Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Compiles the application for production.
*   `npm run lint`: Runs ESLint to maintain code quality.
*   `npm run preview`: Serves the production build locally.

## 📈 Roadmap

- [ ] Implement real-time fuel price APIs for specific regions.
- [ ] Add advanced analytical charts for fuel consumption.
- [ ] Offline map caching for remote travel.

## 👤 Credits

Developed and maintained by [jicoing](https://jicoing.site).

## ⚖️ License

This project is open-source. Please check the repository for license details.
