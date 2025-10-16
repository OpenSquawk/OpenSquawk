import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import type { RuntimeDecisionState, RuntimeDecisionSystem } from '~~/shared/types/decision'
import type { LLMDecisionInput } from '~~/shared/types/llm'
import { __setRuntimeDecisionSystemForTests, routeDecision } from './openai'

const createState = (overrides: Partial<RuntimeDecisionState>): RuntimeDecisionState => ({
    role: 'pilot',
    phase: 'ground',
    name: 'State',
    summary: 'Generic state',
    say_tpl: undefined,
    utterance_tpl: undefined,
    else_say_tpl: undefined,
    next: [],
    ok_next: [],
    bad_next: [],
    timer_next: [],
    auto: null,
    readback_required: undefined,
    actions: undefined,
    handoff: undefined,
    guard: undefined,
    trigger: undefined,
    frequency: undefined,
    frequencyName: undefined,
    auto_transitions: [],
    triggers: [],
    conditions: [],
    metadata: undefined,
    ...overrides,
})

const START = createState({
    name: 'Start',
    summary: 'Start of flow',
    role: 'atc',
})

const ACK = createState({
    name: 'Acknowledge',
    summary: 'Acknowledge pilot readback',
    triggers: [
        { type: 'regex', pattern: 'roger', patternFlags: 'i' },
    ],
})

const TAXI = createState({
    name: 'Taxi clearance',
    summary: 'Pilot requesting taxi clearance',
    triggers: [
        { type: 'regex', pattern: 'request', patternFlags: 'i' },
    ],
})

const HOLD = createState({
    name: 'Hold position',
    summary: 'Pilot requesting hold position',
    triggers: [
        { type: 'regex', pattern: 'request', patternFlags: 'i' },
    ],
})

START.next = [
    { to: 'ACK' },
    { to: 'TAXI' },
    { to: 'HOLD' },
]

const runtimeSystem: RuntimeDecisionSystem = {
    main: 'main',
    order: ['main'],
    flows: {
        main: {
            slug: 'main',
            start_state: 'START',
            entry_mode: 'main',
            states: {
                START,
                ACK,
                TAXI,
                HOLD,
            },
        },
    },
}

const baseInput: Omit<LLMDecisionInput, 'candidates'> = {
    state_id: 'START',
    state: START,
    variables: { callsign: 'TEST123' },
    flags: { current_unit: 'TWR', in_air: false },
    pilot_utterance: '',
}

describe('routeDecision', () => {
    beforeEach(() => {
        __setRuntimeDecisionSystemForTests(runtimeSystem)
    })

    it('returns heuristic decision when exactly one candidate matches', async () => {
        const input: LLMDecisionInput = {
            ...baseInput,
            pilot_utterance: 'Roger that',
            candidates: [
                { id: 'ACK', state: ACK },
            ],
        }

        const result = await routeDecision(input)

        assert.equal(result.decision.next_state, 'ACK')
        assert.equal(result.trace?.calls.length ?? 0, 0)
        assert.equal(result.trace?.autoSelection?.id, 'ACK')
    })

    it('falls back to heuristic selection when OpenAI call fails', async () => {
        const input: LLMDecisionInput = {
            ...baseInput,
            pilot_utterance: 'Request taxi instructions',
            candidates: [
                { id: 'TAXI', state: TAXI },
                { id: 'HOLD', state: HOLD },
            ],
        }

        const result = await routeDecision(input)

        assert.equal(result.trace?.calls.length, 1)
        assert.ok(result.trace?.calls[0]?.error)
        assert.equal(result.trace?.fallback?.used, true)
        assert.equal(result.decision.next_state, 'TAXI')
    })
})

