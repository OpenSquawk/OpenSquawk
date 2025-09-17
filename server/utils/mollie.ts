import { useRuntimeConfig } from '#imports'

interface MollieAmount {
  currency: string
  value: string
}

export interface MolliePaymentRequest {
  amount: MollieAmount
  description: string
  redirectUrl: string
  webhookUrl?: string
  customerId?: string
  sequenceType?: 'oneoff' | 'first' | 'recurring'
  metadata?: Record<string, any>
}

export interface MolliePaymentResponse {
  id: string
  status: string
  amount: MollieAmount
  description: string
  sequenceType: 'oneoff' | 'first' | 'recurring'
  customerId?: string
  mandateId?: string
  subscriptionId?: string
  metadata?: Record<string, any>
  nextPaymentDate?: string
  _links?: {
    checkout?: { href: string }
  }
}

export interface MollieCustomerResponse {
  id: string
  name?: string
  email?: string
}

export interface MollieSubscriptionRequest {
  amount: MollieAmount
  interval: string
  description: string
  metadata?: Record<string, any>
  startDate?: string
}

export interface MollieSubscriptionResponse {
  id: string
  amount: MollieAmount
  status: string
  description?: string
  interval: string
  nextPaymentDate?: string
  metadata?: Record<string, any>
}

function getMollieApiKey() {
  const config = useRuntimeConfig()
  const key = config.mollie?.apiKey as string | undefined
  if (!key) {
    throw new Error('MOLLIE_API_KEY nicht konfiguriert')
  }
  return key
}

async function mollieRequest<T>(path: string, init: RequestInit = {}) {
  const apiKey = getMollieApiKey()
  const response = await fetch(`https://api.mollie.com/v2${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers || {}),
    },
  })

  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText)
    throw new Error(`Mollie API error ${response.status}: ${details}`)
  }

  return (await response.json()) as T
}

export async function ensureMollieCustomer(payload: { name?: string; email?: string }, existingId?: string) {
  if (existingId) {
    return existingId
  }
  const customer = await mollieRequest<MollieCustomerResponse>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
    }),
  })
  return customer.id
}

export async function createMolliePayment(body: MolliePaymentRequest) {
  return await mollieRequest<MolliePaymentResponse>('/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getMolliePayment(id: string) {
  return await mollieRequest<MolliePaymentResponse>(`/payments/${id}`)
}

export async function createMollieSubscription(customerId: string, body: MollieSubscriptionRequest) {
  return await mollieRequest<MollieSubscriptionResponse>(`/customers/${customerId}/subscriptions`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function cancelMollieSubscription(customerId: string, subscriptionId: string) {
  await mollieRequest(`/customers/${customerId}/subscriptions/${subscriptionId}`, { method: 'DELETE' })
}

export function getMollieWebhookUrl() {
  const config = useRuntimeConfig()
  return (config.mollie?.webhookUrl as string | undefined) || undefined
}
