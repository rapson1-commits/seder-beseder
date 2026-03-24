// Reusable form validators — each returns an error string or null (= valid).

export function required(value: string, label: string): string | null {
  return value.trim() ? null : `${label} הוא שדה חובה`
}

export function maxLength(value: string, max: number, label: string): string | null {
  return value.length <= max ? null : `${label} חייב להיות עד ${max} תווים`
}

export function minLength(value: string, min: number, label: string): string | null {
  return value.trim().length >= min ? null : `${label} חייב להכיל לפחות ${min} תווים`
}

/** Israeli phone: 9–10 digits, allowing spaces/dashes */
export function phone(value: string): string | null {
  if (!value.trim()) return null // optional field
  const digits = value.replace(/[\s\-]/g, '')
  if (!/^\d{9,10}$/.test(digits)) return 'מספר טלפון לא תקין (9–10 ספרות)'
  return null
}

/** Invite code: 4–10 uppercase alphanumeric characters */
export function inviteCode(value: string): string | null {
  if (!value.trim()) return 'הכנס קוד הזמנה'
  if (!/^[A-Z0-9]{4,10}$/.test(value.toUpperCase().replace(/\s/g, ''))) {
    return 'קוד הזמנה חייב להכיל 4–10 אותיות אנגליות/ספרות'
  }
  return null
}

/** Family name: 2–50 chars, Hebrew/Latin/spaces */
export function familyName(value: string): string | null {
  const v = value.trim()
  if (!v) return 'הכנס שם משפחה'
  if (v.length < 2) return 'שם המשפחה חייב להכיל לפחות 2 תווים'
  if (v.length > 50) return 'שם המשפחה חייב להיות עד 50 תווים'
  return null
}

/** Year: reasonable range */
export function eventYear(value: number): string | null {
  if (value < 2000 || value > 2100) return 'שנה לא תקינה'
  return null
}

/** Run all validators; return first error found, or null */
export function firstError(...results: (string | null)[]): string | null {
  return results.find(r => r !== null) ?? null
}

/** Run all validators; return a map of field → error for inline display */
export type ValidationErrors<T extends string> = Partial<Record<T, string>>

export function validate<T extends string>(
  rules: Array<[T, string | null]>
): ValidationErrors<T> {
  const errors: ValidationErrors<T> = {}
  for (const [field, error] of rules) {
    if (error) errors[field] = error
  }
  return errors
}
