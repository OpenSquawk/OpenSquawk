import { ref, type Ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import useCommunicationsEngine from '../../shared/utils/communicationsEngine'

export type BugReportArrow = { fx: number; fy: number; tx: number; ty: number }

export interface BugReportDeps {
  /** Scenario the report is captured in — stored alongside the state snapshot. */
  activeScenario: Ref<{ id?: string; startFlow?: string } | null | undefined>
}

export function useBugReport(
  engine: ReturnType<typeof useCommunicationsEngine>,
  deps: BugReportDeps,
) {
  const api = useApi()
  const auth = useAuthStore()
  const { currentState, variables: vars, flags, flightContext, communicationLog: log } = engine
  const { activeScenario } = deps

  const showBugReportDialog = ref(false)
  const bugReportComment = ref('')
  const bugReportContact = ref('')
  const bugReportScreenshot = ref<string | null>(null)
  const bugReportArrows = ref<BugReportArrow[]>([])
  const bugReportLoading = ref(false)
  const bugReportCapturing = ref(false)
  const bugReportError = ref('')
  const bugReportSuccess = ref(false)
  const bugReportCanvasRef = ref<HTMLCanvasElement | null>(null)
  const bugReportImgRef = ref<HTMLImageElement | null>(null)
  let _arrowDrawing = false
  let _arrowStart = { x: 0, y: 0 }

  function setupAnnotationCanvas() {
    const canvas = bugReportCanvasRef.value
    const img = bugReportImgRef.value
    if (!canvas || !img) return
    canvas.width = img.clientWidth
    canvas.height = img.clientHeight
  }

  function _drawArrow(ctx: CanvasRenderingContext2D, fx: number, fy: number, tx: number, ty: number) {
    const headLen = 14
    const angle = Math.atan2(ty - fy, tx - fx)
    ctx.strokeStyle = '#ef4444'
    ctx.fillStyle = '#ef4444'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    ctx.lineTo(tx, ty)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.lineTo(tx - headLen * Math.cos(angle - Math.PI / 6), ty - headLen * Math.sin(angle - Math.PI / 6))
    ctx.lineTo(tx - headLen * Math.cos(angle + Math.PI / 6), ty - headLen * Math.sin(angle + Math.PI / 6))
    ctx.closePath()
    ctx.fill()
  }

  function _redrawAnnotations(preview?: BugReportArrow) {
    const canvas = bugReportCanvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const a of bugReportArrows.value) _drawArrow(ctx, a.fx, a.fy, a.tx, a.ty)
    if (preview) {
      _drawArrow(ctx, preview.fx, preview.fy, preview.tx, preview.ty)
    }
  }

  function _canvasCoords(e: MouseEvent) {
    const canvas = bugReportCanvasRef.value!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onCanvasMouseDown(e: MouseEvent) {
    _arrowStart = _canvasCoords(e)
    _arrowDrawing = true
  }

  function onCanvasMouseMove(e: MouseEvent) {
    if (!_arrowDrawing) return
    const { x, y } = _canvasCoords(e)
    _redrawAnnotations({ fx: _arrowStart.x, fy: _arrowStart.y, tx: x, ty: y })
  }

  function onCanvasMouseUp(e: MouseEvent) {
    if (!_arrowDrawing) return
    _arrowDrawing = false
    const { x, y } = _canvasCoords(e)
    const dx = x - _arrowStart.x
    const dy = y - _arrowStart.y
    if (Math.sqrt(dx * dx + dy * dy) < 8) { _redrawAnnotations(); return }
    bugReportArrows.value = [...bugReportArrows.value, { fx: _arrowStart.x, fy: _arrowStart.y, tx: x, ty: y }]
    _redrawAnnotations()
  }

  function onCanvasMouseLeave() {
    if (!_arrowDrawing) return
    _arrowDrawing = false
    _redrawAnnotations()
  }

  function undoLastArrow() {
    bugReportArrows.value = bugReportArrows.value.slice(0, -1)
    _redrawAnnotations()
  }

  async function openBugReport() {
    bugReportError.value = ''
    bugReportSuccess.value = false
    bugReportComment.value = ''
    bugReportArrows.value = []
    bugReportScreenshot.value = null
    bugReportContact.value = [auth.user?.name, auth.user?.email].filter(Boolean).join(' — ')

    // Capture the screenshot BEFORE opening the dialog, otherwise the open
    // dialog overlay would appear in the shot instead of the actual bug state.
    bugReportCapturing.value = true
    try {
      // modern-screenshot renders via a native SVG <foreignObject>, so modern CSS
      // such as color-mix()/oklch() (used throughout the app) is supported.
      // html2canvas could not parse those and silently produced no screenshot.
      const { domToJpeg } = await import('modern-screenshot')
      bugReportScreenshot.value = await domToJpeg(document.body, {
        quality: 0.75,
        scale: 0.55,
        // Skip assets we cannot read (cross-origin tiles/avatars) instead of failing.
        filter: (node) => !(node instanceof Element && node.getAttribute?.('data-no-screenshot') === 'true'),
      })
    } catch (err) {
      // Screenshot is optional — keep the report flow usable, but surface why.
      console.warn('[PM] Bug report screenshot capture failed', err)
      bugReportScreenshot.value = null
      bugReportError.value = 'Screenshot konnte nicht erstellt werden – Bug-Report ohne Bild möglich.'
    } finally {
      bugReportCapturing.value = false
    }

    showBugReportDialog.value = true
  }

  async function submitBugReport() {
    if (!bugReportComment.value.trim()) { bugReportError.value = 'Bitte einen Kommentar eingeben.'; return }
    bugReportLoading.value = true
    bugReportError.value = ''

    try {
      let finalScreenshot: string | undefined
      if (bugReportScreenshot.value) {
        const img = bugReportImgRef.value
        const src = new Image()
        await new Promise<void>((res) => { src.onload = () => res(); src.src = bugReportScreenshot.value! })
        const out = document.createElement('canvas')
        out.width = src.naturalWidth; out.height = src.naturalHeight
        const ctx = out.getContext('2d')!
        ctx.drawImage(src, 0, 0)
        if (bugReportArrows.value.length > 0 && img) {
          const sx = src.naturalWidth / img.clientWidth
          const sy = src.naturalHeight / img.clientHeight
          for (const a of bugReportArrows.value) _drawArrow(ctx, a.fx * sx, a.fy * sy, a.tx * sx, a.ty * sy)
        }
        finalScreenshot = out.toDataURL('image/jpeg', 0.8)
      }

      const pmState = {
        flowSlug: activeScenario.value?.startFlow || '',
        scenarioId: activeScenario.value?.id || '',
        currentStateId: (currentState.value as any)?.id || '',
        variables: (vars as any)?.value || {},
        flags: (flags as any)?.value || {},
        flightContext: (flightContext as any)?.value || {},
        communicationLog: ((log as any)?.value || [] as any[]).slice(-20),
      }

      await api.post('/api/bug-reports', {
        comment: bugReportComment.value.trim(),
        contact: bugReportContact.value.trim(),
        screenshot: finalScreenshot,
        pmState,
      })

      bugReportSuccess.value = true
      setTimeout(() => { showBugReportDialog.value = false; bugReportSuccess.value = false }, 2500)
    } catch (err: any) {
      bugReportError.value = err?.data?.statusMessage || err?.message || 'Fehler beim Senden.'
    } finally {
      bugReportLoading.value = false
    }
  }

  return {
    showBugReportDialog,
    bugReportComment,
    bugReportContact,
    bugReportScreenshot,
    bugReportArrows,
    bugReportLoading,
    bugReportCapturing,
    bugReportError,
    bugReportSuccess,
    bugReportCanvasRef,
    bugReportImgRef,
    setupAnnotationCanvas,
    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
    onCanvasMouseLeave,
    undoLastArrow,
    openBugReport,
    submitBugReport,
  }
}
