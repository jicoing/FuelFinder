
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const countryData = {
    US: { name: "United States", distance: "miles", volume: "gallons", currency: "$", mileage: "mpg" },
    IN: { name: "India", distance: "km", volume: "L", currency: "₹", mileage: "km/L" },
    UK: { name: "United Kingdom", distance: "miles", volume: "L", currency: "£", mileage: "mpl" },
    CA: { name: "Canada", distance: "km", volume: "L", currency: "CAD", mileage: "km/L" },
    AU: { name: "Australia", distance: "km", volume: "L", currency: "AUD", mileage: "km/L" },
    DE: { name: "Germany", distance: "km", volume: "L", currency: "€", mileage: "km/L" },
    NO: { name: "Norway", distance: "km", volume: "L", currency: "NOK", mileage: "km/L" },
    JP: { name: "Japan", distance: "km", volume: "L", currency: "¥", mileage: "km/L" },
    CN: { name: "China", distance: "km", volume: "L", currency: "¥", mileage: "km/L" },
    SA: { name: "Saudi Arabia", distance: "km", volume: "L", currency: "SAR", mileage: "km/L" },
    AE: { name: "UAE", distance: "km", volume: "L", currency: "AED", mileage: "km/L" },
    LK: { name: "Sri Lanka", distance: "km", volume: "L", currency: "LKR", mileage: "km/L" },
    NG: { name: "Nigeria", distance: "km", volume: "L", currency: "₦", mileage: "km/L" },
    IR: { name: "Iran", distance: "km", volume: "L", currency: "rial", mileage: "km/L" },
    VE: { name: "Venezuela", distance: "km", volume: "L", currency: "Bs", mileage: "km/L" },
  };

type Store = {
  country: string | null
  setCountry: (country: string) => void
}

export const useCountryPreference = create(
  persist<Store>(
    (set) => ({
      country: null,
      setCountry(country) {
        set({ country })
      },
    }),
    {
      name: 'country-preference',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
