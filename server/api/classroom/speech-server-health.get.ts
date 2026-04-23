import { defineEventHandler } from 'h3'
import { requireUserSession } from '../../utils/auth'
import { getServerRuntimeConfig } from '../../utils/runtimeConfig'

type SpeechServerHealth = {
  configured: boolean
  reachable: boolean
}

function buildHealthUrls(baseUrl: string): string[] {
  const trimmed = baseUrl.replace(/\/+$/, '')
  return [
    `${trimmed}/health`,
    `${trimmed}/v1/models`,
    trimmed,
  ]
}

async function canReach(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2500)

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    })
    return response.status < 500
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export default defineEventHandler(async (event): Promise<SpeechServerHealth> => {
  await requireUserSession(event)

  const { speachesBaseUrl } = getServerRuntimeConfig()
  if (!speachesBaseUrl) {
    return {
      configured: false,
      reachable: false,
    }
  }

  const results = await Promise.all(buildHealthUrls(speachesBaseUrl).map(url => canReach(url)))

  return {
    configured: true,
    reachable: results.some(Boolean),
  }
})
