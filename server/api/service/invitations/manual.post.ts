import { createHmac, timingSafeEqual } from 'node:crypto'
import { createError, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { InvitationCode } from '../../../models/InvitationCode'
import { generateInvitationCode } from '../../../utils/invitations'

interface ManualInviteRequestBody {
  password?: string
  label?: string
}

interface ManualInviteResponse {
  success: true
  code: string
  expiresAt: string
  label: string | null
}

function safeComparePassword(provided: string, expected: string) {
  const key = 'opensquawk-manual-invite'
  const providedDigest = createHmac('sha256', key).update(provided).digest()
  const expectedDigest = createHmac('sha256', key).update(expected).digest()
  return timingSafeEqual(providedDigest, expectedDigest)
}

export default defineEventHandler<ManualInviteResponse>(async (event) => {
  const config = useRuntimeConfig()
  const expectedPassword = (config.manualInvitePassword as string | undefined)?.trim() || ''

  if (!expectedPassword) {
    throw createError({ statusCode: 500, statusMessage: 'Manual invitation code configuration missing' })
  }

  const body = await readBody<ManualInviteRequestBody>(event).catch(() => ({}) as ManualInviteRequestBody)
  const providedPassword = body.password?.trim() || ''

  if (!providedPassword || !safeComparePassword(providedPassword, expectedPassword)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }

  const now = new Date()
  const code = generateInvitationCode()
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)
  const label = body.label?.trim() || undefined

  await InvitationCode.create({
    code,
    createdAt: now,
    expiresAt,
    channel: 'manual',
    label,
  })

  return {
    success: true,
    code,
    expiresAt: expiresAt.toISOString(),
    label: label ?? null,
  }
})
