import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { learnModules } from '~~/shared/data/learnModules'
import {
  assessRequiredFields,
  isCurrentMastery,
  updateMasteryProgress,
} from '~~/shared/learn/assessment'
import { CLASSROOM_ASSESSMENT_VERSION } from '~~/shared/learn/config'

describe('Classroom curriculum contract', () => {
  it('exposes the four goal-led modules and a 17-step guided flight', () => {
    assert.deepEqual(
      learnModules.map(module => module.title),
      [
        'Foundations',
        'Mandatory Readbacks',
        'Pilot Calls & Abnormal Situations',
        'Guided Flight Sequence',
      ],
    )
    assert.equal(learnModules.find(module => module.id === 'full-flight')?.lessons.length, 17)
  })

  it('gives every lesson an explicit prompt, response label and valid required fields', () => {
    const ids = new Set<string>()

    for (const module of learnModules) {
      for (const lesson of module.lessons) {
        assert.equal(ids.has(lesson.id), false, `duplicate lesson id: ${lesson.id}`)
        ids.add(lesson.id)
        assert.ok(lesson.prompt, `${lesson.id} has no prompt`)
        assert.ok(lesson.responseLabel, `${lesson.id} has no response label`)
        assert.ok(lesson.standard, `${lesson.id} has no standard reference`)
        assert.ok(lesson.whyItMatters, `${lesson.id} has no learning rationale`)

        const scenario = lesson.generate()
        const prompt = lesson.prompt?.text(scenario).trim() ?? ''
        assert.ok(prompt, `${lesson.id} has an empty prompt`)
        if (lesson.prompt?.kind === 'situation') {
          assert.equal(
            prompt.includes(scenario.radioCall),
            false,
            `${lesson.id} exposes the finished pilot response as its situation prompt`,
          )
          assert.equal(
            lesson.fields.some(field => /callsign/i.test(`${field.key} ${field.label}`)),
            true,
            `${lesson.id} does not assess the pilot callsign`,
          )
        }

        const fieldKeys = new Set(lesson.fields.map(field => field.key))
        for (const field of lesson.fields) {
          assert.equal(field.required, true, `${lesson.id}/${field.key} must declare required`)
          assert.ok(field.matching, `${lesson.id}/${field.key} has no matching policy`)
          assert.ok(field.expected(scenario).trim(), `${lesson.id}/${field.key} has no expected value`)
        }
        for (const segment of lesson.readback) {
          if (segment.type === 'field') {
            assert.equal(fieldKeys.has(segment.key), true, `${lesson.id} references missing field ${segment.key}`)
          }
        }
      }
    }
  })

  it('uses correct prompt roles for pilot calls, ATC instructions and copy exercises', () => {
    const byId = new Map(learnModules.flatMap(module => module.lessons).map(lesson => [lesson.id, lesson]))

    for (const id of ['clearance-contact', 'departure-checkin', 'mayday', 'pan-pan', 'go-around', 'radio-check']) {
      assert.equal(byId.get(id)?.prompt?.kind, 'situation', `${id} must not be played as ATC`)
      assert.equal(byId.get(id)?.responseLabel, 'Pilot call')
    }
    for (const id of ['atis', 'metar', 'icao-alphabet']) {
      assert.equal(byId.get(id)?.prompt?.kind, 'copy')
    }
    assert.equal(byId.get('takeoff')?.prompt?.kind, 'atc')
  })

  it('models critical readbacks and emergency calls without misleading fields', () => {
    const byId = new Map(learnModules.flatMap(module => module.lessons).map(lesson => [lesson.id, lesson]))

    for (const id of ['takeoff', 'landing-clearance', 'full-takeoff', 'full-landing']) {
      const lesson = byId.get(id)
      assert.ok(lesson)
      assert.equal(lesson?.fields.some(field => /wind/i.test(`${field.key} ${field.label}`)), false)
    }

    assert.equal(byId.get('approach-vector')?.fields.some(field => field.key === 'vector-direction'), true)
    assert.equal(byId.get('descent-clearance')?.fields.some(field => field.key === 'descent-level'), true)
    assert.equal(byId.get('radio-check')?.fields.some(field => /readability/i.test(field.key)), false)

    for (const id of ['mayday', 'pan-pan']) {
      const labels = byId.get(id)?.fields.map(field => field.label) ?? []
      for (const expected of ['Callsign', 'Nature', 'Intention', 'Position', 'Level', 'Heading']) {
        assert.equal(labels.includes(expected), true, `${id} misses ${expected}`)
      }
    }
  })

  it('keeps one scenario identity throughout the guided flight', () => {
    const lessons = learnModules.find(module => module.id === 'full-flight')?.lessons ?? []
    const scenarios = lessons.map(lesson => lesson.generate())
    assert.ok(scenarios.length)
    for (const scenario of scenarios) {
      assert.equal(scenario.callsign, scenarios[0]?.callsign)
      assert.equal(scenario.airport.icao, scenarios[0]?.airport.icao)
      assert.equal(scenario.destination.icao, scenarios[0]?.destination.icao)
      assert.equal(scenario.runway, scenarios[0]?.runway)
    }
  })
})

describe('Classroom assessment', () => {
  it('never passes when one required safety element is missing at 80 percent', () => {
    const summary = assessRequiredFields([
      { key: 'runway', required: true, pass: true, similarity: 1 },
      { key: 'heading', required: true, pass: true, similarity: 1 },
      { key: 'level', required: true, pass: true, similarity: 1 },
      { key: 'speed', required: true, pass: true, similarity: 1 },
      { key: 'callsign', required: true, pass: false, similarity: 0 },
    ])
    assert.equal(summary?.score, 80)
    assert.equal(summary?.passed, false)
  })

  it('requires two unrevealed variations for current mastery', () => {
    const passed = { score: 100, hits: 2, required: 2, similarity: 1, passed: true }
    const first = updateMasteryProgress(undefined, passed, {
      modelAnswerRevealed: false,
      variantAlreadyCounted: false,
    })
    assert.equal(first.progress.done, false)
    assert.equal(first.progress.successfulVariants, 1)

    const duplicate = updateMasteryProgress(first.progress, passed, {
      modelAnswerRevealed: false,
      variantAlreadyCounted: true,
    })
    assert.equal(duplicate.progress.successfulVariants, 1)

    const revealed = updateMasteryProgress(first.progress, passed, {
      modelAnswerRevealed: true,
      variantAlreadyCounted: false,
    })
    assert.equal(revealed.progress.successfulVariants, 1)

    const second = updateMasteryProgress(first.progress, passed, {
      modelAnswerRevealed: false,
      variantAlreadyCounted: false,
    })
    assert.equal(second.progress.done, true)
    assert.equal(isCurrentMastery(second.progress), true)
  })

  it('treats legacy completion as review needed rather than current mastery', () => {
    assert.equal(isCurrentMastery({ best: 100, done: true }), false)
    assert.equal(
      isCurrentMastery({
        best: 100,
        done: true,
        assessmentVersion: CLASSROOM_ASSESSMENT_VERSION,
        successfulVariants: 2,
      }),
      true,
    )
  })
})
