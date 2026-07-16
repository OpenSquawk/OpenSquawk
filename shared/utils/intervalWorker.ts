// A plain Worker's timers are not subject to the background-tab throttling
// that setInterval/requestAnimationFrame get on the main thread (Chrome clamps
// background-tab setInterval down to ~1/min after a few minutes; rAF stops
// entirely) — used by anything in WebSim that must keep ticking while its tab
// is backgrounded (the intended usage: WebSim in one tab, /live-atc in
// another). docs/plans/2026-07-16-codex-fixes-live-atc-loop-websim.md WP2 Fix 1.
export function createIntervalWorker(intervalMs: number, onTick: () => void): { stop: () => void } | null {
  if (typeof Worker === 'undefined') return null

  const source = `
    let timer = null
    self.onmessage = (e) => {
      if (e.data === 'start') {
        timer = setInterval(() => self.postMessage('tick'), ${intervalMs})
      } else if (e.data === 'stop') {
        if (timer !== null) clearInterval(timer)
        self.close()
      }
    }
  `
  const blob = new Blob([source], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)
  const worker = new Worker(url)
  worker.onmessage = (e: MessageEvent) => {
    if (e.data === 'tick') onTick()
  }
  worker.postMessage('start')

  return {
    stop: () => {
      worker.postMessage('stop')
      worker.terminate()
      URL.revokeObjectURL(url)
    },
  }
}
