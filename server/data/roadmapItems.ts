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
    title: 'Touch-Webapp für Handy & Tablet',
    description:
      'Progressive Web-App mit großem Push-to-Talk-Button, vereinfachten Funk-Prompts und geführten Readbacks – ideal zum Üben unterwegs.',
    category: 'Training',
    icon: 'mdi-cellphone-sound',
  },
  {
    key: 'realism-upgrades',
    title: 'Realismus-Boost für Phraseologie',
    description:
      'Feintuning für Stimmen, Hintergrundrauschen und prozedurale Antworten, damit Clearance, Handoffs und Phraseologie wie am echten Radar klingen.',
    category: 'Simulation',
    icon: 'mdi-rocket-launch'
  },
  {
    key: 'cockpit-intercom',
    title: 'Virtuelles Intercom & Checklisten',
    description:
      'Sprich mit einer KI-Copilot:in, lass dir SOP-Checklisten vorlesen und hake Abläufe via Voice oder Touch ab.',
    category: 'Crew',
    icon: 'mdi-account-voice',
  },
  {
    key: 'emergency-training',
    title: 'Mayday & Pan-Pan Trainingsflows',
    description:
      'Geführte Szenarien für Notrufe inkl. Standard-Callouts, Priorisierung durch den Tower und Nachbereitung mit Debrief.',
    category: 'Safety',
    icon: 'mdi-alert-decagram',
  },
  {
    key: 'taxi-routing',
    title: 'Airport-genaue Taxi-Anweisungen',
    description:
      'Apt.dat- & OSM-gestütztes Routing mit individuellen Taxi-Flows, Hotspots und visuellen Rollkarten pro Airport.',
    category: 'Ground',
    icon: 'mdi-map-marker-path',
  },
  {
    key: 'atc-learning-platform',
    title: 'ATC-Only Lernplattform',
    description:
      'Browser-Trainings zum Hören, Buchstabieren und Störgeräusch-Filtern – ICAO-Alphabet, Speed-Drills und Readback-Checks ohne Simulator.',
    category: 'Academy',
    icon: 'mdi-headset',
  },
  {
    key: 'self-hosting',
    title: 'Selfhosting mit lokalen Modellen',
    description:
      'Docker-/Compose-Blueprints plus Offline-ASR/TTS-Optionen für lokales Hosting ohne Cloud-Abhängigkeit.',
    category: 'Infra',
    icon: 'mdi-server',
  },
  {
    key: 'premium-api-access',
    title: 'Premium-Zugriff auf schnelle APIs',
    description:
      'Optionale Monatsabos für performantere Speech- & Sim-APIs mit priorisierten Kontingenten zu niedrigen Beträgen.',
    category: 'Business',
    icon: 'mdi-credit-card-clock',
  },
  {
    key: 'multi-voice',
    title: 'Mehrere ATC-Stimmen',
    description:
      'Wechselnde Stimmen je Position, inklusive regionaler Akzente und geschlechtsneutraler Optionen.',
    category: 'Immersion',
    icon: 'mdi-account-multiple',
  },
  {
    key: 'ai-traffic',
    title: 'AI-generierter ATC-Traffic',
    description:
      'Simulierte andere Piloten für Frequenzaufkommen, inklusive korrekter Callsigns, Handovers und Konflikt-Handling.',
    category: 'Traffic',
    icon: 'mdi-airplane-takeoff',
  },
]

export const ROADMAP_ITEM_KEYS = new Set(ROADMAP_ITEMS.map((item) => item.key))
