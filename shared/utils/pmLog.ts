// ---------------------------------------------------------------------------
// Debug logger — prefix [PM] so it's easy to filter in DevTools.
// Disable at runtime: localStorage.setItem('PM_DEBUG', '0')
// Re-enable:          localStorage.setItem('PM_DEBUG', '1')
// Show trace detail:  localStorage.setItem('PM_DEBUG', 'verbose')
// ---------------------------------------------------------------------------
export const pmLog = (() => {
  const level = () => {
    if (typeof localStorage === 'undefined') return 'on'
    return localStorage.getItem('PM_DEBUG') ?? 'on'
  }
  const enabled  = () => level() !== '0'
  const verbose  = () => level() === 'verbose'
  return {
    info:  (...a: any[]) => enabled() && console.log   ('[PM]', ...a),
    warn:  (...a: any[]) => enabled() && console.warn  ('[PM]', ...a),
    error: (...a: any[]) => enabled() && console.error ('[PM]', ...a),
    debug: (...a: any[]) => verbose() && console.debug ('[PM:v]', ...a),
    group: (label: string, fn: () => void) => {
      if (!enabled()) { fn(); return }
      console.groupCollapsed(`[PM] ${label}`)
      fn()
      console.groupEnd()
    },
  }
})()
