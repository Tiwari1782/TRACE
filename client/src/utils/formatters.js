export const formatWind       = (kt)  => `${Math.round(kt ?? 0)} kt`
export const formatPressure   = (mb)  => `${Math.round(mb ?? 1013)} mb`
export const formatLat        = (v)   => v == null ? '—' : `${Math.abs(v).toFixed(1)}°${v >= 0 ? 'N' : 'S'}`
export const formatLon        = (v)   => v == null ? '—' : `${Math.abs(v).toFixed(1)}°${v >= 0 ? 'E' : 'W'}`
export const formatPercent    = (v)   => `${Math.round((v ?? 0) * 100)}%`
export const formatConfidence = (c)   => `${Math.round((c ?? 0) * 100)}%`
export const formatRI         = (prob)=> `${Math.round((prob ?? 0) * 100)}%`
export const formatBasin      = (b)   => {
  const map = { NA: 'North Atlantic', EP: 'Eastern Pacific', WP: 'Western Pacific', NI: 'North Indian', SI: 'South Indian', SP: 'South Pacific' }
  return map[b] || b || 'Unknown'
}
export const formatTime       = ()    => new Date().toUTCString().slice(17, 22) + ' UTC'
export const windToKph        = (kt)  => Math.round((kt ?? 0) * 1.852)
export const windDelta        = (a,b) => { const d = Math.round((b??0)-(a??0)); return d > 0 ? `+${d}` : `${d}` }
