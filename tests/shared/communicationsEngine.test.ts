import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import useCommunicationsEngine, { normalizeATCText } from '~~/shared/utils/communicationsEngine'
import type { RuntimeDecisionSystem, RuntimeDecisionTree } from '~~/shared/types/decision'

// Minimal single-flow system. The start state REQ is a pilot state with NO
// transitions, so the engine's auto-advance leaves the cursor on it after load
// (otherwise evaluateSimpleAutoFlow would schedule a move). ACK/DONE are only
// reached via explicit moveToSilent() calls — mirroring the real setup where
// the Python backend drives state and the engine only syncs the local cursor.
function buildSystem(): RuntimeDecisionSystem {
  const clearance: RuntimeDecisionTree = {
    slug: 'clearance',
    schema_version: '2.0',
    name: 'Clearance',
    description: 'test flow',
    start_state: 'REQ',
    end_states: ['DONE'],
    variables: {
      // VariableDefinition form (as the Python backend serializes it) — must be
      // unwrapped to its `initial` value by the engine.
      callsign: { name: 'callsign', type: 'string', initial: 'DLH123', mutable_by: 'action_only' },
      // raw form — must pass through untouched.
      runway: '25R',
    } as Record<string, any>,
    flags: {
      gates_clear: { name: 'gates_clear', initial: true },
    } as Record<string, any>,
    policies: {},
    hooks: {},
    roles: ['pilot', 'atc', 'system'],
    phases: ['clearance'],
    states: {
      REQ: {
        role: 'pilot',
        phase: 'clearance',
        name: 'Request clearance',
        expected_pilot_template: '{{callsign}} ready for clearance',
      },
      ACK: {
        role: 'atc',
        phase: 'clearance',
        name: 'Controller clearance',
        say_template: '{{callsign}}, cleared to {{runway}}',
        actions: [{ set: 'variables.cleared', to: true }],
      },
      DONE: { role: 'system', phase: 'clearance', name: 'Complete' },
    },
  }

  return { main: 'clearance', order: ['clearance'], flows: { clearance } }
}

describe('communicationsEngine — load & init', () => {
  it('loads a system, becomes ready, and starts on the flow start state', () => {
    const engine = useCommunicationsEngine()
    engine.loadRuntimeSystem(buildSystem())

    assert.equal(engine.isReady.value, true)
    assert.equal(engine.activeFlow.value, 'clearance')
    assert.equal(engine.currentState.value?.id, 'REQ')
    assert.equal(engine.currentState.value?.role, 'pilot')
  })

  it('unwraps VariableDefinition objects to their initial value and keeps raw values', () => {
    const engine = useCommunicationsEngine()
    engine.loadRuntimeSystem(buildSystem())

    // { initial: 'DLH123' } -> 'DLH123'; raw '25R' stays '25R'
    assert.equal(engine.variables.value.callsign, 'DLH123')
    assert.equal(engine.variables.value.runway, '25R')
    // flag definition { initial: true } -> true
    assert.equal((engine.flags.value as Record<string, any>).gates_clear, true)
  })
})

describe('communicationsEngine — template rendering', () => {
  it('renders both {{double}} and {single} brace variables (dual schema)', () => {
    const engine = useCommunicationsEngine()
    engine.loadRuntimeSystem(buildSystem())

    assert.equal(
      engine.renderATCMessage('{{callsign}} cleared to {runway}'),
      'DLH123 cleared to 25R',
    )
  })

  it('reflects patched variables in subsequent renders', () => {
    const engine = useCommunicationsEngine()
    engine.loadRuntimeSystem(buildSystem())

    engine.patchVariables({ runway: '07L' })
    assert.equal(engine.renderATCMessage('{{runway}}'), '07L')
  })

  it('leaves unknown variables empty rather than printing the placeholder', () => {
    const engine = useCommunicationsEngine()
    engine.loadRuntimeSystem(buildSystem())

    assert.equal(engine.renderATCMessage('runway {{nonexistent}} done'), 'runway  done')
  })
})

describe('communicationsEngine — moveToSilent', () => {
  it('advances the cursor, runs state actions, and logs the controller phrase', () => {
    const engine = useCommunicationsEngine()
    engine.loadRuntimeSystem(buildSystem())

    engine.moveToSilent('ACK')

    assert.equal(engine.currentState.value?.id, 'ACK')
    // ACK's action set variables.cleared = true
    assert.equal(engine.variables.value.cleared, true)

    // speak() rendered + logged the say_template for the ACK state
    const log = engine.communicationLog.value
    const last = log[log.length - 1]
    assert.equal(last?.state, 'ACK')
    assert.match(last!.message, /DLH123/)
    assert.match(last!.message, /25R/)
  })

  it('ignores a move to an unknown state', () => {
    const engine = useCommunicationsEngine()
    engine.loadRuntimeSystem(buildSystem())

    engine.moveToSilent('NOPE')
    assert.equal(engine.currentState.value?.id, 'REQ')
  })

  it('getStateDetails returns the requested state or null', () => {
    const engine = useCommunicationsEngine()
    engine.loadRuntimeSystem(buildSystem())

    assert.equal(engine.getStateDetails('ACK')?.role, 'atc')
    assert.equal(engine.getStateDetails('MISSING'), null)
  })
})

describe('normalizeATCText', () => {
  it('renders templates then expands to radiotelephony for TTS', () => {
    const out = normalizeATCText('{{callsign}} cleared to {runway}', {
      callsign: 'DLH123',
      runway: '25R',
    })

    // template was rendered (no braces left)
    assert.doesNotMatch(out, /[{}]/)
    // callsign DLH expands to its telephony name
    assert.match(out, /Lufthansa/)
    // the callsign's digits become spoken words (123 -> wun too tree)
    assert.match(out, /wun too tree/)
  })
})
