const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

export interface PasswordValidationResult {
  valid: boolean
  message?: string
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const trimmed = password.trim()
  if (trimmed.length < 10) {
    return { valid: false, message: 'Password must be at least 10 characters long.' }
  }
  if (/\s/.test(trimmed)) {
    return { valid: false, message: 'Password cannot contain spaces.' }
  }
  if (!/[A-Za-zÄÖÜäöüß]/.test(trimmed) || !/[0-9]/.test(trimmed)) {
    return { valid: false, message: 'Please use both letters and numbers.' }
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmed)) {
    return { valid: false, message: 'Include at least one special character for better security.' }
  }
  return { valid: true }
}
