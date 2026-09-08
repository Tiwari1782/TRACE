import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useStormStore } from '../store/stormStore'

const SERVER = import.meta.env.VITE_API_URL || ''

export function useSocket() {
  const socketRef = useRef(null)
  const { updateStorm, setPrediction, addAlert, setWindField, setConnected } = useStormStore()

  useEffect(() => {
    const socket = io(SERVER, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    socket.on('connect',          ()   => setConnected(true))
    socket.on('disconnect',       ()   => setConnected(false))
    socket.on('storm_update',     (d)  => updateStorm(d))
    socket.on('prediction_update',(d)  => setPrediction(d.storm_id, d))
    socket.on('alert_update',     (d)  => addAlert(d))
    socket.on('wind_field_update',(d)  => setWindField(d.points || []))

    return () => socket.disconnect()
  }, [])

  const subscribe = (stormId) => socketRef.current?.emit('subscribe_storm', { storm_id: stormId })
  const unsubscribe = (stormId) => socketRef.current?.emit('unsubscribe_storm', { storm_id: stormId })

  const { connected: isConnected } = useStormStore()
  return { subscribe, unsubscribe, isConnected }
}
