import { defineEventHandler, readBody, createError } from 'h3'
import { requireUserSession } from '../../utils/auth'
import { BugReport } from '../../models/BugReport'
import { sendMail } from '../../utils/notifications'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const body = await readBody(event)

  const comment = String(body?.comment ?? '').trim()
  if (!comment) {
    throw createError({ statusCode: 400, statusMessage: 'Kommentar ist erforderlich' })
  }

  const contact = String(
    body?.contact || [user.name, user.email].filter(Boolean).join(' — ')
  ).slice(0, 200)

  const report = await BugReport.create({
    comment: comment.slice(0, 4000),
    contact,
    userId: user._id,
    screenshot: body?.screenshot || undefined,
    pmState: body?.pmState || undefined,
  })

  const adminUrl = `${process.env.APP_URL || 'https://app.opensquawk.de'}/admin`
  const stateInfo = body?.pmState?.currentStateId
    ? `State: ${body.pmState.currentStateId} (Flow: ${body.pmState.flowSlug || '—'})`
    : ''

  await sendMail({
    to: 'emanuel@faktorxmensch.com',
    subject: `[OpenSquawk Bug] ${contact}`,
    html: `<h2>Neuer Bug Report</h2>
<p><strong>Von:</strong> ${contact}</p>
<p><strong>Kommentar:</strong><br>${comment.replace(/\n/g, '<br>')}</p>
${stateInfo ? `<p><strong>${stateInfo}</strong></p>` : ''}
<p><a href="${adminUrl}">Im Admin-Panel ansehen →</a></p>`,
    text: `Bug Report von ${contact}\n\n${comment}\n${stateInfo}\n\nAdmin: ${adminUrl}`,
  }).catch(() => {})

  return { success: true, id: String(report._id) }
})
