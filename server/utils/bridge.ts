export function normalizeBridgeToken(input: unknown) {
  if (typeof input !== 'string') {
    return null
  }
  const token = input.trim()
  if (!token) {
    return null
  }
  if (token.length < 8 || token.length > 256) {
    return null
  }
  return token
}

