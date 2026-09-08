import { create } from 'zustand'

export const useStormStore = create((set, get) => ({
  storms:        [],
  selectedStorm: null,
  predictions:   {},
  alerts:        [],
  windField:     [],
  connected:     false,
  lastSync:      null,

  setStorms:       (storms)      => set({ storms }),
  setConnected:    (connected)   => set({ connected }),
  setLastSync:     (t)           => set({ lastSync: t }),
  selectStorm:     (storm)       => set({ selectedStorm: storm }),
  clearSelection:  ()            => set({ selectedStorm: null }),
  addAlert:        (alert)       => set(s => ({ alerts: [alert, ...s.alerts].slice(0, 50) })),
  setWindField:    (pts)         => set({ windField: pts }),

  /** Find a storm by its ID from the current store */
  getStormById: (id) => {
    return get().storms.find(s => s.id === id || String(s.id) === String(id)) || null
  },

  updateStorm: (data) => set(s => {
    // Normalize lat/lon ↔ latitude/longitude so both naming conventions work
    const normalized = { ...data }
    if (data.latitude != null && data.lat == null)    normalized.lat = data.latitude
    if (data.longitude != null && data.lon == null)   normalized.lon = data.longitude
    if (data.lat != null && data.latitude == null)    normalized.latitude = data.lat
    if (data.lon != null && data.longitude == null)   normalized.longitude = data.lon

    const exists = s.storms.find(x => x.id === normalized.id)
    const storms = exists
      ? s.storms.map(x => x.id === normalized.id ? { ...x, ...normalized } : x)
      : [...s.storms, normalized]
    const selected = s.selectedStorm?.id === normalized.id
      ? { ...s.selectedStorm, ...normalized } : s.selectedStorm
    return { storms, selectedStorm: selected, lastSync: new Date() }
  }),

  setPrediction: (stormId, pred) => set(s => ({
    predictions: { ...s.predictions, [stormId]: pred }
  })),
}))

export default useStormStore;
