import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { test } from 'node:test'
import { handleAssignEmail } from './assign-email.ts'
import { sessionCookie } from './board-session.ts'

const password = 'test-only-board-password'
const task = { taskId: 'task-1', eventId: 'event-1', to: 'person@example.com', title: 'Review launch', board: 'Daily', priority: 'High', description: 'Check the launch list', appUrl: 'https://cheapzdo.example/' }

async function withServer(check: (url: string, sent: { url: string, init: RequestInit }[]) => Promise<void>, configured = true, parsedBody?: unknown) {
  const sent: { url: string, init: RequestInit }[] = []
  const server = createServer((request, response) => {
    if (parsedBody !== undefined) Object.assign(request, { body: parsedBody })
    void handleAssignEmail(request, response, { password, apiKey: configured ? 'test-only-key' : '', from: configured ? 'Board <board@example.com>' : '',
      send: (async (url, init) => {
        sent.push({ url: String(url), init: init! })
        return new Response(JSON.stringify({ id: 'mock-message' }), { status: 200 })
      }) as typeof fetch,
    })
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  try { await check(`http://127.0.0.1:${(server.address() as AddressInfo).port}`, sent) }
  finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
}

const post = (url: string, body: unknown = task, cookie = sessionCookie(password, false)) => fetch(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(body),
})

test('requires a signed, unexpired board login before sending or reporting configuration', async () => {
  await withServer(async (url, sent) => {
    for (const cookie of ['', sessionCookie('wrong-password'), 'board_session=1.' + 'a'.repeat(64)]) {
      assert.equal((await post(url, task, cookie)).status, 401)
    }
    assert.equal(sent.length, 0)
  }, false)
})

test('missing Resend configuration returns a quiet status without sending', async () => {
  await withServer(async (url, sent) => {
    const response = await post(url)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'not_configured' })
    assert.equal(sent.length, 0)
  }, false)
})

test('validates payload, content type, body size and method', async () => {
  await withServer(async (url, sent) => {
    for (const body of [null, [], {}, { ...task, to: 'invalid' }, { ...task, priority: 'Urgent' }, { ...task, appUrl: 'javascript:alert(1)' }, { ...task, description: 10 }]) {
      assert.equal((await post(url, body)).status, 400)
    }
    assert.equal((await post(url, { ...task, description: 'x'.repeat(17000) })).status, 413)
    assert.equal((await fetch(url, { method: 'POST', headers: { Cookie: sessionCookie(password) }, body: '{}' })).status, 415)
    assert.equal((await fetch(url)).status, 405)
    assert.equal((await fetch(url, { method: 'POST', headers: { Cookie: sessionCookie(password), 'Content-Type': 'application/json' }, body: '{' })).status, 400)
    assert.equal(sent.length, 0)
  })
})

test('sends the expected Resend payload and prevents repeat emails', async () => {
  await withServer(async (url, sent) => {
    const response = await post(url)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'sent' })
    assert.equal(sent.length, 1)
    assert.equal(sent[0].url, 'https://api.resend.com/emails')
    const payload = JSON.parse(String(sent[0].init.body))
    assert.deepEqual(payload.to, [task.to])
    for (const text of [task.title, task.board, task.priority, task.description, task.appUrl]) assert.ok(payload.text.includes(text))
    assert.equal((sent[0].init.headers as Record<string, string>)['Idempotency-Key'], 'assign-event-1')
    assert.equal((await post(url)).status, 429)
    assert.equal(sent.length, 1)
  })
})

test('supports a Vercel parsed JSON body', async () => {
  await withServer(async (url, sent) => {
    assert.equal((await post(url)).status, 200)
    assert.equal(sent.length, 1)
  }, true, { ...task, taskId: 'parsed-body-task', eventId: 'parsed-body-event' })
})
