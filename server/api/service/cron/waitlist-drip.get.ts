import { defineEventHandler } from 'h3'
import { InvitationCode } from '../../../models/InvitationCode'
import { WaitlistEntry } from '../../../models/WaitlistEntry'
import { sendMail } from '../../../utils/notifications'
import { generateInvitationCode, renderInvitationEmail, renderInvitationText } from '../../../utils/invitations'

const DAY_MS = 1000 * 60 * 60 * 24
const INVITATION_DELAY_DAYS = 5
const FEEDBACK_DELAY_DAYS = 14

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
      entry.invitationCode = invitation._id
    }

    entry.invitationSentAt = sentAt
    await entry.save()

    const html = await renderInvitationEmail(invitation.code)
    const text = renderInvitationText(invitation.code)

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

    const text = [
      'Hi there,',
      '',
      "It's been a little while since we sent your invite, and we would love to hear your thoughts.",
      '',
      'Share your feedback here:',
      'https://opensquawk.de/feedback',
      '',
      'Thank you for helping us improve OpenSquawk!',
    ].join('\n')

    const html = [
      '<p>Hi there,</p>',
      '<p>It\'s been a little while since we sent your invite, and we would love to hear your thoughts.</p>',
      '<p><a href="https://opensquawk.de/feedback">Share your feedback here</a></p>',
      '<p>Thank you for helping us improve OpenSquawk!</p>',
    ].join('')

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

  return {
    invitationsSent,
    feedbackRequests,
  }
})
