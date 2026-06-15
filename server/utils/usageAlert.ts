import { UsageAlertDelivery } from '../models/UsageAlertDelivery'
import { sendMail } from './notifications'
import { getRollingCostUsd, summarizeUsage } from './usage'

const DEFAULT_THRESHOLD_USD = 5
const DEFAULT_RECIPIENT = 'opensquawk-kpi@faktorxmensch.com'

function getThresholdUsd() {
  const parsed = Number.parseFloat(process.env.USAGE_ALERT_USD || '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_THRESHOLD_USD
}

/**
 * Sends an alert mail when the rolling 30-day AI cost crosses the threshold
 * (USAGE_ALERT_USD, default $5). At most one alert per calendar month.
 * Designed to be called from cron endpoints — never throws.
 */
export async function maybeSendUsageQuotaAlert(now = new Date()) {
  try {
    const thresholdUsd = getThresholdUsd()
    const costUsd = await getRollingCostUsd(30, now)

    if (costUsd < thresholdUsd) {
      return { sent: false, costUsd, thresholdUsd }
    }

    const monthKey = now.toISOString().slice(0, 7)
    const alreadySent = await UsageAlertDelivery.exists({ monthKey })
    if (alreadySent) {
      return { sent: false, skipped: 'already-sent', costUsd, thresholdUsd }
    }

    const recipient = process.env.KPI_EMAIL_TO || DEFAULT_RECIPIENT
    const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const summary = await summarizeUsage(periodStart, now)

    const topUsers = summary.topUsers.length
      ? summary.topUsers.map((u) => `- ${u.email}: $${u.costUsd.toFixed(4)} (${u.events} Requests)`).join('\n')
      : '- keine User zugeordnet'

    const text = [
      `Die geschätzten AI-Kosten der letzten 30 Tage liegen bei $${costUsd.toFixed(4)} und haben die Schwelle von $${thresholdUsd.toFixed(2)} überschritten.`,
      '',
      `STT: ${Math.round(summary.sttSeconds / 60)} Minuten Audio ($${summary.byKind.stt.costUsd.toFixed(4)})`,
      `TTS: ${summary.ttsCharacters} Zeichen ($${summary.byKind.tts.costUsd.toFixed(4)})`,
      `LLM: ${summary.llmInputTokens} in / ${summary.llmOutputTokens} out Tokens ($${summary.byKind.llm.costUsd.toFixed(4)})`,
      '',
      'Top User nach Kosten:',
      topUsers,
      '',
      'Es wird maximal eine Warnung pro Kalendermonat verschickt.',
    ].join('\n')

    const mailAccepted = await sendMail({
      to: recipient,
      subject: `OpenSquawk Kosten-Alarm: $${costUsd.toFixed(2)} in 30 Tagen (Schwelle $${thresholdUsd.toFixed(2)})`,
      text,
    })

    await UsageAlertDelivery.create({
      monthKey,
      thresholdUsd,
      costUsd,
      recipient,
      sentAt: now,
    })

    return { sent: true, mailAccepted, costUsd, thresholdUsd }
  } catch (error) {
    console.warn('[usage-alert] Quota alert check failed', error)
    return { sent: false, error: String(error) }
  }
}
