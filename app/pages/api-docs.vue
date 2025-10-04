<template>
  <div class="min-h-screen bg-[#0b1020] text-white py-12 px-6">
    <div class="mx-auto max-w-5xl space-y-12">
      <header class="space-y-4">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" /> Back to landing page
        </NuxtLink>
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Developer</p>
          <h1 class="text-3xl font-semibold">OpenSquawk API reference</h1>
          <p class="text-white/70">All endpoints speak JSON over HTTPS. Unless otherwise stated, successful responses follow the
            shape <code class="bg-white/10 px-1">{ "success": true }</code> and failures raise an error object with
            <code class="bg-white/10 px-1">statusCode</code> and <code class="bg-white/10 px-1">statusMessage</code>.</p>
        </div>
        <div class="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 md:grid-cols-2">
          <div>
            <h2 class="mb-2 text-lg font-semibold text-white">Authentication</h2>
            <p>Login returns a short-lived access token and sets an HTTP-only refresh cookie. Send the access token on
              protected routes via <code class="bg-white/10 px-1">Authorization: Bearer &lt;token&gt;</code>. Refresh the token by
              calling <code class="bg-white/10 px-1">POST /api/service/auth/refresh</code> with the refresh cookie present.</p>
          </div>
          <div>
            <h2 class="mb-2 text-lg font-semibold text-white">Base URLs</h2>
            <ul class="list-disc space-y-1 pl-5">
              <li>Production: <code class="bg-white/10 px-1">https://app.opensquawk.com</code></li>
              <li>Local development: <code class="bg-white/10 px-1">http://localhost:3000</code></li>
            </ul>
          </div>
        </div>
      </header>

      <section class="space-y-6">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-2xl font-semibold">Endpoint catalogue</h2>
          <span class="text-xs uppercase tracking-[0.3em] text-white/40">Live alpha</span>
        </div>
        <p class="text-sm text-white/60">Endpoints are grouped by audience. Public endpoints do not require a bearer token. Protected
          endpoints require a valid access token. Rate limits and additional business rules are documented per route.</p>

        <div class="space-y-10">
          <div v-for="section in endpointSections" :key="section.title" class="space-y-6">
            <div>
              <h3 class="text-xl font-semibold text-white">{{ section.title }}</h3>
              <p v-if="section.description" class="text-sm text-white/60">{{ section.description }}</p>
            </div>

            <div class="space-y-5">
              <article v-for="endpoint in section.endpoints" :key="`${endpoint.method}-${endpoint.path}`"
                class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div class="space-y-1">
                    <div class="flex items-center gap-3">
                      <span :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', methodColor(endpoint.method)]">
                        {{ endpoint.method }}
                      </span>
                      <code class="rounded bg-black/50 px-2 py-1 text-sm font-mono text-cyan-200">{{ endpoint.path }}</code>
                    </div>
                    <p class="text-sm text-white/70">{{ endpoint.summary }}</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 text-xs text-white/60">
                    <span v-if="endpoint.auth === 'protected'" class="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
                      <v-icon icon="mdi-lock" size="14" /> Access token required
                    </span>
                    <span v-else class="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
                      <v-icon icon="mdi-earth" size="14" /> Public
                    </span>
                    <span v-if="endpoint.rateLimit" class="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
                      <v-icon icon="mdi-timer-outline" size="14" /> {{ endpoint.rateLimit }}
                    </span>
                  </div>
                </header>

                <div v-if="endpoint.query?.length" class="space-y-2">
                  <h4 class="text-sm font-semibold text-white">Query parameters</h4>
                  <dl class="grid gap-2 text-sm text-white/70 sm:grid-cols-2">
                    <div v-for="param in endpoint.query" :key="param.name"
                      class="rounded-xl border border-white/10 bg-black/30 p-3">
                      <dt class="font-medium text-white">{{ param.name }}<span v-if="param.required"
                          class="text-cyan-300">*</span></dt>
                      <dd class="text-xs uppercase tracking-wide text-white/40">{{ param.type }}</dd>
                      <p class="mt-1 text-sm text-white/70">{{ param.description }}</p>
                    </div>
                  </dl>
                </div>

                <div v-if="endpoint.body?.length" class="space-y-2">
                  <h4 class="text-sm font-semibold text-white">Request body</h4>
                  <dl class="grid gap-2 text-sm text-white/70 sm:grid-cols-2">
                    <div v-for="field in endpoint.body" :key="field.name"
                      class="rounded-xl border border-white/10 bg-black/30 p-3">
                      <dt class="font-medium text-white">{{ field.name }}<span v-if="field.required"
                          class="text-cyan-300">*</span></dt>
                      <dd class="text-xs uppercase tracking-wide text-white/40">{{ field.type }}</dd>
                      <p class="mt-1 text-sm text-white/70">{{ field.description }}</p>
                    </div>
                  </dl>
                </div>

                <div v-if="endpoint.sampleRequest" class="space-y-2">
                  <h4 class="text-sm font-semibold text-white">Sample request</h4>
                  <pre class="overflow-x-auto rounded-xl bg-black/60 p-4 text-xs leading-5 text-white/80"><code>{{ endpoint.sampleRequest }}</code></pre>
                </div>

                <div v-if="endpoint.sampleResponse" class="space-y-2">
                  <h4 class="text-sm font-semibold text-white">Sample response</h4>
                  <pre class="overflow-x-auto rounded-xl bg-black/60 p-4 text-xs leading-5 text-white/80"><code>{{ endpoint.sampleResponse }}</code></pre>
                </div>

                <p v-if="endpoint.notes" class="text-sm text-white/60">{{ endpoint.notes }}</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Errors</h2>
        <p class="text-sm text-white/70">Errors follow the Nitro <code class="bg-white/10 px-1">createError</code> payload. The
          <code class="bg-white/10 px-1">statusMessage</code> describes the failure reason. Additional diagnostic data may be
          returned in <code class="bg-white/10 px-1">data</code> for some endpoints.</p>
        <pre class="overflow-x-auto rounded-xl bg-black/60 p-4 text-xs leading-5 text-white/80"><code>{
  "statusCode": 401,
  "statusMessage": "Authentication required"
}</code></pre>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
type AuthLevel = 'public' | 'protected'

interface QueryField {
  name: string
  type: string
  required?: boolean
  description: string
}

interface BodyField {
  name: string
  type: string
  required?: boolean
  description: string
}

interface EndpointEntry {
  method: string
  path: string
  summary: string
  auth: AuthLevel
  rateLimit?: string
  query?: QueryField[]
  body?: BodyField[]
  sampleRequest?: string
  sampleResponse?: string
  notes?: string
}

interface EndpointSection {
  title: string
  description?: string
  endpoints: EndpointEntry[]
}

const endpointSections: EndpointSection[] = [
  {
    title: 'Public endpoints',
    description: 'Open to everyone – no authentication required. Consent requirements are enforced per request.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/service/waitlist',
        summary: 'Join the waitlist and optionally opt-in to product updates.',
        auth: 'public',
        body: [
          { name: 'email', type: 'string', required: true, description: 'Contact email address. Used to deduplicate entries.' },
          { name: 'name', type: 'string', description: 'Optional display name.' },
          { name: 'notes', type: 'string', description: 'Free-form context or aircraft preference (stored for the team).' },
          { name: 'source', type: 'string', description: 'Tracking label. Defaults to "landing" if omitted.' },
          { name: 'consentPrivacy', type: 'boolean', required: true, description: 'Must be true to store the submission.' },
          { name: 'consentTerms', type: 'boolean', required: true, description: 'Must be true to join the waitlist.' },
          { name: 'wantsProductUpdates', type: 'boolean', description: 'Set true to subscribe to the newsletter.' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/service/waitlist \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "jane.pilot@example.com",
    "name": "Jane Pilot",
    "consentPrivacy": true,
    "consentTerms": true,
    "wantsProductUpdates": true
  }'`,
        sampleResponse: `{
  "success": true,
  "alreadyJoined": false,
  "joinedAt": "2024-04-12T18:52:04.512Z"
}`,
        notes: 'Submitting the same email again updates stored metadata and opt-in flags.',
      },
      {
        method: 'GET',
        path: '/api/service/waitlist',
        summary: 'Returns anonymised waitlist metrics for marketing use.',
        auth: 'public',
        sampleResponse: `{
  "count": 87,
  "displayCount": 132,
  "syntheticBoost": 45,
  "recent7Days": 11,
  "recent30Days": 42,
  "lastJoinedAt": "2024-04-12T18:52:04.512Z",
  "generatedAt": "2024-04-12T18:52:05.013Z"
}`,
        notes: 'displayCount includes a synthetic boost for consistent marketing numbers.',
      },
      {
        method: 'POST',
        path: '/api/service/updates',
        summary: 'Subscribe to product updates with explicit marketing consent.',
        auth: 'public',
        body: [
          { name: 'email', type: 'string', required: true, description: 'Subscriber email address.' },
          { name: 'name', type: 'string', description: 'Optional contact name.' },
          { name: 'source', type: 'string', description: 'Attribution label. Defaults to "landing-updates".' },
          { name: 'consentPrivacy', type: 'boolean', required: true, description: 'Must be true to store the subscriber.' },
          { name: 'consentMarketing', type: 'boolean', required: true, description: 'Required to receive email updates.' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/service/updates \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "avgeek@example.com",
    "name": "Ava VGeek",
    "consentPrivacy": true,
    "consentMarketing": true
  }'`,
        sampleResponse: `{
  "success": true,
  "alreadySubscribed": false
}`,
      },
      {
        method: 'GET',
        path: '/api/service/roadmap',
        summary: 'Fetches the public roadmap including aggregated community votes.',
        auth: 'public',
        sampleResponse: `{
  "items": [
    {
      "key": "contextual-briefings",
      "title": "Contextual mission briefings",
      "category": "training",
      "votes": 42,
      "averageImportance": 4.6,
      "scorePercent": 92,
      "lastVoteAt": "2024-04-10T15:04:12.144Z"
    }
  ],
  "totalVotes": 123,
  "recentVotes7Days": 9,
  "generatedAt": "2024-04-12T18:52:05.013Z"
}`,
        notes: 'Items are sorted by total votes, then average importance, then title.',
      },
      {
        method: 'POST',
        path: '/api/service/roadmap',
        summary: 'Submit 1–5 importance votes for roadmap entries.',
        auth: 'public',
        rateLimit: 'Max 1 payload / 10 s per IP',
        body: [
          { name: 'votes', type: 'Array<{ key: string; importance: 1..5 }>', required: true, description: 'Unique roadmap item keys with rating per submission.' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/service/roadmap \
  -H 'Content-Type: application/json' \
  -d '{
    "votes": [
      { "key": "contextual-briefings", "importance": 5 },
      { "key": "phraseology-checks", "importance": 4 }
    ]
  }'`,
        sampleResponse: `{
  "success": true,
  "saved": 2
}`,
        notes: 'Votes are deduplicated per submission using an IP and user-agent hash.',
      },
      {
        method: 'POST',
        path: '/api/service/roadmap-suggestions',
        summary: 'Send roadmap ideas to the OpenSquawk team.',
        auth: 'public',
        body: [
          { name: 'title', type: 'string', required: true, description: 'At least 4 characters.' },
          { name: 'details', type: 'string', required: true, description: 'At least 20 characters describing the idea.' },
          { name: 'email', type: 'string', description: 'Optional reply-to address.' },
          { name: 'allowContact', type: 'boolean', description: 'Enable follow-up via the provided email. Requires email.' },
          { name: 'consentPrivacy', type: 'boolean', required: true, description: 'Must be true to store the suggestion.' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/service/roadmap-suggestions \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "More IFR lessons",
    "details": "Please add a flow that focuses on complex IFR clearances at busy hubs.",
    "email": "pilot@example.com",
    "allowContact": true,
    "consentPrivacy": true
  }'`,
        sampleResponse: `{
  "success": true,
  "suggestionId": "6625c9f0e1f8f5d4068a1234"
}`,
      },
      {
        method: 'POST',
        path: '/api/service/auth/login',
        summary: 'Authenticate with email and password. Returns an access token and sets a refresh cookie.',
        auth: 'public',
        body: [
          { name: 'email', type: 'string', required: true, description: 'User email address.' },
          { name: 'password', type: 'string', required: true, description: 'User password.' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/service/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "jane.pilot@example.com",
    "password": "Supersafe!123"
  }'`,
        sampleResponse: `{
  "success": true,
  "accessToken": "<jwt>",
  "user": {
    "id": "661e2a...",
    "email": "jane.pilot@example.com",
    "name": "Jane Pilot",
    "role": "pilot",
    "createdAt": "2024-03-27T19:01:26.120Z"
  }
}`,
      },
      {
        method: 'POST',
        path: '/api/service/auth/register',
        summary: 'Register a new account using an invitation code.',
        auth: 'public',
        body: [
          { name: 'email', type: 'string', required: true, description: 'Valid email address. Stored in lower case.' },
          { name: 'password', type: 'string', required: true, description: 'Must pass strength validation (>= 8 characters, numbers, etc.).' },
          { name: 'name', type: 'string', description: 'Optional pilot name shown in the app.' },
          { name: 'invitationCode', type: 'string', required: true, description: 'Invitations are uppercase, 8 characters.' },
          { name: 'acceptTerms', type: 'boolean', required: true, description: 'Must be true.' },
          { name: 'acceptPrivacy', type: 'boolean', required: true, description: 'Must be true.' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/service/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "jane.pilot@example.com",
    "password": "Supersafe!123",
    "invitationCode": "AB12CD34",
    "acceptTerms": true,
    "acceptPrivacy": true
  }'`,
        sampleResponse: `{
  "success": true,
  "accessToken": "<jwt>",
  "user": {
    "id": "661e2a...",
    "email": "jane.pilot@example.com",
    "name": "Jane Pilot",
    "role": "pilot",
    "createdAt": "2024-03-27T19:01:26.120Z"
  }
}`,
        notes: 'The invitation code is marked as used and the waitlist entry (if any) is activated.',
      },
      {
        method: 'POST',
        path: '/api/service/auth/refresh',
        summary: 'Rotate the refresh token and receive a new access token.',
        auth: 'public',
        notes: 'Requires a valid refresh cookie from a prior login or registration response.',
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/service/auth/refresh \
  --cookie 'refreshToken=<http-only-cookie>'`,
        sampleResponse: `{
  "success": true,
  "accessToken": "<jwt>"
}`,
      },
      {
        method: 'POST',
        path: '/api/service/auth/forgot-password',
        summary: 'Send a password reset link if the email exists.',
        auth: 'public',
        body: [
          { name: 'email', type: 'string', required: true, description: 'Email address tied to the account.' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/service/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{ "email": "jane.pilot@example.com" }'`,
        sampleResponse: `{
  "success": true
}`,
        notes: 'Returns success even if the email is not registered to avoid account discovery.',
      },
      {
        method: 'POST',
        path: '/api/service/auth/reset-password',
        summary: 'Complete a password reset using the emailed token.',
        auth: 'public',
        body: [
          { name: 'token', type: 'string', required: true, description: 'Token received via the reset email.' },
          { name: 'password', type: 'string', required: true, description: 'New password (minimum 8 characters).' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/service/auth/reset-password \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "6a1b...",
    "password": "NewSecret!456"
  }'`,
        sampleResponse: `{
  "success": true
}`,
      },
      {
        method: 'GET',
        path: '/api/service/invitations/{code}',
        summary: 'Validate an invitation code before registration.',
        auth: 'public',
        notes: 'Returns { valid: false, reason?: "used" | "expired" } when unusable.',
        sampleResponse: `{
  "valid": true,
  "code": "AB12CD34",
  "createdAt": "2024-03-20T08:15:30.000Z",
  "expiresAt": "2024-04-19T08:15:30.000Z"
}`,
      },
      {
        method: 'POST',
        path: '/api/service/invitations/bootstrap',
        summary: 'Issue a bootstrap invitation code during the onboarding window.',
        auth: 'public',
        body: [
          { name: 'label', type: 'string', description: 'Optional tag that is stored with the invitation.' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/service/invitations/bootstrap \
  -H 'Content-Type: application/json' \
  -d '{ "label": "sim-club" }'`,
        sampleResponse: `{
  "success": true,
  "code": "C8FA2B1E",
  "expiresAt": "2025-10-01T00:00:00.000Z",
  "label": "sim-club"
}`,
        notes: 'Fails with HTTP 403 once the bootstrap window closes.',
      },
      {
        method: 'POST',
        path: '/api/service/invitations/manual',
        summary: 'Create an invitation with a shared password (internal tooling).',
        auth: 'public',
        body: [
          { name: 'password', type: 'string', required: true, description: 'Shared secret defined in runtime config.' },
          { name: 'label', type: 'string', description: 'Optional label to track the invite origin.' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/service/invitations/manual \
  -H 'Content-Type: application/json' \
  -d '{
    "password": "<shared-secret>",
    "label": "press"
  }'`,
        sampleResponse: `{
  "success": true,
  "code": "7E19A4C3",
  "expiresAt": "2024-05-12T13:54:21.000Z",
  "label": "press"
}`,
      },
      {
        method: 'GET',
        path: '/api/service/tools/latency',
        summary: 'Run a lightweight latency check against the configured LLM model.',
        auth: 'public',
        sampleResponse: `{
  "result": 1,
  "raw": "1",
  "latency_ms": 842
}`,
        notes: 'Reports 0/1/2 depending on how the model evaluates a fixed readback prompt.',
      },
      {
        method: 'GET',
        path: '/api/service/tools/taxiroute',
        summary: 'Compute a taxi route between two coordinates using OpenStreetMap data.',
        auth: 'public',
        query: [
          { name: 'origin_lat', type: 'number', required: true, description: 'Origin latitude in decimal degrees.' },
          { name: 'origin_lng', type: 'number', required: true, description: 'Origin longitude in decimal degrees.' },
          { name: 'dest_lat', type: 'number', required: true, description: 'Destination latitude in decimal degrees.' },
          { name: 'dest_lng', type: 'number', required: true, description: 'Destination longitude in decimal degrees.' },
          { name: 'radius', type: 'number', description: 'Search radius in metres (default 2000).' },
        ],
        sampleRequest: `curl "https://app.opensquawk.com/api/service/tools/taxiroute?origin_lat=50.0506&origin_lng=8.5708&dest_lat=50.0473&dest_lng=8.5610&radius=2500"`,
        sampleResponse: `{
  "origin": { "lat": 50.0506, "lon": 8.5708 },
  "dest": { "lat": 50.0473, "lon": 8.561 },
  "route": {
    "node_ids": [1234567890, 1234567990, 1234568021],
    "total_distance_m": 1580.3
  },
  "names": ["L7", "L", "N"]
}`,
        notes: 'Returns null route when no taxiway network is available in the search area.',
      },
    ],
  },
  {
    title: 'Protected endpoints',
    description: 'Require a valid bearer token obtained from the authentication flow.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/auth/me',
        summary: 'Retrieve the authenticated user profile.',
        auth: 'protected',
        sampleResponse: `{
  "id": "661e2a...",
  "email": "jane.pilot@example.com",
  "name": "Jane Pilot",
  "role": "pilot",
  "createdAt": "2024-03-27T19:01:26.120Z",
  "lastLoginAt": "2024-04-12T17:30:11.911Z",
  "invitationCodesIssued": 1
}`,
      },
      {
        method: 'POST',
        path: '/api/auth/logout',
        summary: 'Invalidate the active session and clear refresh cookies.',
        auth: 'protected',
        sampleResponse: `{
  "success": true
}`,
      },
      {
        method: 'GET',
        path: '/api/auth/invitations',
        summary: 'List invitation codes previously generated by the user.',
        auth: 'protected',
        sampleResponse: `[
  {
    "code": "AB12CD34",
    "createdAt": "2024-03-30T09:00:00.000Z",
    "expiresAt": "2024-04-29T09:00:00.000Z",
    "usedAt": null,
    "usedBy": null
  }
]`,
      },
      {
        method: 'POST',
        path: '/api/auth/invitations',
        summary: 'Mint a new invitation code (14 day account age, max two active codes).',
        auth: 'protected',
        sampleResponse: `{
  "success": true,
  "code": "EE19F8A1",
  "expiresAt": "2024-05-12T13:54:21.000Z"
}`,
        notes: 'Returns HTTP 403 when the account is younger than 14 days or two unused codes already exist.',
      },
      {
        method: 'POST',
        path: '/api/atc/say',
        summary: 'Generate ATC audio using the configured TTS pipeline.',
        auth: 'protected',
        body: [
          { name: 'text', type: 'string', required: true, description: 'Clearance or transmission to synthesise.' },
          { name: 'level', type: 'number', description: 'Radio quality (1–5). Defaults to 4.' },
          { name: 'voice', type: 'string', description: 'Voice identifier. Falls back to runtime config.' },
          { name: 'speed', type: 'number', description: 'Speech speed multiplier (0.5 – 2.0).' },
          { name: 'moduleId', type: 'string', description: 'Optional training module reference.' },
          { name: 'lessonId', type: 'string', description: 'Optional lesson reference.' },
          { name: 'tag', type: 'string', description: 'Custom tag stored with the transmission log.' },
          { name: 'format', type: '"wav" | "mp3" | "flac" | "pcm" | "smallest"', description: 'Desired audio format. "smallest" resolves to MP3 when available.' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/atc/say \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Lufthansa 478 cleared to Frankfurt via NORDA1A...",
    "level": 4,
    "tag": "training"
  }'`,
        sampleResponse: `{
  "success": true,
  "id": "5b92d5d3-...",
  "audio": {
    "mime": "audio/wav",
    "base64": "UklGRlgAA...",
    "size": 81234,
    "ext": "wav"
  },
  "normalized": "Lufthansa four seven eight cleared ...",
  "radioQuality": "very good"
}`,
        notes: 'Audio is returned inline as base64 and logged to storage when persistence is enabled.',
      },
      {
        method: 'POST',
        path: '/api/atc/ptt',
        summary: 'Upload pilot audio, receive a Whisper transcription, and optionally trigger automatic decision logic.',
        auth: 'protected',
        body: [
          { name: 'audio', type: 'string (base64)', required: true, description: 'Encoded audio clip (<= 2 MB).' },
          { name: 'context', type: 'object', required: true, description: 'Decision context containing current state, candidate states, variables, and flags.' },
          { name: 'moduleId', type: 'string', required: true, description: 'Training module identifier.' },
          { name: 'lessonId', type: 'string', required: true, description: 'Lesson identifier for analytics.' },
          { name: 'format', type: '"wav" | "mp3" | "ogg" | "webm"', description: 'Audio encoding of the provided payload.' },
          { name: 'autoDecide', type: 'boolean', description: 'Defaults to true. Set false to skip decision routing.' },
        ],
        sampleResponse: `{
  "success": true,
  "transcription": "Lufthansa four seven eight ready for departure",
  "decision": {
    "next_state": "handoff",
    "controller_say_tpl": "Lufthansa 478 contact departure 120.8"
  }
}`,
        notes: 'Uses FFmpeg for format conversion when available and logs transmissions together with LLM traces.',
      },
      {
        method: 'POST',
        path: '/api/llm/decide',
        summary: 'Run the LLM router against the provided decision graph state.',
        auth: 'protected',
        body: [
          { name: 'state_id', type: 'string', required: true, description: 'Identifier of the current node in the flow.' },
          { name: 'candidates', type: 'Array', required: true, description: 'Candidate states for the router to choose from.' },
          { name: 'pilot_utterance', type: 'string', description: 'Recent transcription forwarded to the model.' },
          { name: 'variables', type: 'object', description: 'Arbitrary variables passed to the router.' },
          { name: 'flags', type: 'object', description: 'Boolean flags controlling heuristics.' },
        ],
        sampleRequest: `curl -X POST https://app.opensquawk.com/api/llm/decide \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "state_id": "vector-entry",
    "pilot_utterance": "ready for departure",
    "candidates": [ { "id": "handoff", "state": { "type": "handoff" } } ],
    "variables": { "runway": "25C" }
  }'`,
        sampleResponse: `{
  "next_state": "handoff",
  "controller_say_tpl": "Contact departure 120.8",
  "off_schema": false,
  "radio_check": false
}`,
        notes: 'Returns HTTP 500 when the router or downstream LLM fails.',
      },
    ],
  },
]

function methodColor(method: string) {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-emerald-500/20 text-emerald-200'
    case 'POST':
      return 'bg-cyan-500/20 text-cyan-200'
    case 'PUT':
      return 'bg-amber-500/20 text-amber-200'
    case 'DELETE':
      return 'bg-rose-500/20 text-rose-200'
    default:
      return 'bg-white/10 text-white'
  }
}
</script>
