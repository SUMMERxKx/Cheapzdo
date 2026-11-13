import { createHmac, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage } from 'node:http'

const lifetime = 8 * 60 * 60
const signature = (value: string, password: string) => createHmac('sha256', password).update(`board-session:${value}`).digest('hex')

export function sessionCookie(password: string, secure = true) {
  const expires = String(Math.floor(Date.now() / 1000) + lifetime)
  return `board_session=${expires}.${signature(expires, password)}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${lifetime}${secure ? '; Secure' : ''}`
}

export function hasBoardSession(request: IncomingMessage, password = process.env.BOARD_PASSWORD) {
  if (!password?.trim()) return false
  const token = request.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('board_session='))?.slice(14)
  if (!token) return false
  const [expires, supplied] = token.split('.')
  const now = Math.floor(Date.now() / 1000)
  if (!/^\d+$/.test(expires) || Number(expires) <= now || Number(expires) > now + lifetime || !/^[a-f0-9]{64}$/.test(supplied || '')) return false
  return timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(signature(expires, password), 'hex'))
}
