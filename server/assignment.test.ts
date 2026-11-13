import assert from 'node:assert/strict'
import { test } from 'node:test'
import { shouldPingAssignment } from '../src/lib/assignment.ts'

test('pings only new assignments and reassignments with the option enabled', () => {
  assert.equal(shouldPingAssignment({ assigneeId: 'alex', pingOnAssign: true }), true)
  assert.equal(shouldPingAssignment({ assigneeId: 'alex', pingOnAssign: true }, { assigneeId: 'sam' }), true)
  assert.equal(shouldPingAssignment({ assigneeId: 'alex', pingOnAssign: true }, { assigneeId: 'alex' }), false)
  assert.equal(shouldPingAssignment({ assigneeId: undefined, pingOnAssign: true }, { assigneeId: 'alex' }), false)
  assert.equal(shouldPingAssignment({ assigneeId: 'alex', pingOnAssign: false }), false)
  assert.equal(shouldPingAssignment({ assigneeId: 'alex' }), false)
})
