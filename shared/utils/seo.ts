export const SITE_URL = 'https://opensquawk.de'
export const SITE_NAME = 'OpenSquawk'
export const DEFAULT_OG_IMAGE = '/img/learn/missions/full-flight/briefing-hero.png'

export interface SeoRoute {
  path: string
  title: string
  description: string
  image: string
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority: number
  language: 'en' | 'de'
}

export const PUBLIC_SEO_ROUTES: SeoRoute[] = [
  {
    path: '/',
    title: 'Train ATC before you fly VATSIM | OpenSquawk',
    description: 'Practice realistic ATC phraseology with guided scenarios, instant feedback and structured radio training for VATSIM and flight simulation.',
    image: '/img/learn/missions/full-flight/briefing-hero.png',
    changefreq: 'weekly',
    priority: 1,
    language: 'en',
  },
  {
    path: '/de',
    title: 'ATC-Funk für VATSIM trainieren | OpenSquawk',
    description: 'Trainiere realistische ATC-Phraseologie mit geführten Szenarien, direktem Feedback und strukturierten Funkübungen für VATSIM und Flugsimulation.',
    image: '/img/learn/missions/full-flight/briefing-hero.png',
    changefreq: 'weekly',
    priority: 0.9,
    language: 'de',
  },
  {
    path: '/news',
    title: 'News, Releases & Product Updates | OpenSquawk',
    description: 'Read OpenSquawk release notes, alpha progress, simulator integration updates and product decisions.',
    image: '/img/learn/missions/full-flight/briefing-departure.png',
    changefreq: 'weekly',
    priority: 0.8,
    language: 'en',
  },
  {
    path: '/roadmap',
    title: 'Product Roadmap & Community Voting | OpenSquawk',
    description: 'Explore the OpenSquawk roadmap, vote on upcoming ATC training features and share ideas with the community.',
    image: '/img/landing/feedback.jpeg',
    changefreq: 'weekly',
    priority: 0.7,
    language: 'en',
  },
  {
    path: '/bridge',
    title: 'Flight Simulator Bridge Downloads | OpenSquawk',
    description: 'Download the OpenSquawk Bridge and connect Microsoft Flight Simulator, FlightGear or X-Plane to your radio training.',
    image: '/img/bridge/goldengate_front.jpeg',
    changefreq: 'monthly',
    priority: 0.7,
    language: 'en',
  },
  {
    path: '/feedback',
    title: 'Feedback & Product Ideas | OpenSquawk',
    description: 'Share feedback, report friction and suggest improvements for OpenSquawk ATC training and flight simulator integrations.',
    image: '/img/landing/feedback.jpeg',
    changefreq: 'monthly',
    priority: 0.5,
    language: 'en',
  },
  {
    path: '/api-docs',
    title: 'API Documentation | OpenSquawk',
    description: 'OpenSquawk API reference for waitlist, updates, roadmap, feedback and authentication integrations.',
    image: '/img/landing/simulator.jpeg',
    changefreq: 'monthly',
    priority: 0.5,
    language: 'en',
  },
  {
    path: '/impressum',
    title: 'Imprint | OpenSquawk',
    description: 'Legal provider information and contact details for OpenSquawk.',
    image: DEFAULT_OG_IMAGE,
    changefreq: 'yearly',
    priority: 0.2,
    language: 'en',
  },
  {
    path: '/datenschutz',
    title: 'Privacy Policy | OpenSquawk',
    description: 'Learn how OpenSquawk collects, processes and protects personal data.',
    image: DEFAULT_OG_IMAGE,
    changefreq: 'yearly',
    priority: 0.2,
    language: 'en',
  },
  {
    path: '/agb',
    title: 'Terms of Service | OpenSquawk',
    description: 'Terms governing registration and use of the OpenSquawk simulator training platform.',
    image: DEFAULT_OG_IMAGE,
    changefreq: 'yearly',
    priority: 0.2,
    language: 'en',
  },
]

export const isNewsArticlePath = (path: string) => /^\/news\/[^/]+\/?$/.test(path)

export const normalizeSeoPath = (path: string) => {
  if (path === '/') return path
  return path.replace(/\/+$/, '') || '/'
}

export const getPublicSeoRoute = (path: string) => {
  const normalized = normalizeSeoPath(path)
  return PUBLIC_SEO_ROUTES.find((route) => route.path === normalized)
}

export const absoluteSiteUrl = (path = '/') => new URL(path, `${SITE_URL}/`).toString()

export const getLanguageAlternates = (path: string) => {
  const normalized = normalizeSeoPath(path)

  if (normalized === '/' || normalized === '/de') {
    return [
      { hreflang: 'en', href: absoluteSiteUrl('/') },
      { hreflang: 'de', href: absoluteSiteUrl('/de') },
      { hreflang: 'x-default', href: absoluteSiteUrl('/') },
    ]
  }

  const canonical = absoluteSiteUrl(normalized)
  return [
    { hreflang: 'en', href: canonical },
    { hreflang: 'x-default', href: canonical },
  ]
}

export const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    ['Is Classroom free right now?', 'Yes. Classroom is currently free during the invitation alpha.'],
    ['What is the difference between Classroom and Live ATC?', 'Classroom is structured listening, readback and feedback training. Live ATC is the real-time simulator radio loop and is still in closed alpha.'],
    ['Do I need to be on VATSIM to use it?', 'No. OpenSquawk is built for VATSIM preparation, so you can train before flying live on network frequencies.'],
    ['Can I self-host and inspect the stack?', 'Yes. The core is open source and self-hosting remains free.'],
    ['How do I get access?', 'Join the waitlist for Classroom and Live ATC. Access is released in rolling batches.'],
    ['Is this for real-world aviation?', 'No. OpenSquawk is simulator training software and is not intended for real-world ATC communication.'],
  ].map(([name, text]) => ({
    '@type': 'Question',
    name,
    acceptedAnswer: { '@type': 'Answer', text },
  })),
}

export const DE_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    ['Ist Classroom aktuell kostenlos?', 'Ja. Classroom ist während der Einladungs-Alpha aktuell kostenlos.'],
    ['Was ist der Unterschied zwischen Classroom und Live ATC?', 'Classroom bietet strukturierte Hör-, Readback- und Feedbackübungen. Live ATC ist der Echtzeit-Funk für den Flugsimulator und befindet sich in der geschlossenen Alpha.'],
    ['Muss ich bei VATSIM angemeldet sein?', 'Nein. OpenSquawk bereitet dich auf VATSIM vor, damit du vor dem ersten Onlineflug sicher üben kannst.'],
    ['Kann ich OpenSquawk selbst hosten?', 'Ja. Der Kern ist Open Source und kann kostenlos selbst gehostet werden.'],
    ['Wie erhalte ich Zugang?', 'Trage dich in die Warteliste für Classroom und Live ATC ein. Einladungen werden schrittweise freigeschaltet.'],
    ['Ist OpenSquawk für die reale Luftfahrt gedacht?', 'Nein. OpenSquawk ist Trainingssoftware für Flugsimulatoren und nicht für echten Flugfunk vorgesehen.'],
  ].map(([name, text]) => ({
    '@type': 'Question',
    name,
    acceptedAnswer: { '@type': 'Answer', text },
  })),
}

export const SOFTWARE_APPLICATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  url: absoluteSiteUrl('/'),
  applicationCategory: 'EducationalApplication',
  applicationSubCategory: 'Flight simulator ATC training',
  operatingSystem: 'Web',
  description: 'Structured ATC radio and phraseology training for flight simulator pilots preparing for VATSIM.',
  image: absoluteSiteUrl(DEFAULT_OG_IMAGE),
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/LimitedAvailability',
  },
  featureList: [
    'Guided ATC communication scenarios',
    'Readback practice and instant feedback',
    'Flight simulator integration',
    'Self-hosted open-source option',
  ],
}

export const jsonLd = (value: object) => JSON.stringify(value).replaceAll('<', '\\u003c')
