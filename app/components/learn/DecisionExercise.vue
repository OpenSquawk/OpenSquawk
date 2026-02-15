<template>
  <div v-if="scenario" class="decision-exercise">
    <section class="decision-briefing">
      <h4 class="decision-heading">Situation Briefing</h4>
      <p class="decision-briefing-text">{{ scenario.briefing }}</p>
    </section>

    <div class="decision-layout">
      <aside class="stripboard" aria-label="Flight strips">
        <h5 class="stripboard-title">Stripboard</h5>
        <div class="strip-list">
          <article
            v-for="strip in scenario.strips"
            :key="strip.callsign"
            class="strip-card"
            :class="{ 'is-emergency': strip.status === 'emergency' }"
          >
            <header class="strip-head">
              <strong>{{ strip.callsign }}</strong>
              <span class="strip-badge">{{ strip.status === 'emergency' ? 'EMERGENCY' : strip.category }}</span>
            </header>
            <div class="strip-row">Type: {{ strip.type }}</div>
            <div class="strip-row">Level: {{ strip.altitude }}</div>
            <div class="strip-row">Heading: {{ strip.heading }}</div>
            <div class="strip-row">Position: {{ strip.position }}</div>
            <div class="strip-row">Intent: {{ strip.intention }}</div>
          </article>
        </div>
      </aside>

      <section v-if="currentStep" class="decision-area" aria-label="Decision step">
        <header class="decision-step-head">
          <span class="decision-step-counter">Step {{ stepIndex + 1 }} / {{ totalSteps }}</span>
          <span class="decision-step-type">{{ currentStep.type }}</span>
        </header>

        <p class="decision-step-prompt">{{ currentStep.prompt }}</p>

        <div v-if="currentStep.type === 'choice'" class="decision-inputs choice-group">
          <label v-for="option in currentStep.options || []" :key="option" class="choice-option">
            <input
              v-model="choiceAnswers[stepIndex]"
              type="radio"
              :name="`step-${stepIndex}`"
              :value="option"
              @change="onInteraction"
            />
            <span>{{ option }}</span>
          </label>
        </div>

        <div
          v-else-if="currentStep.type === 'sequencing' || currentStep.type === 'priority'"
          class="decision-inputs order-group"
        >
          <div class="order-help">Drag and drop to reorder.</div>
          <ul class="order-list">
            <li
              v-for="(item, idx) in listAnswers[stepIndex] || []"
              :key="`${item}-${idx}`"
              class="order-item"
              draggable="true"
              @dragstart="onDragStart(idx)"
              @dragover.prevent
              @drop="onDrop(idx)"
            >
              <span class="drag-handle" aria-hidden="true">::</span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>

        <div v-else-if="currentStep.type === 'assignment'" class="decision-inputs assignment-group">
          <div
            v-for="(item, idx) in currentStep.items || []"
            :key="`${item}-${idx}`"
            class="assignment-row"
          >
            <span class="assignment-label">{{ item }}</span>
            <select
              :value="assignmentAnswers[stepIndex]?.[idx] || ''"
              @change="onAssignmentChange(stepIndex, idx, ($event.target as HTMLSelectElement).value)"
            >
              <option value="" disabled>Select</option>
              <option v-for="option in currentStep.options || []" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>
        </div>

        <div class="decision-controls">
          <button class="btn soft" type="button" :disabled="stepIndex === 0" @click="goPrev">Previous</button>
          <button v-if="!isLastStep" class="btn soft" type="button" :disabled="!isCurrentStepAnswered" @click="goNext">Next</button>
          <button
            v-else
            class="btn primary"
            type="button"
            :disabled="!allStepsAnswered"
            @click="evaluateAll"
          >
            Evaluate Decision
          </button>
        </div>

        <section v-if="summary" class="decision-summary" aria-live="polite">
          <div class="decision-score">{{ summary.score }}%</div>
          <div class="decision-breakdown">
            <span>Safety {{ summary.safety }}%</span>
            <span>Correctness {{ summary.correctness }}%</span>
            <span>Efficiency {{ summary.efficiency }}%</span>
          </div>
          <ul class="decision-explanations">
            <li v-for="(step, idx) in scenario.steps" :key="`${step.prompt}-${idx}`">
              <strong>Step {{ idx + 1 }}:</strong>
              {{ step.explanation }}
            </li>
          </ul>
        </section>
      </section>
    </div>
  </div>
  <div v-else class="decision-empty muted">No decision scenario loaded.</div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { DecisionScenario, DecisionStep } from '~~/shared/learn/decision-types'

const props = defineProps<{
  scenario: DecisionScenario | null
}>()

const emit = defineEmits<{
  complete: [payload: { score: number; safety: number; correctness: number; efficiency: number }]
}>()

const stepIndex = ref(0)
const dragIndex = ref<number | null>(null)
const interactionCount = ref(0)

const choiceAnswers = reactive<Record<number, string>>({})
const listAnswers = reactive<Record<number, string[]>>({})
const assignmentAnswers = reactive<Record<number, string[]>>({})

const summary = ref<{ score: number; safety: number; correctness: number; efficiency: number } | null>(null)

const totalSteps = computed(() => props.scenario?.steps.length ?? 0)
const isLastStep = computed(() => stepIndex.value >= Math.max(totalSteps.value - 1, 0))
const currentStep = computed<DecisionStep | null>(() => {
  if (!props.scenario) return null
  return props.scenario.steps[stepIndex.value] ?? null
})

function onInteraction() {
  interactionCount.value += 1
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function initAnswers() {
  stepIndex.value = 0
  dragIndex.value = null
  interactionCount.value = 0
  summary.value = null

  Object.keys(choiceAnswers).forEach(key => delete choiceAnswers[Number(key)])
  Object.keys(listAnswers).forEach(key => delete listAnswers[Number(key)])
  Object.keys(assignmentAnswers).forEach(key => delete assignmentAnswers[Number(key)])

  if (!props.scenario) return

  props.scenario.steps.forEach((step, idx) => {
    if (step.type === 'choice') {
      choiceAnswers[idx] = ''
    }
    if (step.type === 'sequencing' || step.type === 'priority') {
      listAnswers[idx] = [...(step.items || [])]
    }
    if (step.type === 'assignment') {
      assignmentAnswers[idx] = (step.items || []).map(() => '')
    }
  })
}

watch(() => props.scenario, () => {
  initAnswers()
}, { immediate: true })

function onAssignmentChange(step: number, itemIndex: number, value: string) {
  if (!assignmentAnswers[step]) return
  assignmentAnswers[step][itemIndex] = value
  onInteraction()
}

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDrop(index: number) {
  const source = dragIndex.value
  if (source === null || source === index || !listAnswers[stepIndex.value]) return
  const items = [...listAnswers[stepIndex.value]]
  const [moved] = items.splice(source, 1)
  items.splice(index, 0, moved)
  listAnswers[stepIndex.value] = items
  dragIndex.value = null
  onInteraction()
}

const isCurrentStepAnswered = computed(() => {
  const step = currentStep.value
  if (!step) return false
  if (step.type === 'choice') {
    return Boolean(choiceAnswers[stepIndex.value])
  }
  if (step.type === 'sequencing' || step.type === 'priority') {
    const answers = listAnswers[stepIndex.value] || []
    return answers.length === (step.items || []).length
  }
  if (step.type === 'assignment') {
    const answers = assignmentAnswers[stepIndex.value] || []
    return answers.length > 0 && answers.every(item => Boolean(item))
  }
  return false
})

const allStepsAnswered = computed(() => {
  if (!props.scenario) return false
  return props.scenario.steps.every((step, idx) => {
    if (step.type === 'choice') return Boolean(choiceAnswers[idx])
    if (step.type === 'sequencing' || step.type === 'priority') {
      return (listAnswers[idx] || []).length === (step.items || []).length
    }
    if (step.type === 'assignment') {
      const answers = assignmentAnswers[idx] || []
      return answers.length === (step.items || []).length && answers.every(item => Boolean(item))
    }
    return false
  })
})

function goPrev() {
  stepIndex.value = Math.max(0, stepIndex.value - 1)
}

function goNext() {
  if (!isCurrentStepAnswered.value) return
  stepIndex.value = Math.min(totalSteps.value - 1, stepIndex.value + 1)
}

function scoreSequence(answer: string[], correct: string[]): number {
  if (!correct.length) return 0
  const normalizedCorrect = correct.map(normalize)
  const normalizedAnswer = answer.map(normalize)
  let hits = 0
  normalizedCorrect.forEach((value, idx) => {
    if (normalizedAnswer[idx] === value) hits += 1
  })
  return hits / normalizedCorrect.length
}

function scoreStep(step: DecisionStep, idx: number): number {
  if (step.type === 'choice') {
    const answer = choiceAnswers[idx] || ''
    const expected = typeof step.correct === 'string' ? step.correct : step.correct[0] || ''
    return normalize(answer) === normalize(expected) ? 1 : 0
  }

  if (step.type === 'sequencing' || step.type === 'priority') {
    const answer = listAnswers[idx] || []
    const expected = Array.isArray(step.correct) ? step.correct : [step.correct]
    return scoreSequence(answer, expected)
  }

  if (step.type === 'assignment') {
    const answer = assignmentAnswers[idx] || []
    const expected = Array.isArray(step.correct) ? step.correct : [step.correct]
    return scoreSequence(answer, expected)
  }

  return 0
}

function evaluateAll() {
  if (!props.scenario || !allStepsAnswered.value) return

  const scores = props.scenario.steps.map((step, idx) => scoreStep(step, idx))
  const avg = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0
  const correctness = Math.round(avg * 100)

  const criticalScores = props.scenario.steps
    .map((step, idx) => {
      const critical = step.type === 'priority' || /emergency|runway|conflict|mayday|tcas/i.test(step.prompt)
      return critical ? scores[idx] : null
    })
    .filter((value): value is number => value !== null)

  const criticalFloor = criticalScores.length ? Math.min(...criticalScores) : avg
  const safety = Math.round((criticalFloor * 0.65 + avg * 0.35) * 100)

  const baselineActions = props.scenario.steps.length + props.scenario.steps.filter(step => step.type !== 'choice').length
  const overhead = Math.max(0, interactionCount.value - baselineActions)
  const efficiency = Math.max(55, Math.min(100, 100 - overhead * 4))

  const score = Math.round(safety * 0.6 + correctness * 0.3 + efficiency * 0.1)

  summary.value = { score, safety, correctness, efficiency }
  emit('complete', summary.value)
}
</script>

<style scoped>
.decision-exercise {
  display: grid;
  gap: 1rem;
}

.decision-briefing,
.stripboard,
.decision-area {
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 14px;
  background: rgba(2, 6, 23, 0.42);
  backdrop-filter: blur(8px);
}

.decision-briefing {
  padding: 1rem;
}

.decision-heading {
  margin: 0;
  font-size: 1rem;
}

.decision-briefing-text {
  margin: 0.45rem 0 0;
  color: rgba(226, 232, 240, 0.9);
}

.decision-layout {
  display: grid;
  grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
  gap: 1rem;
}

.stripboard {
  padding: 0.9rem;
}

.stripboard-title {
  margin: 0 0 0.7rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.strip-list {
  display: grid;
  gap: 0.65rem;
}

.strip-card {
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 10px;
  padding: 0.6rem;
  background: rgba(15, 23, 42, 0.55);
}

.strip-card.is-emergency {
  border-color: rgba(248, 113, 113, 0.72);
  background: rgba(127, 29, 29, 0.24);
}

.strip-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.strip-badge {
  font-size: 0.7rem;
  border-radius: 999px;
  padding: 0.12rem 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: rgba(56, 189, 248, 0.2);
}

.strip-row {
  color: rgba(203, 213, 225, 0.92);
  font-size: 0.82rem;
}

.decision-area {
  padding: 1rem;
}

.decision-step-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

.decision-step-counter {
  color: rgba(148, 163, 184, 0.95);
  font-size: 0.8rem;
}

.decision-step-type {
  border: 1px solid rgba(56, 189, 248, 0.36);
  border-radius: 999px;
  padding: 0.18rem 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.7rem;
  color: #67e8f9;
}

.decision-step-prompt {
  margin: 0.75rem 0 0.95rem;
  font-size: 1rem;
}

.decision-inputs {
  display: grid;
  gap: 0.6rem;
}

.choice-option {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 10px;
  padding: 0.55rem 0.65rem;
  background: rgba(15, 23, 42, 0.48);
}

.order-help {
  font-size: 0.8rem;
  color: rgba(148, 163, 184, 0.95);
}

.order-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.5rem;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  background: rgba(30, 41, 59, 0.55);
  cursor: grab;
}

.drag-handle {
  color: rgba(125, 211, 252, 0.9);
  letter-spacing: 0.08em;
}

.assignment-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 0.7rem;
  align-items: center;
}

.assignment-label {
  font-size: 0.88rem;
  color: rgba(226, 232, 240, 0.95);
}

.assignment-row select {
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.62);
  color: rgba(226, 232, 240, 0.96);
  padding: 0.4rem 0.55rem;
}

.decision-controls {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.decision-summary {
  margin-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.26);
  padding-top: 0.85rem;
}

.decision-score {
  font-size: 1.8rem;
  font-weight: 700;
}

.decision-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  font-size: 0.85rem;
  color: rgba(125, 211, 252, 0.92);
}

.decision-explanations {
  margin: 0.7rem 0 0;
  padding-left: 1.1rem;
  color: rgba(203, 213, 225, 0.9);
}

.decision-empty {
  border: 1px dashed rgba(148, 163, 184, 0.45);
  border-radius: 12px;
  padding: 1rem;
}

@media (max-width: 980px) {
  .decision-layout {
    grid-template-columns: 1fr;
  }

  .assignment-row {
    grid-template-columns: 1fr;
  }
}
</style>
