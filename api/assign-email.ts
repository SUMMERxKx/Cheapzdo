import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleAssignEmail } from '../server/assign-email.js'

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  await handleAssignEmail(request, response)
}
