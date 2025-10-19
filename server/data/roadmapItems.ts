export interface RoadmapItemDefinition {
  key: string
  title: string
  description: string
  category: string
  icon: string
}

export const ROADMAP_ITEMS: RoadmapItemDefinition[] = [
  {
    key: 'touch-ptt-app',
    title: 'Touch web app for phones & tablets',
    description:
      'Progressive web app with a large push-to-talk button, simplified radio prompts and guided readbacks — ideal for practice on the go.',
    category: 'Training',
    icon: 'mdi-cellphone-sound',
  },
  {
    key: 'button-control',
    title: 'Button-controlled transmissions',
    description:
      'Hardware or on-screen push-to-talk button options for when speaking aloud is not possible or practical.',
    category: 'Accessibility',
    icon: 'mdi-gesture-tap-button',
  },
  {
    key: 'realism-upgrades',
    title: 'Phraseology realism boost',
    description:
      'Fine-tune voices, background noise and procedural replies so clearances, handoffs and phraseology sound like real radar.',
    category: 'Simulation',
    icon: 'mdi-rocket-launch'
  },
  {
    key: 'cockpit-intercom',
    title: 'Virtual intercom & checklists',
    description:
      'Talk to an AI co-pilot, hear SOP checklists read aloud and tick off flows via voice or touch.',
    category: 'Crew',
    icon: 'mdi-account-voice',
  },
  {
    key: 'emergency-training',
    title: 'Mayday & pan-pan training flows',
    description:
      'Guided emergency scenarios with standard callouts, tower prioritization and debrief follow-up.',
    category: 'Safety',
    icon: 'mdi-alert-decagram',
  },
  {
    key: 'taxi-routing',
    title: 'Airport-specific taxi instructions',
    description:
      'Routing powered by apt.dat and OSM with airport-specific taxi flows, hotspots and visual charts.',
    category: 'Ground',
    icon: 'mdi-map-marker-path',
  },
  {
    key: 'atc-classroom-platform',
    title: 'ATC-only classroom platform',
    description:
      'Browser trainings for listening, spelling and filtering interference — ICAO alphabet, speed drills and readback checks without a simulator.',
    category: 'Academy',
    icon: 'mdi-headset',
  },
  {
    key: 'self-hosting',
    title: 'Self-hosting with local models',
    description:
      'Docker/Compose blueprints plus offline ASR/TTS options for local hosting without cloud dependencies.',
    category: 'Infra',
    icon: 'mdi-server',
  },
  {
    key: 'premium-api-access',
    title: 'Premium access to high-performance APIs',
    description:
      'Optional monthly plans for faster speech and sim APIs with prioritized quotas at low prices.',
    category: 'Business',
    icon: 'mdi-credit-card-clock',
  },
  {
    key: 'multi-voice',
    title: 'Multiple ATC voices',
    description:
      'Rotating voices per position, including regional accents and gender-neutral options.',
    category: 'Immersion',
    icon: 'mdi-account-multiple',
  },
  {
    key: 'ai-traffic',
    title: 'AI-generated ATC traffic',
    description:
      'Simulated fellow pilots to increase frequency traffic, including correct callsigns, handovers and conflict handling.',
    category: 'Traffic',
    icon: 'mdi-airplane-takeoff',
  },
]

export const ROADMAP_ITEM_KEYS = new Set(ROADMAP_ITEMS.map((item) => item.key))
