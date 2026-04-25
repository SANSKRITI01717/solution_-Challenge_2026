export function getPriorityLevel(score) {
  if (score >= 7)  return 'critical'
  if (score >= 5)  return 'high'
  if (score >= 3)  return 'medium'
  return 'low'
}

export function getPriorityColor(score) {
  if (score >= 7)  return '#ef4444'
  if (score >= 5)  return '#f59e0b'
  if (score >= 3)  return '#3b82f6'
  return '#10b981'
}

export function getPriorityBg(score) {
  if (score >= 7)  return 'bg-red-500/20 text-red-400 border border-red-500/30'
  if (score >= 5)  return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  if (score >= 3)  return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
  return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
}

export function getSkillIcon(skill) {
  const icons = { medical: '🏥', rescue: '🚨', logistics: '📦', any: '⚡' }
  return icons[skill] || '⚡'
}

export function getSkillColor(skill) {
  const colors = {
    medical:   'bg-blue-500/20 text-blue-400',
    rescue:    'bg-red-500/20 text-red-400',
    logistics: 'bg-purple-500/20 text-purple-400',
    any:       'bg-gray-500/20 text-gray-400',
  }
  return colors[skill] || 'bg-gray-500/20 text-gray-400'
}
