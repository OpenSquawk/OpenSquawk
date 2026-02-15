export type DecisionType = 'sequencing' | 'choice' | 'assignment' | 'priority'

export type FlightStrip = {
  callsign: string
  type: string
  altitude: string
  heading: string
  position: string
  intention: string
  category: 'heavy' | 'medium' | 'light'
  status: 'emergency' | 'normal'
}

export type DecisionStep = {
  prompt: string
  type: DecisionType
  options?: string[]
  items?: string[]
  correct: string | string[]
  explanation: string
}

export type DecisionScenario = {
  briefing: string
  strips: FlightStrip[]
  steps: DecisionStep[]
}

export type DecisionLesson = {
  id: string
  title: string
  desc: string
  keywords: string[]
  hints: string[]
  generate: () => DecisionScenario
}
