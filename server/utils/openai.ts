// server/utils/openai.ts
import OpenAI from 'openai'
import {getServerRuntimeConfig} from './runtimeConfig'

let openaiClient: OpenAI | null = null

function ensureOpenAI(): OpenAI {
    if (!openaiClient) {
        const {openaiKey, openaiProject, openaiBaseUrl} = getServerRuntimeConfig()
        if (!openaiKey) {
            throw new Error('OPENAI_API_KEY is missing. Please set the key before using AI features.')
        }
        const clientOptions: ConstructorParameters<typeof OpenAI>[0] = {
            apiKey: openaiKey,
            defaultHeaders: { 'Connection': 'keep-alive' },
        }
        if (openaiProject) {
            clientOptions.project = openaiProject
        }
        if (openaiBaseUrl) {
            clientOptions.baseURL = openaiBaseUrl
        }
        openaiClient = new OpenAI(clientOptions)
    }
    return openaiClient
}

export function getOpenAIClient(): OpenAI {
    return ensureOpenAI()
}
