import { createError, getQuery } from 'h3'
import { sendMail } from '../../../utils/notifications'
import { buildWeeklyKpiReport, renderWeeklyKpiEmail, renderWeeklyKpiText } from '../../../utils/kpiReport'

const DEFAULT_KPI_RECIPIENT = 'opensquawk-kpi@faktorxmensch.com'

export default defineEventHandler(async (event) => {
  const secret = process.env.KPI_CRON_SECRET?.trim()
  if (secret) {
    const query = getQuery(event)
    const provided = typeof query.secret === 'string' ? query.secret : ''
    if (provided !== secret) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid KPI cron secret.' })
    }
  }

  const report = await buildWeeklyKpiReport()
  const to = process.env.KPI_EMAIL_TO || DEFAULT_KPI_RECIPIENT
  const subject = `OpenSquawk KPI Report ${report.periodStart.slice(0, 10)} - ${report.periodEnd.slice(0, 10)}`

  const sent = await sendMail({
    to,
    subject,
    text: renderWeeklyKpiText(report),
    html: renderWeeklyKpiEmail(report),
  })

  return {
    success: true,
    sent,
    to,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    totals: report.totals,
    products: report.products,
    smartGoals: report.smartGoals,
  }
})
