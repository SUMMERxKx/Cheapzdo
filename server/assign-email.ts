import type { IncomingMessage, ServerResponse } from 'node:http'
import { hasBoardSession } from './board-session.ts'

type Options = { password?: string, apiKey?: string, from?: string, send?: typeof fetch }
const recent = new Map<string, number>()

export async function handleAssignEmail(request: IncomingMessage & { body?: unknown }, response: ServerResponse, options: Options = {}) {
  const reply = (status: number, body: object) => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    response.end(JSON.stringify(body))
  }
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' })
  if (!hasBoardSession(request, options.password ?? process.env.BOARD_PASSWORD)) return reply(401, { error: 'Board login required' })
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') return reply(415, { error: 'Expected JSON' })
  try {
    let body = request.body
    if (body === undefined) {
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of request) {
        size += Buffer.byteLength(chunk)
        if (size > 16384) return reply(413, { error: 'Request too large' })
        chunks.push(Buffer.from(chunk))
      }
      body = Buffer.concat(chunks).toString()
    }
    if (Buffer.byteLength(JSON.stringify(body)) > 16384) return reply(413, { error: 'Request too large' })
    if (typeof body === 'string') body = JSON.parse(body)
    if (!body || typeof body !== 'object') return reply(400, { error: 'Invalid task' })
    const data = body as Record<string, unknown>
    const limits = { taskId: 200, eventId: 200, to: 254, title: 500, board: 200, priority: 20, description: 10000, appUrl: 2000 }
    for (const [key, limit] of Object.entries(limits)) {
      if (typeof data[key] !== 'string' || (data[key] as string).length > limit || (key !== 'description' && !(data[key] as string).trim())) return reply(400, { error: 'Invalid task' })
    }
    const { taskId, eventId, to, title, board, priority, description, appUrl } = data as Record<string, string>
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !['Critical', 'High', 'Medium', 'Low'].includes(priority)) return reply(400, { error: 'Invalid task' })
    const url = new URL(appUrl)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return reply(400, { error: 'Invalid app link' })
    const apiKey = options.apiKey ?? process.env.RESEND_API_KEY
    const from = options.from ?? process.env.RESEND_FROM
    if (!apiKey?.trim() || !from?.trim()) return reply(200, { status: 'not_configured' })
    const now = Date.now()
    for (const [key, time] of recent) if (now - time > 60000) recent.delete(key)
    const guard = `${taskId}:${to}`
    if (recent.has(guard)) return reply(429, { error: 'Assignment email recently sent' })
    if (recent.size >= 30) return reply(429, { error: 'Please try again shortly' })
    recent.set(guard, now)
    const result = await (options.send ?? fetch)('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `assign-${eventId}` },
      body: JSON.stringify({ from, to: [to], subject: `Assigned: ${title.replace(/[\r\n]/g, ' ')}`, text: `${title}\nBoard: ${board}\nPriority: ${priority}\n\n${description}\n\nOpen Cheapzdo: ${url.href}` }),
      signal: AbortSignal.timeout(10000),
    })
    if (!result.ok) return reply(502, { error: 'Email could not be sent' })
    return reply(200, { status: 'sent' })
  } catch {
    return reply(400, { error: 'Email request could not be completed' })
  }
}
