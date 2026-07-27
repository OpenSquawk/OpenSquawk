import { defineEventHandler, readBody, createError } from 'h3'
import { randomUUID } from 'node:crypto'
import { requireUserSession } from '../../utils/auth'
import { BugReport, type BugReportSource } from '../../models/BugReport'
import { sendMail } from '../../utils/notifications'
import { emit as emitTelemetry } from '../../utils/telemetry'

const SOURCE_LABELS: Record<BugReportSource, string> = {
  'live-atc': 'Live ATC',
  classroom: 'Classroom',
}

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const body = await readBody(event)

  const comment = String(body?.comment ?? '').trim()
  if (!comment) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlerbeschreibung ist erforderlich' })
  }

  const contact = String(
    body?.contact || [user.name, user.email].filter(Boolean).join(' — ')
  ).slice(0, 200)

  const source: BugReportSource = body?.source === 'classroom' ? 'classroom' : 'live-atc'
  // The code is what ties a report to the commit that fixes it — it goes into
  // the mail so it can be pasted straight into the commit message.
  const code = randomUUID()

  // Local DB first — this instance's own data. The mirror is what makes the
  // report show up in the hosted admin view; the write path does not depend on
  // it, and a self-hosted instance keeps its reports to itself.
  const report = await BugReport.create({
    code,
    source,
    comment: comment.slice(0, 4000),
    contact,
    userId: user._id,
    screenshot: body?.screenshot || undefined,
    pmState: body?.pmState || undefined,
  })

  emitTelemetry('bug-report', {
    code,
    source,
    comment: comment.slice(0, 4000),
    contact,
    userId: String(user._id),
    screenshot: body?.screenshot || undefined,
    pmState: body?.pmState || undefined,
    createdAt: report.createdAt,
  })

  // Opt-in and unset by default: a foreign instance must not mail its users'
  // bug reports to us. The hosted service sets BUG_REPORT_NOTIFY_EMAIL; a
  // self-hosted one keeps its reports in its own database and nowhere else.
  const notifyEmail = (process.env.BUG_REPORT_NOTIFY_EMAIL || '').trim()
  if (!notifyEmail) {
    return { success: true, id: String(report._id), code }
  }

  const sourceLabel = SOURCE_LABELS[source]
  const stateInfo = body?.pmState?.currentStateId
    ? `State: ${body.pmState.currentStateId} (Flow: ${body.pmState.flowSlug || '—'})`
    : ''

  await sendMail({
    to: notifyEmail,
    subject: `[OpenSquawk Bug · ${sourceLabel}] ${contact}`,
    html: `<h2>Neuer Bug Report</h2>
<p><strong>Bereich:</strong> ${sourceLabel}</p>
<p><strong>Von:</strong> ${contact}</p>
<p><strong>Fehlerbeschreibung/Featurewunsch:</strong><br>${comment.replace(/\n/g, '<br>')}</p>
<p><strong>Nenne den Fehlercode ${code} beim Commit.</strong></p>
${stateInfo ? `<p><strong>${stateInfo}</strong></p>` : ''}
`,
    text: `Bug Report von ${contact}
Bereich: ${sourceLabel}

Fehlerbeschreibung/Featurewunsch:
${comment}

Nenne den Fehlercode ${code} beim Commit.
${stateInfo}
`,
  }).catch(() => {})

  return { success: true, id: String(report._id), code }
})
