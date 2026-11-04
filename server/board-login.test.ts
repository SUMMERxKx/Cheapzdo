import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { handleBoardLogin } from './board-login.ts';

const PASSWORD = 'test-only-秘密-password';

async function withServer(password: string, check: (url: string) => Promise<void>, parsedBody?: unknown) {
  const server = createServer((request, response) => {
    if (parsedBody !== undefined) Object.assign(request, { body: parsedBody });
    void handleBoardLogin(request, response, password);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await check(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/board-login`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

function login(url: string, password: unknown) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

test('accepts the correct password without returning it or caching the response', async () => {
  await withServer(PASSWORD, async url => {
    const response = await login(url, PASSWORD);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { ok: true });
  });
});

test('rejects wrong passwords including equal-length values', async () => {
  await withServer(PASSWORD, async url => {
    for (const password of ['incorrect', 'test-only-秘密-passw0rd']) {
      const response = await login(url, password);
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { ok: false });
    }
  });
});

test('fails closed when the server password is empty or blank', async () => {
  for (const password of ['', '   ']) {
    await withServer(password, async url => {
      const response = await login(url, '');
      assert.equal(response.status, 503);
      assert.equal((await response.text()).includes('BOARD_PASSWORD'), false);
    });
  }
});

test('rejects GET, malformed JSON, invalid password types, and oversized input', async () => {
  await withServer(PASSWORD, async url => {
    const get = await fetch(url);
    assert.equal(get.status, 405);
    assert.equal(get.headers.get('allow'), 'POST');
    const malformed = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(malformed.status, 400);
    const wrongType = await fetch(url, { method: 'POST', body: PASSWORD });
    assert.equal(wrongType.status, 415);
    for (const password of ['', null, 42, {}, []]) {
      assert.equal((await login(url, password)).status, 400);
    }
    assert.equal((await login(url, 'x'.repeat(9000))).status, 413);
  });
});

test('supports the JSON body already parsed by Vercel', async () => {
  await withServer(PASSWORD, async url => {
    assert.equal((await login(url, PASSWORD)).status, 200);
  }, { password: PASSWORD });
});
