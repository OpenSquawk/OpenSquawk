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
    return { valid: false, message: 'Passwort muss mindestens 10 Zeichen lang sein.' }
  }
  if (/\s/.test(trimmed)) {
    return { valid: false, message: 'Passwort darf keine Leerzeichen enthalten.' }
  }
  if (!/[A-Za-zÄÖÜäöüß]/.test(trimmed) || !/[0-9]/.test(trimmed)) {
    return { valid: false, message: 'Bitte Buchstaben und Zahlen kombinieren.' }
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmed)) {
    return { valid: false, message: 'Mindestens ein Sonderzeichen erhöht die Sicherheit.' }
  }
  return { valid: true }
}
