<template>
  <div class="min-h-screen bg-[#0b1020] text-white py-12 px-6">
    <div class="mx-auto max-w-5xl space-y-10">
      <header class="space-y-3">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" /> Back to landing page
        </NuxtLink>
        <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Developer</p>
        <h1 class="text-3xl font-semibold">OpenSquawk API – documentation</h1>
        <p class="text-white/70">Alpha build – endpoints may change. All routes use JSON over HTTPS. Standard responses include <code class="bg-white/10 px-1">success</code> or an error object with <code class="bg-white/10 px-1">statusMessage</code>.</p>
      </header>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Authentication</h2>
        <p class="text-white/70">
          Successful login returns a JWT (bearer token) and sets an HTTP-only refresh cookie. All protected endpoints require the header <code class="bg-white/10 px-1">Authorization: Bearer &lt;token&gt;</code>. Access tokens expire after 15 minutes and can be refreshed via <code>/api/service/auth/refresh</code>.
        </p>
        <p class="text-white/70">Public endpoints live under <code class="bg-white/10 px-1">/api/service/*</code>.</p>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
        <h2 class="text-xl font-semibold">Public endpoints</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="uppercase tracking-[0.2em] text-white/50">
              <tr>
                <th class="px-3 py-2">Method</th>
                <th class="px-3 py-2">Path</th>
                <th class="px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              <tr v-for="row in publicEndpoints" :key="row.path">
                <td class="px-3 py-2 font-mono text-cyan-300">{{ row.method }}</td>
                <td class="px-3 py-2 font-mono">{{ row.path }}</td>
                <td class="px-3 py-2 text-white/70">{{ row.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
        <h2 class="text-xl font-semibold">Protected endpoints</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="uppercase tracking-[0.2em] text-white/50">
              <tr>
                <th class="px-3 py-2">Method</th>
                <th class="px-3 py-2">Path</th>
                <th class="px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              <tr v-for="row in protectedEndpoints" :key="row.path">
                <td class="px-3 py-2 font-mono text-cyan-300">{{ row.method }}</td>
                <td class="px-3 py-2 font-mono">{{ row.path }}</td>
                <td class="px-3 py-2 text-white/70">{{ row.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Response & error format</h2>
        <pre class="overflow-x-auto rounded-xl bg-black/60 p-4 text-sm text-white/80">
{
  "success": true,
  "data": { ... }
}

// Error
{
  "statusCode": 401,
  "statusMessage": "Authentication required"
}
        </pre>
        <p class="text-white/70">Additional fields such as <code class="bg-white/10 px-1">joinedAt</code> or <code class="bg-white/10 px-1">invitationStatus</code> are documented per response.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const publicEndpoints = [
  { method: 'POST', path: '/api/service/waitlist', description: 'Join the waitlist. Requires consent to terms and privacy policy.' },
  { method: 'GET', path: '/api/service/waitlist', description: 'Fetch aggregated waitlist metrics including totals, growth and buffer.' },
  { method: 'POST', path: '/api/service/updates', description: 'Subscribe to product updates and feature launches (consent required).' },
  { method: 'GET', path: '/api/service/roadmap', description: 'Retrieve roadmap items with community averages, total votes and last activity.' },
  { method: 'POST', path: '/api/service/roadmap', description: 'Submit importance ratings (1–5) for roadmap items; each vote is timestamped.' },
  { method: 'POST', path: '/api/service/roadmap-suggestions', description: 'Send a roadmap suggestion with optional contact details.' },
  { method: 'POST', path: '/api/service/auth/login', description: 'Login with email and password. Returns a JWT and sets a refresh cookie.' },
  { method: 'POST', path: '/api/service/auth/register', description: 'Register with an invitation code and mandatory consents.' },
  { method: 'POST', path: '/api/service/auth/refresh', description: 'Refresh the access token using the refresh cookie.' },
  { method: 'GET', path: '/api/service/invitations/{code}', description: 'Validate an invitation code (valid, expired, already used).' },
  { method: 'POST', path: '/api/service/invitations/bootstrap', description: 'Generate a bootstrap invitation code (active until 2024-07-01, optional label).' },
  { method: 'POST', path: '/api/service/invitations/manual', description: 'Create a manual invitation code via password-protected endpoint (internal).' },
]

const protectedEndpoints = [
  { method: 'GET', path: '/api/auth/me', description: 'Fetch the current user profile.' },
  { method: 'POST', path: '/api/auth/logout', description: 'Invalidate the active session and clear the refresh cookie.' },
  { method: 'GET', path: '/api/auth/invitations', description: 'List invitation codes generated by the current user.' },
  { method: 'POST', path: '/api/auth/invitations', description: 'Generate a new invitation code (available after 14 days, max 2).' },
  { method: 'POST', path: '/api/atc/say', description: 'Trigger ATC text-to-speech output with logging.' },
  { method: 'POST', path: '/api/atc/ptt', description: 'Process push-to-talk audio, transcribe it and store the log.' },
  { method: 'POST', path: '/api/llm/decide', description: 'Run LLM-powered decision logic for the current flight state.' },
  { method: 'GET', path: '/api/vatsim/flightplans', description: 'Retrieve filtered VATSIM flight plans for a CID.' },
]
</script>

