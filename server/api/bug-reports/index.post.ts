import { defineEventHandler, readBody, createError } from 'h3'
import { randomUUID } from 'node:crypto'
import { requireUserSession } from '../../utils/auth'
import { BugReport, type BugReportSource } from '../../models/BugReport'
import { sendMail } from '../../utils/notifications'

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

  const report = await BugReport.create({
    code,
    source,
    comment: comment.slice(0, 4000),
    contact,
    userId: user._id,
    screenshot: body?.screenshot || undefined,
    pmState: body?.pmState || undefined,
  })

  const adminUrl = `${process.env.APP_URL || 'https://app.opensquawk.de'}/admin`
  const sourceLabel = SOURCE_LABELS[source]
  const stateInfo = body?.pmState?.currentStateId
    ? `State: ${body.pmState.currentStateId} (Flow: ${body.pmState.flowSlug || '—'})`
    : ''

  await sendMail({
    to: 'emanuel@faktorxmensch.com',
    subject: `[OpenSquawk Bug · ${sourceLabel}] ${contact}`,
    html: `<h2>Neuer Bug Report</h2>
<p><strong>Bereich:</strong> ${sourceLabel}</p>
<p><strong>Von:</strong> ${contact}</p>
<p><strong>Fehlerbeschreibung/Featurewunsch:</strong><br>${comment.replace(/\n/g, '<br>')}</p>
<p><strong>Nenne den Fehlercode ${code} beim Commit.</strong></p>
${stateInfo ? `<p><strong>${stateInfo}</strong></p>` : ''}
<p><a href="${adminUrl}">Im Admin-Panel ansehen →</a></p>`,
    text: `Bug Report von ${contact}
Bereich: ${sourceLabel}

Fehlerbeschreibung/Featurewunsch:
${comment}

Nenne den Fehlercode ${code} beim Commit.
${stateInfo}

Admin: ${adminUrl}`,
  }).catch(() => {})

  return { success: true, id: String(report._id), code }
})
