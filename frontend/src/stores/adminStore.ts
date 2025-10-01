import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Environment = 'dev' | 'prod'

// Store feature toggle overrides in localStorage
// Allows admins to override feature flags without changing config files
interface AdminStore {
  adminModeActive: boolean
  featureOverrides: Record<string, boolean | undefined>
  environment: Environment

  // Actions
  setAdminModeActive: (active: boolean) => void
  setFeatureOverride: (featureName: string, enabled: boolean | undefined) => void
  clearFeatureOverride: (featureName: string) => void
  clearAllOverrides: () => void
  setEnvironment: (env: Environment) => void
  applyEnvironmentSettings: (features: Record<string, boolean>) => void
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      adminModeActive: false,
      featureOverrides: {},
      environment: import.meta.env.MODE === 'production' ? 'prod' : 'dev',

      setAdminModeActive: (active: boolean) => set({ adminModeActive: active }),

      setFeatureOverride: (featureName: string, enabled: boolean | undefined) =>
        set((state) => ({
          featureOverrides: {
            ...state.featureOverrides,
            [featureName]: enabled,
          },
        })),

      clearFeatureOverride: (featureName: string) =>
        set((state) => {
          const { [featureName]: _, ...rest } = state.featureOverrides
          return { featureOverrides: rest }
        }),

      clearAllOverrides: () => set({ featureOverrides: {} }),

      setEnvironment: (env: Environment) => set({ environment: env }),

      applyEnvironmentSettings: (features: Record<string, boolean>) =>
        set({ featureOverrides: features }),
    }),
    {
      name: 'admin-storage',
    }
  )
)
