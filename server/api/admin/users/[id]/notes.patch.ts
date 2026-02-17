import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import { User } from '../../../../models/User'

interface UpdateNotesBody {
  notes?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const params = event.context.params as { id?: string }
  const userId = params?.id

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user ID' })
  }

  const body = await readBody<UpdateNotesBody>(event).catch(() => ({}) as UpdateNotesBody)
  const rawNotes = typeof body.notes === 'string' ? body.notes.replace(/\r\n/g, '\n') : ''
  const notes = rawNotes.trim()

  if (notes.length > 2000) {
    throw createError({ statusCode: 400, statusMessage: 'Notes are too long (max 2000 characters).' })
  }

  const user = await User.findById(userId)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  user.adminNotes = notes
  await user.save()

  return {
    success: true,
    notes: user.adminNotes || '',
  }
})
