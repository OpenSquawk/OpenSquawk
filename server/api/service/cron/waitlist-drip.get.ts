import mongoose from 'mongoose'
import { defineEventHandler } from 'h3'
import { InvitationCode } from '../../../models/InvitationCode'
import { KpiReportDelivery } from '../../../models/KpiReportDelivery'
import { WaitlistEntry } from '../../../models/WaitlistEntry'
import { sendMail } from '../../../utils/notifications'
import {
  generateInvitationCode,
  renderFeedbackEmail,
  renderFeedbackText,
  renderInvitationEmail,
  renderInvitationText,
} from '../../../utils/invitations'
import { buildWeeklyKpiReport, renderWeeklyKpiEmail, renderWeeklyKpiText } from '../../../utils/kpiReport'

const DAY_MS = 1000 * 60 * 60 * 24
const INVITATION_DELAY_DAYS = 5
const FEEDBACK_DELAY_DAYS = 14
const KPI_RECIPIENT = 'opensquawk-kpi@faktorxmensch.com'
const KPI_TIME_ZONE = 'Europe/Berlin'
const KPI_SEND_AFTER_HOUR = 9

function getBerlinDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KPI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0)
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
  }
}

function getWeeklyKpiSchedule(now: Date) {
  const local = getBerlinDateParts(now)
  const localDay = new Date(Date.UTC(local.year, local.month - 1, local.day))
  const dayOfWeek = localDay.getUTCDay() || 7
  const monday = new Date(localDay.getTime() - (dayOfWeek - 1) * DAY_MS)
  const previousMonday = new Date(monday.getTime() - 7 * DAY_MS)
  const canSend = dayOfWeek > 1 || local.hour >= KPI_SEND_AFTER_HOUR
  const periodStart = previousMonday
  const periodEnd = monday
  const weekKey = periodEnd.toISOString().slice(0, 10)

  return { canSend, weekKey, periodStart, periodEnd }
}

async function sendWeeklyKpiReportIfDue(now: Date) {
  const schedule = getWeeklyKpiSchedule(now)
  if (!schedule.canSend) {
    return { sent: false, skipped: 'before-weekly-window' }
  }

  const alreadySent = await KpiReportDelivery.exists({ weekKey: schedule.weekKey })
  if (alreadySent) {
    return { sent: false, skipped: 'already-sent' }
  }

  const report = await buildWeeklyKpiReport(schedule.periodEnd)
  const subject = `OpenSquawk KPI Report ${report.periodStart.slice(0, 10)} - ${report.periodEnd.slice(0, 10)}`
  const mailAccepted = await sendMail({
    to: KPI_RECIPIENT,
    subject,
    text: renderWeeklyKpiText(report),
    html: renderWeeklyKpiEmail(report),
  })

  await KpiReportDelivery.create({
    weekKey: schedule.weekKey,
    periodStart: new Date(report.periodStart),
    periodEnd: new Date(report.periodEnd),
    recipient: KPI_RECIPIENT,
    sentAt: now,
    mailAccepted,
  })

  return {
    sent: true,
    mailAccepted,
    recipient: KPI_RECIPIENT,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
  }
}

export default defineEventHandler(async () => {
  const now = new Date()
  const invitationCutoff = new Date(now.getTime() - INVITATION_DELAY_DAYS * DAY_MS)
  const feedbackCutoff = new Date(now.getTime() - FEEDBACK_DELAY_DAYS * DAY_MS)

  const invitationCandidates = await WaitlistEntry.find({
    joinedAt: { $lte: invitationCutoff },
    $and: [
      { $or: [{ invitationSentAt: { $exists: false } }, { invitationSentAt: null }] },
      { $or: [{ activatedAt: { $exists: false } }, { activatedAt: null }] },
    ],
  }).exec()

  let invitationsSent = 0

  for (const entry of invitationCandidates) {
    const email = entry.email?.trim()
    if (!email) {
      continue
    }

    let invitation = entry.invitationCode ? await InvitationCode.findById(entry.invitationCode) : null

    if (invitation?.usedAt) {
      continue
    }

    const sentAt = new Date()
    if (!invitation) {
      const code = generateInvitationCode()
      invitation = await InvitationCode.create({
        code,
        createdAt: sentAt,
        channel: 'admin',
        label: `Waitlist: ${email}`,
      })
      entry.invitationCode = invitation._id as mongoose.Types.ObjectId
    }

    entry.invitationSentAt = sentAt
    await entry.save()

    const html = await renderInvitationEmail(invitation.code, email)
    const text = renderInvitationText(invitation.code, email)

    await sendMail({
      to: email,
      subject: 'Your OpenSquawk invite code',
      text,
      html,
    })

    invitationsSent += 1
  }

  const feedbackCandidates = await WaitlistEntry.find({
    invitationSentAt: { $lte: feedbackCutoff },
    $or: [
      { feedbackRequestedAt: { $exists: false } },
      { feedbackRequestedAt: null },
    ],
  }).exec()

  let feedbackRequests = 0

  for (const entry of feedbackCandidates) {
    const email = entry.email?.trim()
    if (!email) {
      continue
    }

    const requestedAt = new Date()

    const text = renderFeedbackText(email)
    const html = await renderFeedbackEmail(email)

    await sendMail({
      to: email,
      subject: 'How is your OpenSquawk experience?',
      text,
      html,
    })

    entry.feedbackRequestedAt = requestedAt
    await entry.save()

    feedbackRequests += 1
  }

  console.log(`[waitlist-drip] invitations sent: ${invitationsSent}`)
  console.log(`[waitlist-drip] feedback requests sent: ${feedbackRequests}`)

  const kpiReport = await sendWeeklyKpiReportIfDue(now)
  console.log(`[waitlist-drip] weekly KPI report: ${kpiReport.sent ? 'sent' : `skipped (${kpiReport.skipped})`}`)

  return {
    invitationsSent,
    feedbackRequests,
    kpiReport,
  }
})
