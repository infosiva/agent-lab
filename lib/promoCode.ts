// Promo / trial codes. Env PROMO_CODES='[{"code":"TRIAL7","daysUnlocked":7}]'. Empty by default (no hardcoded codes).
export type PromoEntry = { code: string; daysUnlocked: number }
export function getPromoCodes(): PromoEntry[] {
  try { return JSON.parse(process.env.PROMO_CODES || '[]') } catch { return [] }
}
export function validatePromoCode(input: string): PromoEntry | null {
  const c = (input || '').trim().toUpperCase()
  return getPromoCodes().find(p => p.code.toUpperCase() === c) ?? null
}
