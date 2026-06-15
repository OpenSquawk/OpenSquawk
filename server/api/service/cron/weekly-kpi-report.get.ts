import { sendMail } from '../../../utils/notifications'
import { buildWeeklyKpiReport, renderWeeklyKpiEmail, renderWeeklyKpiText } from '../../../utils/kpiReport'
import { requireCronSecret } from '../../../utils/cron'
import { maybeSendUsageQuotaAlert } from '../../../utils/usageAlert'

const DEFAULT_KPI_RECIPIENT = 'opensquawk-kpi@faktorxmensch.com'

export default defineEventHandler(async (event) => {
  requireCronSecret(event)

  const report = await buildWeeklyKpiReport()
  const to = process.env.KPI_EMAIL_TO || DEFAULT_KPI_RECIPIENT
  const subject = `OpenSquawk KPI Report ${report.periodStart.slice(0, 10)} - ${report.periodEnd.slice(0, 10)}`

  const sent = await sendMail({
    to,
    subject,
    text: renderWeeklyKpiText(report),
    html: renderWeeklyKpiEmail(report),
  })

  const usageAlert = await maybeSendUsageQuotaAlert()

  return {
    success: true,
    sent,
    to,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    totals: report.totals,
    products: report.products,
    smartGoals: report.smartGoals,
    aiUsage: report.aiUsage,
    usageAlert,
  }
})
