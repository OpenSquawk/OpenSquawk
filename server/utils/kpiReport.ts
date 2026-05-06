import { FeedbackSubmission } from '../models/FeedbackSubmission'
import { InvitationCode } from '../models/InvitationCode'
import { LandingAnalyticsEvent } from '../models/LandingAnalyticsEvent'
import { ProductUsageSession } from '../models/ProductUsageSession'
import { WaitlistEntry } from '../models/WaitlistEntry'

export type KpiProduct = 'classroom' | 'liveatc'

const DAY_MS = 1000 * 60 * 60 * 24
const PRODUCTS: KpiProduct[] = ['classroom', 'liveatc']

type ProductKpis = {
  product: KpiProduct
  waitlistEntries: number
  activatedUsers: number
  feedbackCount: number
  usageSessions: number
  usageSeconds: number
  averageUsageSeconds: number
}

type SmartGoal = {
  label: string
  target: string
  actual: string
  met: boolean
}

type FeedbackItem = {
  product: KpiProduct
  createdAt: string
  excitement: number
  from: string
  summary: string
}

export type WeeklyKpiReport = {
  generatedAt: string
  periodStart: string
  periodEnd: string
  totals: {
    waitlistEntries: number
    activatedUsers: number
    feedbackCount: number
    landingViews: number
    landingScrolled: number
    landingScrollRate: number
    landingWaitlistConversionRate: number
    usageSeconds: number
    averageUsageSeconds: number
  }
  products: ProductKpis[]
  smartGoals: SmartGoal[]
  landingTrend: { date: string; views: number; scrolled: number; waitlistEntries: number }[]
  feedback: FeedbackItem[]
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function getWeeklyReportWindow(now = new Date()) {
  const periodEnd = now
  const periodStart = new Date(periodEnd.getTime() - 7 * DAY_MS)
  return { periodStart, periodEnd }
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

function formatSeconds(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = seconds / 60
  if (minutes < 60) return `${Math.round(minutes)}m`
  return `${Math.round((minutes / 60) * 10) / 10}h`
}

function getProductCounts(rows: any[], defaultValue = 0) {
  const counts: Record<KpiProduct, number> = { classroom: defaultValue, liveatc: defaultValue }
  for (const row of rows) {
    const product = row._id === 'liveatc' ? 'liveatc' : 'classroom'
    counts[product] = Number(row.count || 0)
  }
  return counts
}

function getUsageByProduct(rows: any[]) {
  const usage: Record<KpiProduct, { sessions: number; seconds: number }> = {
    classroom: { sessions: 0, seconds: 0 },
    liveatc: { sessions: 0, seconds: 0 },
  }
  for (const row of rows) {
    const product = row._id === 'liveatc' ? 'liveatc' : 'classroom'
    usage[product] = {
      sessions: Number(row.sessions || 0),
      seconds: Number(row.seconds || 0),
    }
  }
  return usage
}

function normalizeDateKey(value: unknown) {
  return typeof value === 'string' && value.length >= 10 ? value.slice(0, 10) : ''
}

function pickFeedbackSummary(doc: any) {
  const parts = [
    doc.classroomNotes,
    doc.frictionNotes,
    doc.highlightNotes,
    doc.otherIdeas,
    Array.isArray(doc.frictionSelections) ? doc.frictionSelections.join(', ') : '',
    Array.isArray(doc.highlightSelections) ? doc.highlightSelections.join(', ') : '',
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)

  return (parts[0] || 'No written note.').slice(0, 260)
}

export async function buildWeeklyKpiReport(now = new Date()): Promise<WeeklyKpiReport> {
  const { periodStart, periodEnd } = getWeeklyReportWindow(now)

  const [
    waitlistByProductRows,
    activatedByProductRows,
    feedbackByProductRows,
    usageByProductRows,
    landingViewRows,
    landingScrolledRows,
    landingTrendRows,
    waitlistTrendRows,
    feedbackDocs,
  ] = await Promise.all([
    WaitlistEntry.aggregate([
      { $match: { joinedAt: { $gte: periodStart, $lt: periodEnd } } },
      { $group: { _id: { $ifNull: ['$product', 'classroom'] }, count: { $sum: 1 } } },
    ]),
    InvitationCode.aggregate([
      { $match: { usedAt: { $gte: periodStart, $lt: periodEnd }, usedBy: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: 'waitlistentries',
          localField: '_id',
          foreignField: 'invitationCode',
          as: 'waitlist',
        },
      },
      { $unwind: { path: '$waitlist', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$waitlist.product', 'classroom'] }, count: { $sum: 1 } } },
    ]),
    FeedbackSubmission.aggregate([
      { $match: { createdAt: { $gte: periodStart, $lt: periodEnd } } },
      { $group: { _id: '$product', count: { $sum: 1 } } },
    ]),
    ProductUsageSession.aggregate([
      { $match: { endedAt: { $gte: periodStart, $lt: periodEnd } } },
      { $group: { _id: '$product', sessions: { $sum: 1 }, seconds: { $sum: '$durationSeconds' } } },
    ]),
    LandingAnalyticsEvent.aggregate([
      { $match: { type: 'view', createdAt: { $gte: periodStart, $lt: periodEnd } } },
      { $group: { _id: '$sessionId', first: { $first: '$sessionId' } } },
      { $count: 'count' },
    ]),
    LandingAnalyticsEvent.aggregate([
      { $match: { type: 'scrolled', createdAt: { $gte: periodStart, $lt: periodEnd } } },
      { $group: { _id: '$sessionId', first: { $first: '$sessionId' } } },
      { $count: 'count' },
    ]),
    LandingAnalyticsEvent.aggregate([
      { $match: { type: { $in: ['view', 'scrolled'] }, createdAt: { $gte: periodStart, $lt: periodEnd } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, type: '$type' },
          sessions: { $addToSet: '$sessionId' },
        },
      },
      { $project: { _id: 1, count: { $size: '$sessions' } } },
    ]),
    WaitlistEntry.aggregate([
      { $match: { joinedAt: { $gte: periodStart, $lt: periodEnd } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$joinedAt' } }, count: { $sum: 1 } } },
    ]),
    FeedbackSubmission.find({ createdAt: { $gte: periodStart, $lt: periodEnd } })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean(),
  ])

  const waitlistCounts = getProductCounts(waitlistByProductRows)
  const activatedCounts = getProductCounts(activatedByProductRows)
  const feedbackCounts = getProductCounts(feedbackByProductRows)
  const usage = getUsageByProduct(usageByProductRows)

  const products = PRODUCTS.map((product) => {
    const usageSeconds = usage[product].seconds
    const usageSessions = usage[product].sessions
    return {
      product,
      waitlistEntries: waitlistCounts[product],
      activatedUsers: activatedCounts[product],
      feedbackCount: feedbackCounts[product],
      usageSessions,
      usageSeconds,
      averageUsageSeconds: usageSessions ? Math.round(usageSeconds / usageSessions) : 0,
    }
  })

  const totals = products.reduce(
    (acc, product) => {
      acc.waitlistEntries += product.waitlistEntries
      acc.activatedUsers += product.activatedUsers
      acc.feedbackCount += product.feedbackCount
      acc.usageSeconds += product.usageSeconds
      acc.usageSessions += product.usageSessions
      return acc
    },
    { waitlistEntries: 0, activatedUsers: 0, feedbackCount: 0, usageSeconds: 0, usageSessions: 0 },
  )

  const landingViews = Number(landingViewRows?.[0]?.count || 0)
  const landingScrolled = Number(landingScrolledRows?.[0]?.count || 0)
  const landingScrollRate = pct(landingScrolled, landingViews)
  const landingWaitlistConversionRate = pct(totals.waitlistEntries, landingViews)
  const averageUsageSeconds = totals.usageSessions ? Math.round(totals.usageSeconds / totals.usageSessions) : 0

  const trendMap = new Map<string, { date: string; views: number; scrolled: number; waitlistEntries: number }>()
  const firstDay = startOfUtcDay(periodStart)
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(firstDay.getTime() + i * DAY_MS).toISOString().slice(0, 10)
    trendMap.set(date, { date, views: 0, scrolled: 0, waitlistEntries: 0 })
  }

  for (const row of landingTrendRows) {
    const date = normalizeDateKey(row?._id?.date)
    const item = date ? trendMap.get(date) : null
    if (!item) continue
    if (row._id.type === 'view') item.views = Number(row.count || 0)
    if (row._id.type === 'scrolled') item.scrolled = Number(row.count || 0)
  }

  for (const row of waitlistTrendRows) {
    const date = normalizeDateKey(row?._id)
    const item = date ? trendMap.get(date) : null
    if (item) item.waitlistEntries = Number(row.count || 0)
  }

  const smartGoals: SmartGoal[] = [
    {
      label: 'Waitlist growth',
      target: '>= 10 neue Einträge/Woche',
      actual: `${totals.waitlistEntries}`,
      met: totals.waitlistEntries >= 10,
    },
    {
      label: 'Invite activation',
      target: '>= 35% der neuen Waitlist-Einträge aktivieren',
      actual: `${pct(totals.activatedUsers, Math.max(1, totals.waitlistEntries))}%`,
      met: pct(totals.activatedUsers, Math.max(1, totals.waitlistEntries)) >= 35,
    },
    {
      label: 'Product usage',
      target: '>= 20 Minuten durchschnittliche Nutzdauer',
      actual: formatSeconds(averageUsageSeconds),
      met: averageUsageSeconds >= 20 * 60,
    },
    {
      label: 'Feedback loop',
      target: '>= 3 Feedbacks/Woche',
      actual: `${totals.feedbackCount}`,
      met: totals.feedbackCount >= 3,
    },
    {
      label: 'Landing engagement',
      target: '>= 45% Scrollrate und >= 5% Waitlist-Conversion',
      actual: `${landingScrollRate}% Scroll / ${landingWaitlistConversionRate}% Waitlist`,
      met: landingScrollRate >= 45 && landingWaitlistConversionRate >= 5,
    },
  ]

  return {
    generatedAt: now.toISOString(),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    totals: {
      waitlistEntries: totals.waitlistEntries,
      activatedUsers: totals.activatedUsers,
      feedbackCount: totals.feedbackCount,
      landingViews,
      landingScrolled,
      landingScrollRate,
      landingWaitlistConversionRate,
      usageSeconds: totals.usageSeconds,
      averageUsageSeconds,
    },
    products,
    smartGoals,
    landingTrend: Array.from(trendMap.values()),
    feedback: feedbackDocs.map((doc: any) => ({
      product: doc.product === 'liveatc' ? 'liveatc' : 'classroom',
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : now.toISOString(),
      excitement: Number(doc.excitement || 0),
      from: doc.name || doc.email || doc.discordHandle || 'anonymous',
      summary: pickFeedbackSummary(doc),
    })),
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderWeeklyKpiText(report: WeeklyKpiReport) {
  const lines = [
    `OpenSquawk KPI Report (${report.periodStart.slice(0, 10)} - ${report.periodEnd.slice(0, 10)})`,
    '',
    `Waitlist: ${report.totals.waitlistEntries}`,
    `Neue User durch genutzte Invitations: ${report.totals.activatedUsers}`,
    `Durchschnittliche Nutzdauer: ${formatSeconds(report.totals.averageUsageSeconds)}`,
    `Feedback: ${report.totals.feedbackCount}`,
    `Landing Views: ${report.totals.landingViews}`,
    `Scrollrate: ${report.totals.landingScrollRate}%`,
    `Waitlist Conversion: ${report.totals.landingWaitlistConversionRate}%`,
    '',
    'SMART Ziele:',
    ...report.smartGoals.map((goal) => `- ${goal.met ? 'OK' : 'Off track'} ${goal.label}: ${goal.actual} (Ziel: ${goal.target})`),
    '',
    'Produkte:',
    ...report.products.map((product) => `- ${product.product}: Waitlist ${product.waitlistEntries}, User ${product.activatedUsers}, Nutzung ${formatSeconds(product.averageUsageSeconds)} avg, Feedback ${product.feedbackCount}`),
    '',
    'Feedback:',
    ...report.feedback.map((item) => `- ${item.product} ${item.excitement}/5 ${item.from}: ${item.summary}`),
  ]

  return lines.join('\n')
}

export function renderWeeklyKpiEmail(report: WeeklyKpiReport) {
  const goalRows = report.smartGoals
    .map((goal) => `
      <tr>
        <td>${escapeHtml(goal.label)}</td>
        <td>${escapeHtml(goal.target)}</td>
        <td><strong>${escapeHtml(goal.actual)}</strong></td>
        <td><span class="pill ${goal.met ? 'ok' : 'warn'}">${goal.met ? 'On track' : 'Off track'}</span></td>
      </tr>`)
    .join('')

  const productRows = report.products
    .map((product) => `
      <tr>
        <td><strong>${escapeHtml(product.product === 'classroom' ? '1. Classroom' : '2. LiveATC')}</strong></td>
        <td>${product.waitlistEntries}</td>
        <td>${product.activatedUsers}</td>
        <td>${formatSeconds(product.averageUsageSeconds)}</td>
        <td>${product.feedbackCount}</td>
      </tr>`)
    .join('')

  const trendRows = report.landingTrend
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.date)}</td>
        <td>${item.views}</td>
        <td>${item.scrolled}</td>
        <td>${item.waitlistEntries}</td>
      </tr>`)
    .join('')

  const feedbackRows = report.feedback.length
    ? report.feedback.map((item) => `
      <tr>
        <td>${escapeHtml(item.product)}</td>
        <td>${escapeHtml(item.createdAt.slice(0, 10))}</td>
        <td>${item.excitement}/5</td>
        <td>${escapeHtml(item.from)}</td>
        <td>${escapeHtml(item.summary)}</td>
      </tr>`).join('')
    : '<tr><td colspan="5">Kein neues gespeichertes Feedback in diesem Zeitraum.</td></tr>'

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; background: #0b1020; color: #e5f7ff; font-family: Arial, sans-serif; }
    .wrap { max-width: 920px; margin: 0 auto; padding: 28px 18px; }
    .panel { background: #0a0f1c; border: 1px solid rgba(255,255,255,.12); border-radius: 18px; overflow: hidden; }
    .hero { padding: 30px; background: linear-gradient(135deg, rgba(34,211,238,.18), rgba(14,165,233,.08)); }
    h1 { margin: 0; font-size: 28px; line-height: 1.2; color: #ffffff; }
    h2 { margin: 30px 0 12px; font-size: 18px; color: #ffffff; }
    .muted { color: rgba(229,247,255,.72); }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 20px 30px 6px; }
    .card { border: 1px solid rgba(255,255,255,.10); border-radius: 14px; padding: 14px; background: rgba(255,255,255,.04); }
    .value { display: block; margin-top: 8px; font-size: 24px; font-weight: 700; color: #67e8f9; }
    .content { padding: 0 30px 30px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,.10); text-align: left; vertical-align: top; font-size: 13px; }
    th { color: rgba(229,247,255,.68); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
    .pill { display: inline-block; border-radius: 999px; padding: 4px 9px; font-size: 12px; font-weight: 700; }
    .pill.ok { background: rgba(34,197,94,.18); color: #86efac; }
    .pill.warn { background: rgba(245,158,11,.18); color: #fcd34d; }
    @media (max-width: 720px) { .grid { grid-template-columns: repeat(2, 1fr); } .hero, .content, .grid { padding-left: 18px; padding-right: 18px; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="panel">
      <div class="hero">
        <p class="muted">OpenSquawk KPI Report</p>
        <h1>${escapeHtml(report.periodStart.slice(0, 10))} bis ${escapeHtml(report.periodEnd.slice(0, 10))}</h1>
      </div>
      <div class="grid">
        <div class="card"><span class="muted">Waitlist</span><span class="value">${report.totals.waitlistEntries}</span></div>
        <div class="card"><span class="muted">Neue User</span><span class="value">${report.totals.activatedUsers}</span></div>
        <div class="card"><span class="muted">Nutzung Ø</span><span class="value">${formatSeconds(report.totals.averageUsageSeconds)}</span></div>
        <div class="card"><span class="muted">Feedback</span><span class="value">${report.totals.feedbackCount}</span></div>
        <div class="card"><span class="muted">Landing Views</span><span class="value">${report.totals.landingViews}</span></div>
        <div class="card"><span class="muted">Scrollrate</span><span class="value">${report.totals.landingScrollRate}%</span></div>
        <div class="card"><span class="muted">Waitlist Conv.</span><span class="value">${report.totals.landingWaitlistConversionRate}%</span></div>
        <div class="card"><span class="muted">Gesamtzeit</span><span class="value">${formatSeconds(report.totals.usageSeconds)}</span></div>
      </div>
      <div class="content">
        <h2>SMART Ziele</h2>
        <table><thead><tr><th>KPI</th><th>Ziel</th><th>Ist</th><th>Status</th></tr></thead><tbody>${goalRows}</tbody></table>
        <h2>Produkte</h2>
        <table><thead><tr><th>Produkt</th><th>Waitlist</th><th>Neue User</th><th>Nutzung Ø</th><th>Feedback</th></tr></thead><tbody>${productRows}</tbody></table>
        <h2>Landing Verlauf</h2>
        <table><thead><tr><th>Datum</th><th>Views</th><th>Scrolled</th><th>Waitlist</th></tr></thead><tbody>${trendRows}</tbody></table>
        <h2>Feedback</h2>
        <table><thead><tr><th>Produkt</th><th>Datum</th><th>Rating</th><th>Von</th><th>Inhalt</th></tr></thead><tbody>${feedbackRows}</tbody></table>
      </div>
    </div>
  </div>
</body>
</html>`
}
