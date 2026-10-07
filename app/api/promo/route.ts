import { NextResponse } from 'next/server'
import { validatePromoCode } from '@/lib/promoCode'

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({ code: '' }))
  const entry = validatePromoCode(String(code ?? ''))
  if (!entry) return NextResponse.json({ valid: false }, { status: 400 })
  const res = NextResponse.json({ valid: true, daysUnlocked: entry.daysUnlocked })
  res.cookies.set('promo_unlocked', String(entry.daysUnlocked), { maxAge: entry.daysUnlocked * 86400, httpOnly: false, sameSite: 'lax', path: '/' })
  return res
}
