import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSession = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ token, user }) => set({ token, user }),
      logout: () => set({ token: null, user: null })
    }),
    { name: "sos-link-session" }
  )
);
