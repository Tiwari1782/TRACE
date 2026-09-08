export function getCategoryColor(category) {
  const map = { 5:'#ff1744', 4:'#ff5722', 3:'#ff9800', 2:'#ffc107', 1:'#00e676', 0:'#7c8cf8', '-1':'#455a64' }
  return map[String(category)] ?? '#455a64'
}
export function getCategoryLabel(category) {
  const map = { 5:'CAT 5', 4:'CAT 4', 3:'CAT 3', 2:'CAT 2', 1:'CAT 1', 0:'TS', '-1':'TD' }
  return map[String(category)] ?? 'TD'
}
export function getCategoryGlow(category) {
  const c = getCategoryColor(category)
  return `0 0 12px ${c}80, 0 0 24px ${c}30`
}
export function isCritical(category) { return category >= 4 }
