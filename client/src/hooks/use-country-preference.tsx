
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
