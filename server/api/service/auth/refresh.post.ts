import { rotateRefreshToken } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const tokens = await rotateRefreshToken(event)
  return {
    success: true,
    accessToken: tokens.accessToken,
  }
})

