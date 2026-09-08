import { useEffect } from 'react'
import { useStormStore } from '../store/stormStore'
import { getActiveStorms } from '../services/api'

export function useStorms() {
  const { storms, setStorms, selectedStorm } = useStormStore()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getActiveStorms()
        setStorms(data.storms || [])
      } catch (e) {
        console.error('Storm fetch failed', e)
      }
    }
    load()
    const interval = setInterval(load, 600_000)
    return () => clearInterval(interval)
  }, [])

  return { storms, selectedStorm }
}
