import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
})

export const getActiveStorms  = ()         => api.get('/api/storms/active').then(r => r.data)
export const getStorm         = (id)       => api.get(`/api/storms/${id}`).then(r => r.data)
export const getPrediction    = (id)       => api.get(`/api/predict/${id}`).then(r => r.data)
export const getAlerts        = ()         => api.get('/api/alerts/recent').then(r => r.data)
export const getWindField     = ()         => api.get('/api/wind-field').then(r => r.data)
export const checkHealth      = ()         => api.get('/api/health').then(r => r.data)
export const refreshStorms    = ()         => api.post('/api/storms/refresh').then(r => r.data)
export const getTrackHistory  = (id)       => api.get(`/api/storms/${id}/track`).then(r => r.data).catch(() => ({ track: [] }))
export default api
