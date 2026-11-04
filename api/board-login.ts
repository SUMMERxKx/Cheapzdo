import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleBoardLogin } from '../server/board-login.js';

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  await handleBoardLogin(request, response);
}
