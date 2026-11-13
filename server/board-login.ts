import { sessionCookie } from './board-session.ts'
import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

type LoginRequest = IncomingMessage & { body?: unknown };
const MAX_BODY_BYTES = 8192;

function respond(response: ServerResponse, status: number, body: object) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

export async function handleBoardLogin(
  request: LoginRequest,
  response: ServerResponse,
  boardPassword: string | undefined = process.env.BOARD_PASSWORD,
) {
  if (request.method === 'DELETE') {
    response.setHeader('Set-Cookie', 'board_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0')
    return respond(response, 200, { ok: true })
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return respond(response, 405, { error: 'Method not allowed.' });
  }

  if (!boardPassword?.trim()) {
    return respond(response, 503, { error: 'The board is temporarily unavailable. Please try again later.' });
  }

  const contentType = request.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return respond(response, 415, { error: 'Expected a JSON request.' });
  }

  if (Number(request.headers['content-length']) > MAX_BODY_BYTES) {
    return respond(response, 413, { error: 'Request is too large.' });
  }

  try {
    // Vercel parses JSON bodies. Vite's local middleware provides a raw stream.
    let body = request.body;
    if (body === undefined) {
      const chunks: Buffer[] = [];
      let length = 0;
      for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        length += buffer.length;
        if (length <= MAX_BODY_BYTES) chunks.push(buffer);
      }
      if (length > MAX_BODY_BYTES) {
        return respond(response, 413, { error: 'Request is too large.' });
      }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } else if (typeof body === 'string') {
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        return respond(response, 413, { error: 'Request is too large.' });
      }
      body = JSON.parse(body);
    }

    if (!body || typeof body !== 'object' || !('password' in body) || typeof body.password !== 'string' || !body.password || Buffer.byteLength(body.password) > MAX_BODY_BYTES) {
      return respond(response, 400, { error: 'Enter a valid password.' });
    }

    const supplied = createHash('sha256').update(body.password).digest();
    const expected = createHash('sha256').update(boardPassword).digest();
    if (!timingSafeEqual(supplied, expected)) {
      return respond(response, 401, { ok: false });
    }

    response.setHeader('Set-Cookie', sessionCookie(boardPassword, request.headers['x-forwarded-proto'] === 'https' || process.env.VERCEL === '1'))
    return respond(response, 200, { ok: true });
  } catch {
    return respond(response, 400, { error: 'Invalid request.' });
  }
}
