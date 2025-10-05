<template>
  <div class="min-h-screen bg-[#0b1020] text-white">
    <v-app-bar flat density="comfortable"
      class="sticky top-0 z-40 border-b border-white/10 bg-[#0b1020]/95 backdrop-blur">
      <div class="mx-auto flex w-full flex-col gap-4 px-6 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-14 xl:px-24">
        <div class="flex items-center gap-4 text-sm">
          <NuxtLink to="/"
            class="inline-flex items-center gap-2 rounded-full border border-transparent bg-white/5 px-4 py-2 text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-cyan-200">
            <v-icon icon="mdi-arrow-left" size="18" />
            Back
          </NuxtLink>
          <div class="flex text-center gap-4 items-center">
            <span class="text-lg font-semibold text-white">OpenSquawk API</span>
          </div>
        </div>
        <div class="flex w-full flex-1 items-center gap-3 sm:justify-end">
          <label class="relative w-full max-w-md">
            <span class="sr-only">Search endpoints</span>
            <span class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/40">
              <v-icon icon="mdi-magnify" size="18" />
            </span>
            <input ref="searchInputRef" v-model="searchTerm" type="search"
              placeholder="Search endpoints, descriptions, or keywords"
              class="w-full rounded-full border border-white/15 bg-black/40 py-2.5 pl-11 pr-12 text-sm text-white placeholder:text-white/35 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              @keydown.esc.prevent="clearSearch" />
            <button v-if="hasActiveSearch" type="button"
              class="absolute inset-y-1 right-2 inline-flex items-center justify-center rounded-full border border-transparent bg-white/10 px-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-white/20 hover:bg-white/20"
              @click="clearSearch">
              Clear
            </button>
          </label>
        </div>
      </div>
    </v-app-bar>

    <div class="mx-auto w-full px-6 pb-12 pt-24 lg:px-14 xl:px-24">
      <div class="grid gap-10 lg:grid-cols-[20rem,minmax(0,1fr)] xl:grid-cols-[22rem,minmax(0,1fr)]">
        <aside class="lg:sticky lg:top-[5.25rem] lg:h-[calc(100vh-7rem)] lg:self-start">
          <div class="flex h-full flex-col">
            <nav class="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <header class="border-b border-white/10 px-4 py-3">
                <h2 class="text-base font-semibold text-white">API Docs</h2>
                <p v-if="hasActiveSearch" class="mt-1 text-[11px] uppercase tracking-[0.3em] text-white/50">
                  {{ resultCount }} {{ resultCount === 1 ? 'match' : 'matches' }}
                </p>
              </header>
              <div class="flex max-h-full flex-col gap-6 overflow-y-auto px-4 py-4 text-sm text-white/70">
                <NuxtLink :to="`#${generalAnchor}`" class="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition"
                  :class="activeAnchor === generalAnchor
                    ? 'bg-cyan-500/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'"
                  @click="handleAnchorClick(generalAnchor)">
                  <span class="font-medium">About the API</span>
                  <span class="text-[10px] uppercase tracking-[0.25em] text-white/40">Overview</span>
                </NuxtLink>

                <template v-if="navigationSections.length">
                  <div v-for="navSection in navigationSections" :key="navSection.title" class="space-y-3">
<!--                    <p class="text-[11px] uppercase tracking-[0.3em] text-white/35">{{ navSection.title }}</p>-->
                    <div class="space-y-1.5">
                      <div v-for="group in navSection.groups" :key="group.title" class="space-y-1">
                        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{{ group.title }}</p>
                        <ul class="space-y-0.5">
                          <li v-for="endpoint in group.endpoints" :key="endpoint.anchor">
                            <NuxtLink :to="`#${endpoint.anchor}`"
                              class="block rounded-md px-3 py-1 text-left text-[13px] leading-snug transition"
                              :class="activeAnchor === endpoint.anchor
                                ? 'bg-cyan-500/20 text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'"
                              @click="handleAnchorClick(endpoint.anchor)">
                              <p class="font-medium">
                                <!-- icon if private or public -->
                                {{ endpoint.path.replace("/api/","") }}</p>
                            </NuxtLink>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </template>
                <p v-else class="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-xs text-white/50">
                  No matches for the current search.
                </p>
              </div>
            </nav>
          </div>
        </aside>

        <main class="space-y-12">
          <section :id="generalAnchor" :ref="setAnchorRef(generalAnchor)"
            class="space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8">
            <div class="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div class="relative aspect-[3/1]">
                <img src="/img/learn/missions/full-flight/briefing-weather.png" alt="Weather briefing overview"
                  class="absolute inset-0 h-full w-full object-cover" />
              </div>
            </div>
            <header class="space-y-3">
              <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Developer</p>
              <h2 class="text-3xl font-semibold text-white">About the API</h2>
              <p class="text-base text-white/70">
                All endpoints speak JSON over HTTPS. Unless otherwise stated, successful responses follow the shape
                <code class="bg-white/10 px-1">{ \"success\": true }</code> and failures raise an error object with
                <code class="bg-white/10 px-1">statusCode</code> and <code class="bg-white/10 px-1">statusMessage</code>.
              </p>
            </header>
            <div class="grid gap-6 text-sm text-white/70 lg:grid-cols-2">
              <div class="space-y-2">
                <h3 class="text-lg font-semibold text-white">Authentication</h3>
                <p>
                  Login returns a short-lived access token and sets an HTTP-only refresh cookie. Send the access token on
                  protected routes via <code class="bg-white/10 px-1">Authorization: Bearer &lt;token&gt;</code>. Refresh the token by
                  calling <code class="bg-white/10 px-1">POST /api/service/auth/refresh</code> with the refresh cookie present.
                </p>
              </div>
              <div class="space-y-2">
                <h3 class="text-lg font-semibold text-white">Base URLs</h3>
                <ul class="list-disc space-y-1 pl-5">
                  <li>Production: <code class="bg-white/10 px-1">https://opensquawk.de/api/</code></li>
                  <li>Local development: <code class="bg-white/10 px-1">http://localhost:3000/api/</code></li>
                </ul>
              </div>
            </div>
          </section>

          <section class="space-y-3">
            <header class="space-y-2">
              <h2 class="text-2xl font-semibold">Endpoint catalog</h2>
              <p class="text-sm text-white/60">
                Endpoints are grouped by audience. Public endpoints do not require a bearer token. Protected endpoints require a
                valid access token. Rate limits and additional business rules are documented per route.
              </p>
            </header>
            <p v-if="hasActiveSearch && filteredSections.length" class="text-sm text-white/50">
              Showing {{ resultCount }} matched {{ resultCount === 1 ? 'endpoint' : 'endpoints' }}.
            </p>
          </section>

          <div v-if="!filteredSections.length"
            class="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/60">
            <p>No endpoints match your search. Try different keywords or reset the filter.</p>
          </div>

          <div v-else class="space-y-12">
            <section v-for="section in filteredSections" :id="sectionAnchor(section.title)" :key="section.title" class="space-y-8">
              <div class="space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <h3 class="text-xl font-semibold text-white">{{ section.title }}</h3>
                  <span class="text-xs uppercase tracking-[0.3em] text-white/40">{{ section.groups.reduce((total, group) => total + group.endpoints.length, 0) }} routes</span>
                </div>
                <p v-if="section.description" class="text-sm text-white/60">{{ section.description }}</p>
              </div>

              <div class="space-y-10">
                <div v-for="group in section.groups" :id="groupAnchor(section.title, group.title)"
                  :key="`${section.title}-${group.title}`" class="space-y-4">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="space-y-1">
                      <h4 class="text-lg font-semibold text-white">{{ group.title }}</h4>
                      <p v-if="group.description" class="text-sm text-white/60">{{ group.description }}</p>
                    </div>
                    <span class="inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/40">
                      {{ group.endpoints.length }} {{ group.endpoints.length === 1 ? 'route' : 'routes' }}
                    </span>
                  </div>

                  <div class="space-y-5">
                    <article v-for="endpoint in group.endpoints" :id="endpointAnchor(section.title, group.title, endpoint)"
                      :ref="setAnchorRef(endpointAnchor(section.title, group.title, endpoint))"
                      :key="getEndpointKey(endpoint)"
                      class="group overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                      <div role="button" tabindex="0"
                        class="flex w-full cursor-pointer flex-col gap-4 p-6 text-left transition hover:bg-white/10 focus:outline-none focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
                        :aria-expanded="isEndpointExpanded(getEndpointKey(endpoint))"
                        @click="toggleEndpoint(getEndpointKey(endpoint))"
                        @keydown.enter.prevent="toggleEndpoint(getEndpointKey(endpoint))"
                        @keydown.space.prevent="toggleEndpoint(getEndpointKey(endpoint))">
                        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div class="space-y-2">
                            <div class="flex flex-wrap items-center gap-3">
                              <span
                                :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', methodColor(endpoint.method)]">
                                {{ endpoint.method }}
                              </span>
                              <div class="flex flex-wrap items-center gap-2">
                                <code
                                    @click.stop="copyToClipboard(fullEndpointUrl(endpoint.path), getCopyKey(endpoint, 'url'))"
                                    class="rounded cursor-pointer hover:bg-cyan-950 active:bg-cyan-900 bg-black/50 px-2 py-1 text-sm font-mono text-cyan-200">{{ endpoint.path.replaceAll('/api/',"") }}</code>
<!--                                <button type="button"-->
<!--                                  class="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white/60 transition hover:border-cyan-300/60 hover:text-white"-->
<!--                                  <v-icon icon="mdi-content-copy" size="14" />-->
<!--                                  <span>{{ copyStates[getCopyKey(endpoint, 'url')] ? 'Copied' : 'Copy'}}</span>-->
<!--                                </button>-->
                              </div>
                            </div>
                            <p class="text-sm text-white/70">{{ endpoint.summary }}</p>
                          </div>
                          <div class="flex flex-col items-start gap-3 text-xs text-white/60 lg:items-end">
                            <div class="flex flex-wrap items-center gap-2">
                              <span v-if="endpoint.auth === 'protected'"
                                class="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
                                <v-icon icon="mdi-lock" size="14" /> Access token required
                              </span>
                              <span v-else class="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
                                <v-icon icon="mdi-earth" size="14" /> Public
                              </span>
                              <span v-if="endpoint.rateLimit"
                                class="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
                                <v-icon icon="mdi-timer-outline" size="14" /> {{ endpoint.rateLimit }}
                              </span>
                            </div>
                            <span class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                              <v-icon :icon="isEndpointExpanded(getEndpointKey(endpoint)) ? 'mdi-minus' : 'mdi-plus'" size="18" />
                              {{ isEndpointExpanded(getEndpointKey(endpoint)) ? 'Collapse' : 'Expand' }} details
                            </span>
                          </div>
                        </div>
                      </div>

                      <transition name="fade-slide">
                        <div v-show="isEndpointExpanded(getEndpointKey(endpoint))"
                          class="space-y-4 border-t border-white/10 bg-black/40 p-6">
                          <div v-if="endpoint.query?.length" class="space-y-3">
                            <h5 class="text-sm font-semibold text-white">Query parameters</h5>
                            <div class="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                              <table class="w-full text-left text-sm text-white/70">
                                <thead class="bg-white/5 text-xs uppercase tracking-[0.2em] text-white/50">
                                  <tr>
                                    <th scope="col" class="px-4 py-3 font-medium text-white/60">Parameter</th>
                                    <th scope="col" class="px-4 py-3 font-medium text-white/60">Type</th>
                                    <th scope="col" class="px-4 py-3 font-medium text-white/60">Description</th>
                                  </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5">
                                  <tr v-for="param in endpoint.query" :key="param.name" class="align-top">
                                    <td class="px-4 py-3">
                                      <div class="space-y-1">
                                        <span :class="['block text-white', param.required ? 'font-semibold' : 'font-medium']">{{ param.name }}</span>
                                        <span class="text-[11px] uppercase tracking-[0.25em]"
                                          :class="param.required ? 'text-white' : 'text-white/40'">
                                          {{ param.required ? 'Required' : 'Optional' }}
                                        </span>
                                      </div>
                                    </td>
                                    <td class="px-4 py-3 text-xs uppercase tracking-wide text-white/50">{{ param.type }}</td>
                                    <td class="px-4 py-3 text-sm text-white/70">{{ param.description }}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div v-if="endpoint.body?.length" class="space-y-3">
                            <h5 class="text-sm font-semibold text-white">Request body</h5>
                            <div class="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                              <table class="w-full text-left text-sm text-white/70">
                                <thead class="bg-white/5 text-xs uppercase tracking-[0.2em] text-white/50">
                                  <tr>
                                    <th scope="col" class="px-4 py-3 font-medium text-white/60">Field</th>
                                    <th scope="col" class="px-4 py-3 font-medium text-white/60">Type</th>
                                    <th scope="col" class="px-4 py-3 font-medium text-white/60">Description</th>
                                  </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5">
                                  <tr v-for="field in endpoint.body" :key="field.name" class="align-top">
                                    <td class="px-4 py-3">
                                      <div class="space-y-1">
                                        <span :class="['block text-white', field.required ? 'font-semibold' : 'font-medium']">{{ field.name }}</span>
                                        <span class="text-[11px] uppercase tracking-[0.25em]"
                                          :class="field.required ? 'text-white' : 'text-white/40'">
                                          {{ field.required ? 'Required' : 'Optional' }}
                                        </span>
                                      </div>
                                    </td>
                                    <td class="px-4 py-3 text-xs uppercase tracking-wide text-white/50">{{ field.type }}</td>
                                    <td class="px-4 py-3 text-sm text-white/70">{{ field.description }}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div v-if="endpoint.sampleRequest" class="space-y-3">
                            <div class="flex items-center justify-between gap-4">
                              <h5 class="text-sm font-semibold text-white">Sample request</h5>
                              <button type="button"
                                class="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white/60 transition hover:border-cyan-300/60 hover:text-white"
                                @click.stop="copyToClipboard(endpoint.sampleRequest, getCopyKey(endpoint, 'request'))">
                                <v-icon icon="mdi-content-copy" size="14" />
                                <span>{{ copyStates[getCopyKey(endpoint, 'request')] ? 'Copied' : 'Copy' }}</span>
                              </button>
                            </div>
                            <pre class="overflow-x-auto rounded-2xl bg-black/60 p-4 text-xs leading-5 text-white/80"><code>{{ endpoint.sampleRequest }}</code></pre>
                          </div>

                          <div v-if="endpoint.sampleResponse" class="space-y-3">
                            <div class="flex items-center justify-between gap-4">
                              <h5 class="text-sm font-semibold text-white">Sample response</h5>
                              <button type="button"
                                class="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white/60 transition hover:border-cyan-300/60 hover:text-white"
                                @click.stop="copyToClipboard(endpoint.sampleResponse, getCopyKey(endpoint, 'response'))">
                                <v-icon icon="mdi-content-copy" size="14" />
                                <span>{{ copyStates[getCopyKey(endpoint, 'response')] ? 'Copied' : 'Copy' }}</span>
                              </button>
                            </div>
                            <pre class="overflow-x-auto rounded-2xl bg-black/60 p-4 text-xs leading-5 text-white/80"><code>{{ endpoint.sampleResponse }}</code></pre>
                          </div>

                          <p v-if="endpoint.notes" class="text-sm text-white/60">{{ endpoint.notes }}</p>
                        </div>
                      </transition>
                    </article>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section class="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 class="text-xl font-semibold">Errors</h2>
            <p class="text-sm text-white/70">
              Errors follow the Nitro <code class="bg-white/10 px-1">createError</code> payload. The
              <code class="bg-white/10 px-1">statusMessage</code> describes the failure reason. Additional diagnostic data may be
              returned in <code class="bg-white/10 px-1">data</code> for some endpoints.
            </p>
            <pre class="overflow-x-auto rounded-2xl bg-black/60 p-4 text-xs leading-5 text-white/80"><code>{
  "statusCode": 401,
  "statusMessage": "Authentication required"
}</code></pre>
          </section>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
  category: string
  auth: AuthLevel
  rateLimit?: string
  query?: QueryField[]
  body?: BodyField[]
  sampleRequest?: string
  sampleResponse?: string
  notes?: string
  featured?: boolean
  keywords?: string[]
}

interface EndpointSection {
  title: string
  description?: string
  endpoints: EndpointEntry[]
}

interface EndpointGroup {
  title: string
  description?: string
  endpoints: EndpointEntry[]
}

interface CategorizedSection {
  title: string
  description?: string
  groups: EndpointGroup[]
}

interface NavigationEndpoint {
  anchor: string
  method: string
  path: string
  summary: string
}

interface NavigationGroupItem {
  title: string
  endpoints: NavigationEndpoint[]
}

interface NavigationSectionItem {
  title: string
  groups: NavigationGroupItem[]
}

const BASE_URL = 'https://opensquawk.de'

const sectionCategoryOrder: Record<string, string[]> = {
  'Public endpoints': ['Waitlist & marketing', 'Feedback & insights', 'Authentication & onboarding', 'Tools & diagnostics'],
  'Protected endpoints': ['Session controls', 'Invitation management', 'ATC synthesis', 'Decision engine'],
}

const sectionCategoryDescriptions: Record<string, Record<string, string>> = {
  'Public endpoints': {
    'Waitlist & marketing': 'Capture interest, collect consent, and gauge roadmap sentiment.',
    'Feedback & insights': 'Share structured bug reports and qualitative feedback with the team.',
    'Authentication & onboarding': 'Account creation, recovery, and invitation flows during the alpha programme.',
    'Tools & diagnostics': 'Helper utilities for simulator integrations and latency checks.',
  },
  'Protected endpoints': {
    'Session controls': 'Inspect or terminate the current authenticated session.',
    'Invitation management': 'Review existing codes or mint new invitations once eligible.',
    'ATC synthesis': 'Voice generation and transcription endpoints for ATC training scenarios.',
    'Decision engine': 'LLM router access for orchestrating scenario logic.',
  },
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
        category: 'Waitlist & marketing',
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
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/waitlist \
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
        category: 'Waitlist & marketing',
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
        category: 'Waitlist & marketing',
        auth: 'public',
        body: [
          { name: 'email', type: 'string', required: true, description: 'Subscriber email address.' },
          { name: 'name', type: 'string', description: 'Optional contact name.' },
          { name: 'source', type: 'string', description: 'Attribution label. Defaults to "landing-updates".' },
          { name: 'consentPrivacy', type: 'boolean', required: true, description: 'Must be true to store the subscriber.' },
          { name: 'consentMarketing', type: 'boolean', required: true, description: 'Required to receive email updates.' },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/updates \
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
        category: 'Waitlist & marketing',
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
        category: 'Waitlist & marketing',
        auth: 'public',
        rateLimit: 'Max 1 payload / 10 s per IP',
        body: [
          { name: 'votes', type: 'Array<{ key: string; importance: 1..5 }>', required: true, description: 'Unique roadmap item keys with rating per submission.' },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/roadmap \
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
        category: 'Waitlist & marketing',
        auth: 'public',
        body: [
          { name: 'title', type: 'string', required: true, description: 'At least 4 characters.' },
          { name: 'details', type: 'string', required: true, description: 'At least 20 characters describing the idea.' },
          { name: 'email', type: 'string', description: 'Optional reply-to address.' },
          { name: 'allowContact', type: 'boolean', description: 'Enable follow-up via the provided email. Requires email.' },
          { name: 'consentPrivacy', type: 'boolean', required: true, description: 'Must be true to store the suggestion.' },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/roadmap-suggestions \
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
        path: '/api/service/feedback',
        summary: 'Send qualitative feedback directly to the OpenSquawk crew.',
        category: 'Feedback & insights',
        auth: 'public',
        body: [
          { name: 'name', type: 'string', description: 'Optional display name.' },
          { name: 'email', type: 'string', description: 'Optional contact email to receive a reply.' },
          { name: 'excitement', type: 'number (1..5)', required: true, description: 'Overall excitement rating.' },
          {
            name: 'highlightSelections',
            type: 'string[]',
            description: 'Checkbox selections describing what already works well.',
          },
          { name: 'highlightNotes', type: 'string', description: 'Long-form notes about the highlights.' },
          {
            name: 'frictionSelections',
            type: 'string[]',
            description: 'Checkbox selections describing friction points.',
          },
          { name: 'frictionNotes', type: 'string', description: 'Detailed explanation of friction areas.' },
          { name: 'classroomNotes', type: 'string', description: 'Stories about the classroom missions.' },
          { name: 'hostingInterest', type: 'string', description: 'Thoughts on self-hosting or managed hosting.' },
          { name: 'otherIdeas', type: 'string', description: 'Wildcard space for big ideas and requests.' },
          {
            name: 'contactConsent',
            type: 'boolean',
            description: 'Set true if it is okay for the team to follow up via email.',
          },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/feedback \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Jane Pilot",
    "email": "jane.pilot@example.com",
    "excitement": 5,
    "highlightSelections": ["Lesson console", "UI design"],
    "highlightNotes": "The console feels crisp and fast.",
    "frictionSelections": ["Latency or responsiveness"],
    "frictionNotes": "Audio hiccups during busy moments.",
    "classroomNotes": "Loved the clearance training mission.",
    "hostingInterest": "Curious about a managed EU cluster.",
    "otherIdeas": "It would be great to add printable kneeboards.",
    "contactConsent": true
  }'`,
        sampleResponse: `{
  "success": true
}`,
      },
      {
        method: 'POST',
        path: '/api/service/feedback/issues',
        summary: 'File a public feedback report with categories, title, and description.',
        category: 'Feedback & insights',
        auth: 'public',
        body: [
          { name: 'title', type: 'string', required: true, description: 'At least 4 characters.' },
          { name: 'description', type: 'string', required: true, description: 'At least 20 characters explaining the report.' },
          {
            name: 'categories',
            type: 'string[]',
            required: true,
            description: 'One or more tags such as "audio", "ui", or "content".',
          },
          {
            name: 'contactEmail',
            type: 'string',
            description: 'Optional email address if you want a follow-up message.',
          },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/feedback/issues \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Audio drops in busy towers",
    "description": "While working EDDF Approach the audio fell silent twice during high traffic. It recovers after ~5 seconds but the gap is scary.",
    "categories": ["audio", "stability"],
    "contactEmail": "pilot@example.com"
  }'`,
        sampleResponse: `{
  "success": true,
  "reportId": "5f0b4a16-7b52-4b63-8894-0f3a28e2d6a4"
}`,
        notes: 'Reports are delivered to the operations team and may be triaged publicly in future releases.',
      },
      {
        method: 'POST',
        path: '/api/service/auth/login',
        summary: 'Authenticate with email and password. Returns an access token and sets a refresh cookie.',
        category: 'Authentication & onboarding',
        auth: 'public',
        featured: true,
        keywords: ['auth', 'login', 'token', 'authentication'],
        body: [
          { name: 'email', type: 'string', required: true, description: 'User email address.' },
          { name: 'password', type: 'string', required: true, description: 'User password.' },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/auth/login \
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
        category: 'Authentication & onboarding',
        auth: 'public',
        featured: true,
        keywords: ['auth', 'register', 'signup', 'invitation'],
        body: [
          { name: 'email', type: 'string', required: true, description: 'Valid email address. Stored in lower case.' },
          { name: 'password', type: 'string', required: true, description: 'Must pass strength validation (>= 8 characters, numbers, etc.).' },
          { name: 'name', type: 'string', description: 'Optional pilot name shown in the app.' },
          { name: 'invitationCode', type: 'string', required: true, description: 'Invitations are uppercase, 8 characters.' },
          { name: 'acceptTerms', type: 'boolean', required: true, description: 'Must be true.' },
          { name: 'acceptPrivacy', type: 'boolean', required: true, description: 'Must be true.' },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/auth/register \
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
        category: 'Authentication & onboarding',
        auth: 'public',
        notes: 'Requires a valid refresh cookie from a prior login or registration response.',
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/auth/refresh \
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
        category: 'Authentication & onboarding',
        auth: 'public',
        body: [
          { name: 'email', type: 'string', required: true, description: 'Email address tied to the account.' },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/auth/forgot-password \
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
        category: 'Authentication & onboarding',
        auth: 'public',
        body: [
          { name: 'token', type: 'string', required: true, description: 'Token received via the reset email.' },
          { name: 'password', type: 'string', required: true, description: 'New password (minimum 8 characters).' },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/auth/reset-password \
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
        category: 'Authentication & onboarding',
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
        category: 'Authentication & onboarding',
        auth: 'public',
        body: [
          { name: 'label', type: 'string', description: 'Optional tag that is stored with the invitation.' },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/invitations/bootstrap \
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
        category: 'Authentication & onboarding',
        auth: 'public',
        body: [
          { name: 'password', type: 'string', required: true, description: 'Shared secret defined in runtime config.' },
          { name: 'label', type: 'string', description: 'Optional label to track the invite origin.' },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/service/invitations/manual \
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
        category: 'Tools & diagnostics',
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
        category: 'Tools & diagnostics',
        auth: 'public',
        query: [
          { name: 'origin_lat', type: 'number', required: true, description: 'Origin latitude in decimal degrees.' },
          { name: 'origin_lng', type: 'number', required: true, description: 'Origin longitude in decimal degrees.' },
          { name: 'dest_lat', type: 'number', required: true, description: 'Destination latitude in decimal degrees.' },
          { name: 'dest_lng', type: 'number', required: true, description: 'Destination longitude in decimal degrees.' },
          { name: 'radius', type: 'number', description: 'Search radius in metres (default 2000).' },
        ],
        sampleRequest: `curl "https://opensquawk.de/api/service/tools/taxiroute?origin_lat=50.0506&origin_lng=8.5708&dest_lat=50.0473&dest_lng=8.5610&radius=2500"`,
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
        category: 'Session controls',
        auth: 'protected',
        featured: true,
        keywords: ['profile', 'session', 'identity'],
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
        category: 'Session controls',
        auth: 'protected',
        sampleResponse: `{
  "success": true
}`,
      },
      {
        method: 'GET',
        path: '/api/auth/invitations',
        summary: 'List invitation codes previously generated by the user.',
        category: 'Invitation management',
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
        category: 'Invitation management',
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
        category: 'ATC synthesis',
        auth: 'protected',
        featured: true,
        keywords: ['tts', 'audio', 'speech', 'radio'],
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
        sampleRequest: `curl -X POST https://opensquawk.de/api/atc/say \
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
        category: 'ATC synthesis',
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
        category: 'Decision engine',
        auth: 'protected',
        body: [
          { name: 'state_id', type: 'string', required: true, description: 'Identifier of the current node in the flow.' },
          { name: 'candidates', type: 'Array', required: true, description: 'Candidate states for the router to choose from.' },
          { name: 'pilot_utterance', type: 'string', description: 'Recent transcription forwarded to the model.' },
          { name: 'variables', type: 'object', description: 'Arbitrary variables passed to the router.' },
          { name: 'flags', type: 'object', description: 'Boolean flags controlling heuristics.' },
        ],
        sampleRequest: `curl -X POST https://opensquawk.de/api/llm/decide \
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

const searchTerm = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const openEndpoints = ref<Record<string, boolean>>({})
const copyStates = ref<Record<string, boolean>>({})
const copyTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const generalAnchor = 'about-the-api'
const activeAnchor = ref(generalAnchor)

const anchorRefs = new Map<string, HTMLElement>()
let scrollFrame: number | null = null

function buildGroups(section: EndpointSection, endpoints: EndpointEntry[]): EndpointGroup[] {
  const groups = new Map<string, EndpointEntry[]>()

  endpoints.forEach((endpoint) => {
    if (!groups.has(endpoint.category)) {
      groups.set(endpoint.category, [])
    }
    groups.get(endpoint.category)!.push(endpoint)
  })

  const preferredOrder = sectionCategoryOrder[section.title] ?? []
  const orderedKeys = [
    ...preferredOrder.filter((category) => groups.has(category)),
    ...Array.from(groups.keys()).filter((category) => !preferredOrder.includes(category)),
  ]

  return orderedKeys
    .map((category) => ({
      title: category,
      description: sectionCategoryDescriptions[section.title]?.[category],
      endpoints: groups.get(category) ?? [],
    }))
    .filter((group) => group.endpoints.length > 0)
}

const hasActiveSearch = computed(() => searchTerm.value.trim().length > 0)

const totalEndpointCount = computed(() =>
  endpointSections.reduce((count, section) => count + section.endpoints.length, 0),
)

const filteredSections = computed<CategorizedSection[]>(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return endpointSections.reduce<CategorizedSection[]>((acc, section) => {
    const scopedEndpoints = term
      ? section.endpoints.filter((endpoint) => {
          const haystack = [
            section.title,
            endpoint.method,
            endpoint.path,
            endpoint.summary,
            endpoint.category,
            endpoint.notes ?? '',
            ...(endpoint.keywords ?? []),
            ...(endpoint.query?.flatMap((param) => [param.name, param.description]) ?? []),
            ...(endpoint.body?.flatMap((field) => [field.name, field.description]) ?? []),
          ]
            .join(' ')
            .toLowerCase()

          return haystack.includes(term)
        })
      : section.endpoints

    if (!scopedEndpoints.length) {
      return acc
    }

    const groups = buildGroups(section, scopedEndpoints)

    if (!groups.length) {
      return acc
    }

    acc.push({
      title: section.title,
      description: section.description,
      groups,
    })

    return acc
  }, [])
})

const resultCount = computed(() =>
  filteredSections.value.reduce(
    (count, section) =>
      count + section.groups.reduce((groupTotal, group) => groupTotal + group.endpoints.length, 0),
    0,
  ),
)

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const sectionAnchor = (title: string) => slugify(title)

const groupAnchor = (sectionTitle: string, groupTitle: string) =>
  `${sectionAnchor(sectionTitle)}-${slugify(groupTitle)}`

const endpointAnchor = (sectionTitle: string, groupTitle: string, endpoint: EndpointEntry) =>
  `${groupAnchor(sectionTitle, groupTitle)}-${slugify(`${endpoint.method}-${endpoint.path}`)}`

const navigationSections = computed<NavigationSectionItem[]>(() =>
  filteredSections.value
    .map((section) => ({
      title: section.title,
      groups: section.groups
        .map((group) => ({
          title: group.title,
          endpoints: group.endpoints.map((endpoint) => ({
            anchor: endpointAnchor(section.title, group.title, endpoint),
            method: endpoint.method,
            path: endpoint.path,
            summary: endpoint.summary,
          })),
        }))
        .filter((group) => group.endpoints.length > 0),
    }))
    .filter((section) => section.groups.length > 0),
)

const fullEndpointUrl = (path: string) => `${BASE_URL}${path}`

const getEndpointKey = (endpoint: EndpointEntry) => `${endpoint.method.toUpperCase()}-${endpoint.path}`

const getCopyKey = (endpoint: EndpointEntry, type: 'url' | 'request' | 'response') =>
  `${getEndpointKey(endpoint)}-${type}`

const setAnchorRef = (anchor: string) => (el: HTMLElement | null) => {
  if (el) {
    anchorRefs.set(anchor, el)
  } else {
    anchorRefs.delete(anchor)
  }
}

const updateActiveAnchor = () => {
  const sections = Array.from(anchorRefs.entries())
    .map(([anchor, element]) => ({ anchor, rect: element.getBoundingClientRect() }))
    .sort((a, b) => a.rect.top - b.rect.top)

  if (!sections.length) {
    activeAnchor.value = generalAnchor
    return
  }

  const viewportOffset = 140
  const current =
    sections.find((section) => section.rect.top <= viewportOffset && section.rect.bottom >= viewportOffset) ??
    sections.find((section) => section.rect.top >= viewportOffset) ??
    sections[sections.length - 1]

  activeAnchor.value = current.anchor
}

const scheduleActiveAnchorUpdate = () => {
  if (scrollFrame !== null) {
    return
  }

  if (typeof window === 'undefined') {
    return
  }

  scrollFrame = window.requestAnimationFrame(() => {
    updateActiveAnchor()
    scrollFrame = null
  })
}

const handleAnchorClick = (anchor: string) => {
  activeAnchor.value = anchor
  scheduleActiveAnchorUpdate()
}

const copyToClipboard = async (value: string, key: string) => {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return
  }

  try {
    await navigator.clipboard.writeText(value)

    copyStates.value = { ...copyStates.value, [key]: true }

    if (copyTimeouts.has(key)) {
      clearTimeout(copyTimeouts.get(key)!)
    }

    const timeout = setTimeout(() => {
      copyStates.value = { ...copyStates.value, [key]: false }
      copyTimeouts.delete(key)
    }, 2000)

    copyTimeouts.set(key, timeout)
  } catch (error) {
    console.error('Failed to copy text', error)
  }
}

const clearSearch = () => {
  searchTerm.value = ''
  openEndpoints.value = {}
  activeAnchor.value = generalAnchor
  nextTick(() => {
    searchInputRef.value?.focus()
    updateActiveAnchor()
  })
}

watch(searchTerm, (value) => {
  if (!value.trim()) {
    openEndpoints.value = {}
  }

  nextTick(() => {
    updateActiveAnchor()
  })
})

watch(filteredSections, () => {
  nextTick(() => {
    updateActiveAnchor()
  })
})

onMounted(() => {
  updateActiveAnchor()
  if (typeof window === 'undefined') {
    return
  }
  window.addEventListener('scroll', scheduleActiveAnchorUpdate, { passive: true })
  window.addEventListener('resize', scheduleActiveAnchorUpdate, { passive: true })
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', scheduleActiveAnchorUpdate)
    window.removeEventListener('resize', scheduleActiveAnchorUpdate)
    if (scrollFrame !== null) {
      window.cancelAnimationFrame(scrollFrame)
    }
  }

  if (scrollFrame !== null) {
    scrollFrame = null
  }

  copyTimeouts.forEach((timeout) => {
    clearTimeout(timeout)
  })
  copyTimeouts.clear()
})

const isEndpointExpanded = (key: string) => {
  if (hasActiveSearch.value) {
    return openEndpoints.value[key] !== false
  }

  return openEndpoints.value[key] === true
}

const toggleEndpoint = (key: string) => {
  const next = !isEndpointExpanded(key)
  openEndpoints.value[key] = next
}

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

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
