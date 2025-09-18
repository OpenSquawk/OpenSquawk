<template>
  <div class="min-h-screen bg-[#050910] pb-20 text-white">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6 lg:px-8">
      <header class="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-[0.4em] text-cyan-300/70">OpenSquawk</p>
          <h1 class="text-3xl font-semibold">Admin Operations Center</h1>
          <p class="text-sm text-white/70">
            Vollständiger Überblick über Nutzer, Einladungscodes und Funkprotokolle mit Live-Trace.
          </p>
        </div>
        <div class="flex flex-col items-start gap-3 text-sm text-white/70 sm:items-end">
          <div class="flex items-center gap-2 text-white/80">
            <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>
              Eingeloggt als <strong>{{ auth.user?.email }}</strong>
              <v-chip size="x-small" color="cyan" variant="outlined" class="ml-2">
                {{ auth.user?.role?.toUpperCase() }}
              </v-chip>
            </span>
          </div>
          <v-btn
            color="cyan"
            variant="outlined"
            size="small"
            :loading="refreshing"
            prepend-icon="mdi-refresh"
            @click="refreshActiveTab"
          >
            Daten aktualisieren
          </v-btn>
        </div>
      </header>

      <v-tabs
        v-model="activeTab"
        class="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
        slider-color="cyan"
        density="comfortable"
      >
        <v-tab value="overview">Übersicht</v-tab>
        <v-tab value="users">Nutzer</v-tab>
        <v-tab value="invitations">Einladungen</v-tab>
        <v-tab value="waitlist">Warteliste</v-tab>
        <v-tab value="logs">Funkprotokolle</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <v-window-item value="overview">
          <section class="space-y-6">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h2 class="text-2xl font-semibold">Systemmetriken</h2>
                <p class="text-sm text-white/70">Letzte Aktualisierung: {{ formatDateTime(overview?.generatedAt) }}</p>
              </div>
              <v-chip v-if="overviewLoading" color="cyan" variant="tonal" size="small">lädt…</v-chip>
            </div>

            <v-alert
              v-if="overviewError"
              type="warning"
              variant="tonal"
              border="start"
              color="red"
              density="comfortable"
              class="bg-red-500/10 text-red-100"
            >
              {{ overviewError }}
            </v-alert>

            <div v-if="overview" class="grid gap-5 lg:grid-cols-3">
              <v-card class="bg-black/40">
                <v-card-text class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Accounts</h3>
                    <v-chip size="small" color="cyan" variant="outlined">{{ overview.users.total }}</v-chip>
                  </div>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">Admins</p>
                      <p class="text-xl font-semibold text-white">{{ overview.users.admins }}</p>
                    </div>
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">Developer</p>
                      <p class="text-xl font-semibold text-white">{{ overview.users.devs }}</p>
                    </div>
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">Neu (7 Tage)</p>
                      <p class="text-xl font-semibold text-emerald-300">{{ overview.users.newLast7Days }}</p>
                    </div>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Neueste Accounts</p>
                    <ul class="space-y-2 text-sm text-white/80">
                      <li
                        v-for="user in overview.users.recent"
                        :key="user.id"
                        class="flex items-center justify-between gap-2"
                      >
                        <span>
                          {{ user.email }}
                          <span v-if="user.name" class="text-white/50">({{ user.name }})</span>
                        </span>
                        <span class="text-xs text-white/40">{{ formatRelative(user.createdAt) }}</span>
                      </li>
                    </ul>
                  </div>
                </v-card-text>
              </v-card>

              <v-card class="bg-black/40">
                <v-card-text class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Einladungscodes</h3>
                    <v-chip size="small" color="cyan" variant="outlined">{{ overview.invitations.total }}</v-chip>
                  </div>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">Aktiv</p>
                      <p class="text-xl font-semibold text-white">{{ overview.invitations.active }}</p>
                    </div>
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">Läuft in 7 Tagen ab</p>
                      <p class="text-xl font-semibold text-orange-300">{{ overview.invitations.expiringSoon }}</p>
                    </div>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Letzte Codes</p>
                    <ul class="space-y-2 text-sm text-white/80">
                      <li
                        v-for="inv in overview.invitations.recent"
                        :key="inv.id"
                        class="space-y-1 rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <div class="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/40">
                          <span>{{ inv.channel }}</span>
                          <span>{{ formatRelative(inv.createdAt) }}</span>
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="font-mono text-lg tracking-widest">{{ inv.code }}</span>
                          <v-chip v-if="inv.label" size="x-small" color="cyan" variant="tonal">{{ inv.label }}</v-chip>
                        </div>
                        <p v-if="inv.expiresAt" class="text-xs text-white/50">
                          gültig bis {{ formatDateTime(inv.expiresAt) }}
                        </p>
                      </li>
                    </ul>
                  </div>
                </v-card-text>
              </v-card>

              <v-card class="bg-black/40">
                <v-card-text class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Funkprotokolle</h3>
                    <v-chip size="small" color="cyan" variant="outlined">{{ overview.transmissions.total }}</v-chip>
                  </div>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">24h</p>
                      <p class="text-xl font-semibold text-white">{{ overview.transmissions.last24h }}</p>
                    </div>
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">Kanäle</p>
                      <div class="flex flex-wrap gap-2 pt-1 text-xs text-white/60">
                        <span
                          v-for="(value, key) in overview.transmissions.byChannel"
                          :key="key"
                          class="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1"
                        >
                          <v-icon size="14" icon="mdi-radio-handheld" />
                          {{ key }} · {{ value }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Neueste Übertragungen</p>
                    <ul class="space-y-2 text-sm text-white/80">
                      <li
                        v-for="log in overview.transmissions.recent"
                        :key="log.id"
                        class="rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <div class="flex items-center justify-between text-xs text-white/40 uppercase tracking-[0.2em]">
                          <span class="flex items-center gap-2">
                            <v-chip size="x-small" color="cyan" variant="outlined">{{ log.channel }}</v-chip>
                            <span>{{ log.direction }}</span>
                          </span>
                          <span>{{ formatRelative(log.createdAt) }}</span>
                        </div>
                        <p class="mt-2 font-mono text-sm">{{ log.text }}</p>
                      </li>
                    </ul>
                  </div>
                </v-card-text>
              </v-card>
            </div>
            <div v-else-if="overviewLoading" class="py-12 text-center text-white/70">
              <v-progress-circular indeterminate color="cyan" class="mb-4" />
              <p>Daten werden geladen…</p>
            </div>
          </section>
        </v-window-item>

        <v-window-item value="users">
          <section class="space-y-6">
            <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div class="flex flex-1 flex-col gap-4 md:flex-row md:items-end">
                <v-text-field
                  v-model="userSearch"
                  label="Suche nach Nutzer"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  class="md:max-w-sm"
                />
                <v-select
                  v-model="userRoleFilter"
                  :items="userRoleFilterOptions"
                  label="Rolle filtern"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                  class="md:w-48"
                />
              </div>
              <div class="flex items-center gap-3">
                <div class="flex gap-2 text-xs text-white/50">
                  <v-chip size="x-small" color="cyan" variant="outlined">User {{ userRoleStats.user }}</v-chip>
                  <v-chip size="x-small" color="cyan" variant="outlined">Dev {{ userRoleStats.dev }}</v-chip>
                  <v-chip size="x-small" color="cyan" variant="outlined">Admin {{ userRoleStats.admin }}</v-chip>
                </div>
                <v-btn color="cyan" variant="tonal" @click="fetchUsers(true)" :loading="userLoading">
                  Anwenden
                </v-btn>
              </div>
            </div>

            <v-alert
              v-if="userError"
              type="warning"
              variant="tonal"
              border="start"
              density="comfortable"
              class="bg-red-500/10 text-red-100"
            >
              {{ userError }}
            </v-alert>

            <div v-if="userLoading" class="py-12 text-center text-white/70">
              <v-progress-circular indeterminate color="cyan" class="mb-4" />
              <p>Nutzerdaten werden geladen…</p>
            </div>

            <div v-else class="space-y-4">
              <div v-if="users.length" class="space-y-3">
                <v-card
                  v-for="user in users"
                  :key="user.id"
                  class="border border-white/10 bg-black/40"
                >
                  <v-card-text class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div class="space-y-1">
                      <p class="text-sm text-white/50">{{ formatDateTime(user.createdAt) }}</p>
                      <h3 class="text-lg font-semibold">{{ user.email }}</h3>
                      <p v-if="user.name" class="text-sm text-white/60">{{ user.name }}</p>
                      <div class="flex flex-wrap gap-2 text-xs text-white/50">
                        <span>Einladungen erstellt: {{ user.invitationCodesIssued }}</span>
                        <span v-if="user.lastLoginAt">Letzter Login: {{ formatRelative(user.lastLoginAt) }}</span>
                      </div>
                    </div>
                    <div class="flex flex-col items-start gap-2 md:items-end">
                      <v-select
                        v-model="userRoleDraft[user.id]"
                        :items="userRoleEditOptions"
                        label="Rolle"
                        density="comfortable"
                        variant="outlined"
                        color="cyan"
                        hide-details
                        class="w-44"
                      />
                      <v-btn
                        color="cyan"
                        variant="flat"
                        size="small"
                        :loading="userRoleUpdating === user.id"
                        :disabled="userRoleDraft[user.id] === user.role"
                        @click="applyRoleChange(user.id)"
                      >
                        Aktualisieren
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
              <p v-else class="py-12 text-center text-sm text-white/60">Keine Nutzer gefunden.</p>

              <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div class="text-xs text-white/50">
                  Seite {{ userPagination.page }} von {{ userPagination.pages }} · {{ userPagination.total }} Einträge
                </div>
                <div class="flex items-center gap-2">
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="userPagination.page <= 1"
                    @click="changeUserPage(userPagination.page - 1)"
                  >
                    Zurück
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="userPagination.page >= userPagination.pages"
                    @click="changeUserPage(userPagination.page + 1)"
                  >
                    Weiter
                  </v-btn>
                </div>
              </div>
            </div>
          </section>
        </v-window-item>

        <v-window-item value="invitations">
          <section class="space-y-6">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div class="flex flex-1 flex-col gap-4 md:flex-row md:items-end">
                <v-text-field
                  v-model="invitationSearch"
                  label="Code oder Label suchen"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  class="md:max-w-sm"
                />
                <v-select
                  v-model="invitationStatus"
                  :items="invitationStatusOptions"
                  label="Status"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                  class="md:w-48"
                />
                <v-select
                  v-model="invitationChannel"
                  :items="invitationChannelOptions"
                  label="Kanal"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                  class="md:w-48"
                />
              </div>
              <div class="flex items-center gap-3">
                <v-btn color="cyan" variant="outlined" prepend-icon="mdi-plus" @click="showCreateInvite = true">
                  Einladungscode erstellen
                </v-btn>
                <v-btn color="cyan" variant="tonal" :loading="invitationLoading" @click="fetchInvitations(true)">
                  Anwenden
                </v-btn>
              </div>
            </div>

            <v-alert
              v-if="invitationError"
              type="warning"
              variant="tonal"
              border="start"
              density="comfortable"
              class="bg-red-500/10 text-red-100"
            >
              {{ invitationError }}
            </v-alert>

            <div v-if="invitationLoading" class="py-12 text-center text-white/70">
              <v-progress-circular indeterminate color="cyan" class="mb-4" />
              <p>Einladungscodes werden geladen…</p>
            </div>

            <div v-else class="space-y-4">
              <div v-if="invitations.length" class="grid gap-3 md:grid-cols-2">
                <v-card
                  v-for="inv in invitations"
                  :key="inv.id"
                  class="border border-white/10 bg-black/40"
                >
                  <v-card-text class="space-y-3">
                    <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                      <span>{{ inv.channel }}</span>
                      <span>{{ formatRelative(inv.createdAt) }}</span>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-mono text-2xl tracking-widest">{{ inv.code }}</span>
                      <v-chip v-if="inv.label" size="x-small" color="cyan" variant="tonal">{{ inv.label }}</v-chip>
                    </div>
                    <div class="flex flex-col gap-1 text-xs text-white/60">
                      <span>
                        Status:
                        <strong
                          :class="[
                            inv.usedAt ? 'text-emerald-300' : inv.expiresAt && isExpired(inv.expiresAt) ? 'text-red-300' : 'text-white',
                          ]"
                        >
                          {{ invitationStatusLabel(inv) }}
                        </strong>
                      </span>
                      <span v-if="inv.expiresAt">Gültig bis {{ formatDateTime(inv.expiresAt) }}</span>
                      <span v-if="inv.createdBy">Erstellt von {{ inv.createdBy.email }}</span>
                      <span v-if="inv.usedBy">Verwendet von {{ inv.usedBy.email }}</span>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
              <p v-else class="py-12 text-center text-sm text-white/60">Keine Einladungen gefunden.</p>

              <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div class="text-xs text-white/50">
                  Seite {{ invitationPagination.page }} von {{ invitationPagination.pages }} · {{ invitationPagination.total }} Codes
                </div>
                <div class="flex items-center gap-2">
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="invitationPagination.page <= 1"
                    @click="changeInvitationPage(invitationPagination.page - 1)"
                  >
                    Zurück
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="invitationPagination.page >= invitationPagination.pages"
                    @click="changeInvitationPage(invitationPagination.page + 1)"
                  >
                    Weiter
                  </v-btn>
                </div>
              </div>
            </div>
          </section>
        </v-window-item>

        <v-window-item value="waitlist">
          <section class="space-y-6">
            <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 class="text-2xl font-semibold">Warteliste</h2>
                <p class="text-sm text-white/70">
                  Gesamt: {{ waitlistStats.total }} · Updates: {{ waitlistStats.updates }} · Aktiviert: {{ waitlistStats.activated }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2 text-xs text-white/60">
                <v-chip size="small" color="cyan" variant="outlined">Gesamt: {{ waitlistStats.total }}</v-chip>
                <v-chip size="small" color="cyan" variant="text">Updates: {{ waitlistStats.updates }}</v-chip>
                <v-chip size="small" color="cyan" variant="text">Aktiviert: {{ waitlistStats.activated }}</v-chip>
                <v-chip size="small" color="cyan" variant="text">Wartend: {{ waitlistStats.pending }}</v-chip>
              </div>
            </div>

            <v-alert
              v-if="waitlistError"
              type="warning"
              variant="tonal"
              border="start"
              density="comfortable"
              class="bg-red-500/10 text-red-100"
            >
              {{ waitlistError }}
            </v-alert>

            <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div class="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <v-text-field
                  v-model="waitlistSearch"
                  label="Name, E-Mail oder Notizen"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                />
                <v-select
                  v-model="waitlistSubscription"
                  :items="waitlistSubscriptionOptions"
                  label="Opt-In"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                />
                <v-select
                  v-model="waitlistStatus"
                  :items="waitlistStatusOptions"
                  label="Status"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                />
                <v-btn color="cyan" variant="tonal" :loading="waitlistLoading" @click="fetchWaitlist(true)">
                  Filter anwenden
                </v-btn>
              </div>
              <div class="text-xs text-white/50">
                {{ waitlistPagination.total }} Einträge · Seite {{ waitlistPagination.page }} von {{ waitlistPagination.pages }}
              </div>
            </div>

            <div v-if="waitlistLoading" class="py-12 text-center text-white/70">
              <v-progress-circular indeterminate color="cyan" class="mb-4" />
              <p>Warteliste wird geladen…</p>
            </div>

            <div v-else class="space-y-4">
              <v-table v-if="waitlistEntries.length" density="comfortable" class="text-sm text-white/80">
                <thead>
                  <tr class="text-xs uppercase tracking-[0.3em] text-white/40">
                    <th class="font-semibold">Kontakt</th>
                    <th class="font-semibold">Beigetreten</th>
                    <th class="font-semibold">Opt-In</th>
                    <th class="font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="entry in waitlistEntries" :key="entry.id" class="align-top">
                    <td class="space-y-2">
                      <div class="font-medium text-white">{{ entry.email }}</div>
                      <div v-if="entry.name" class="text-xs text-white/60">{{ entry.name }}</div>
                      <div v-if="entry.notes" class="text-xs text-white/50">{{ entry.notes }}</div>
                      <div class="flex flex-wrap gap-2 text-[11px] text-white/40">
                        <span>Quelle: {{ entry.source || 'landing' }}</span>
                      </div>
                    </td>
                    <td>
                      <div>{{ formatDateTime(entry.joinedAt) }}</div>
                      <div class="text-xs text-white/50">{{ formatRelative(entry.joinedAt) }}</div>
                    </td>
                    <td>
                      <div class="flex flex-wrap gap-2">
                        <v-chip size="x-small" color="cyan" variant="outlined">Warteliste</v-chip>
                        <v-chip
                          v-if="entry.wantsProductUpdates"
                          size="x-small"
                          color="cyan"
                          variant="tonal"
                        >
                          Updates
                        </v-chip>
                      </div>
                      <div v-if="entry.updatesOptedInAt" class="mt-1 text-[11px] text-white/50">
                        seit {{ formatDateTime(entry.updatesOptedInAt) }}
                      </div>
                    </td>
                    <td>
                      <v-chip
                        size="small"
                        :color="entry.activatedAt ? 'green' : 'orange'"
                        variant="tonal"
                        class="text-xs"
                      >
                        <template v-if="entry.activatedAt">
                          Aktiviert · {{ formatRelative(entry.activatedAt) }}
                        </template>
                        <template v-else>
                          Wartet auf Zugang
                        </template>
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <p v-else class="py-12 text-center text-sm text-white/60">Keine Wartelisten-Einträge gefunden.</p>

              <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div class="text-xs text-white/50">
                  Seite {{ waitlistPagination.page }} von {{ waitlistPagination.pages }} · {{ waitlistPagination.total }} Einträge
                </div>
                <div class="flex items-center gap-2">
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="waitlistPagination.page <= 1"
                    @click="changeWaitlistPage(waitlistPagination.page - 1)"
                  >
                    Zurück
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="waitlistPagination.page >= waitlistPagination.pages"
                    @click="changeWaitlistPage(waitlistPagination.page + 1)"
                  >
                    Weiter
                  </v-btn>
                </div>
              </div>
            </div>
          </section>
        </v-window-item>

        <v-window-item value="logs">
          <section class="space-y-6">
            <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div class="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <v-text-field
                  v-model="logSearch"
                  label="Funktext durchsuchen"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                />
                <v-select
                  v-model="logChannel"
                  :items="logChannelOptions"
                  label="Kanal"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                />
                <v-select
                  v-model="logDirection"
                  :items="logDirectionOptions"
                  label="Richtung"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                />
                <v-select
                  v-model="logRole"
                  :items="logRoleOptions"
                  label="Rolle"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                />
                <v-select
                  v-model="logTimeframe"
                  :items="logTimeframeOptions"
                  label="Zeitraum"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                />
                <v-btn color="cyan" variant="tonal" :loading="logLoading" @click="fetchLogs(true)">
                  Filter anwenden
                </v-btn>
              </div>
              <div class="text-xs text-white/50">
                {{ logPagination.total }} Einträge · Seite {{ logPagination.page }} von {{ logPagination.pages }}
              </div>
            </div>

            <v-alert
              v-if="logError"
              type="warning"
              variant="tonal"
              border="start"
              density="comfortable"
              class="bg-red-500/10 text-red-100"
            >
              {{ logError }}
            </v-alert>

            <div v-if="logLoading" class="py-12 text-center text-white/70">
              <v-progress-circular indeterminate color="cyan" class="mb-4" />
              <p>Funkprotokolle werden geladen…</p>
            </div>

            <div v-else class="space-y-4">
              <div v-if="logs.length" class="space-y-3">
                <v-card
                  v-for="entry in logs"
                  :key="entry.id"
                  class="border border-white/10 bg-black/40"
                >
                  <v-card-text class="space-y-3">
                    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40">
                        <v-chip size="x-small" color="cyan" variant="outlined">{{ entry.channel }}</v-chip>
                        <v-chip size="x-small" color="cyan" variant="tonal">{{ entry.direction }}</v-chip>
                        <v-chip size="x-small" color="cyan" variant="text">{{ entry.role }}</v-chip>
                        <span v-if="entry.user">User: {{ entry.user.email }}</span>
                      </div>
                      <span class="text-xs text-white/50">{{ formatDateTime(entry.createdAt) }}</span>
                    </div>
                    <p class="font-mono text-sm text-white">{{ entry.text }}</p>
                    <p v-if="entry.normalized" class="rounded-lg bg-white/5 p-2 text-xs text-white/60">
                      <strong class="text-white/70">Normalized:</strong> {{ entry.normalized }}
                    </p>
                    <div class="flex flex-wrap gap-3 text-xs text-white/50">
                      <span v-if="entry.metadata?.moduleId">Modul {{ entry.metadata.moduleId }}</span>
                      <span v-if="entry.metadata?.lessonId">Lesson {{ entry.metadata.lessonId }}</span>
                      <span v-if="entry.metadata?.autoDecide !== undefined">
                        Auto Decision: {{ entry.metadata.autoDecide ? 'Ja' : 'Nein' }}
                      </span>
                    </div>
                    <div class="flex items-center justify-end">
                      <v-btn
                        variant="text"
                        color="cyan"
                        size="small"
                        prepend-icon="mdi-timeline-text"
                        @click="toggleLog(entry.id)"
                      >
                        {{ expandedLog === entry.id ? 'Tracer schließen' : 'Tracer öffnen' }}
                      </v-btn>
                    </div>
                    <v-expand-transition>
                      <div
                        v-if="expandedLog === entry.id"
                        class="space-y-3 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-xs text-white/80"
                      >
                        <div v-if="entry.metadata?.decision" class="space-y-2">
                          <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/80">LLM Decision Summary</p>
                          <div class="grid gap-2 md:grid-cols-2">
                            <div class="rounded-lg border border-white/10 bg-black/30 p-3">
                              <p class="text-[11px] text-white/50">Next State</p>
                              <p class="font-mono text-sm">{{ entry.metadata.decision.next_state || '—' }}</p>
                            </div>
                            <div class="rounded-lg border border-white/10 bg-black/30 p-3">
                              <p class="text-[11px] text-white/50">Controller</p>
                              <p class="font-mono text-sm">{{ entry.metadata.decision.controller_say_tpl || '—' }}</p>
                            </div>
                          </div>
                          <div class="flex flex-wrap gap-2 text-[11px] text-white/70">
                            <v-chip size="x-small" color="cyan" variant="outlined">
                              Off-Schema: {{ entry.metadata.decision.off_schema ? 'Ja' : 'Nein' }}
                            </v-chip>
                            <v-chip size="x-small" color="cyan" variant="outlined">
                              Radio Check: {{ entry.metadata.decision.radio_check ? 'Ja' : 'Nein' }}
                            </v-chip>
                          </div>
                        </div>
                        <div v-if="entry.metadata?.decisionTrace?.calls?.length" class="space-y-3">
                          <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/80">OpenAI Decision Calls</p>
                          <div
                            v-for="(call, index) in entry.metadata.decisionTrace.calls"
                            :key="index"
                            class="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3"
                          >
                            <div class="flex items-center justify-between text-[11px] text-white/60">
                              <span>
                                Schritt: {{ call.stage === 'decision' ? 'Decision' : 'Readback-Check' }}
                              </span>
                              <span v-if="call.error" class="text-red-300">Fehler beim Aufruf</span>
                            </div>
                            <div>
                              <p class="text-[11px] text-white/50">Request</p>
                              <pre class="trace-json">{{ formatJson(call.request) }}</pre>
                            </div>
                            <div v-if="call.response">
                              <p class="text-[11px] text-white/50">Response</p>
                              <pre class="trace-json">{{ formatJson(call.response) }}</pre>
                            </div>
                            <div v-else class="rounded-lg border border-white/10 bg-black/40 p-2 text-[11px] text-white/60">
                              Keine Antwort erhalten.
                            </div>
                            <div v-if="call.rawResponseText" class="space-y-1">
                              <p class="text-[11px] text-white/50">Raw Response</p>
                              <pre class="trace-json">{{ call.rawResponseText }}</pre>
                            </div>
                            <v-alert
                              v-if="call.error"
                              type="warning"
                              variant="tonal"
                              density="compact"
                              class="bg-red-500/10 text-red-100"
                            >
                              {{ call.error }}
                            </v-alert>
                          </div>
                          <div
                            v-if="entry.metadata.decisionTrace.fallback?.used"
                            class="space-y-1 rounded-xl border border-orange-400/40 bg-orange-500/10 p-3 text-[11px] text-orange-100"
                          >
                            <p class="text-xs uppercase tracking-[0.3em] text-orange-200/80">Fallback aktiviert</p>
                            <p>
                              Grund: {{ entry.metadata.decisionTrace.fallback.reason || 'unbekannt' }}
                              <span v-if="entry.metadata.decisionTrace.fallback.selected">
                                · Pfad: {{ entry.metadata.decisionTrace.fallback.selected }}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div>
                          <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Metadata</p>
                          <pre class="trace-json">{{ formatJson(entry.metadata) }}</pre>
                        </div>
                      </div>
                    </v-expand-transition>
                  </v-card-text>
                </v-card>
              </div>
              <p v-else class="py-12 text-center text-sm text-white/60">Keine Funkprotokolle gefunden.</p>

              <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div class="text-xs text-white/50">
                  Seite {{ logPagination.page }} von {{ logPagination.pages }} · {{ logPagination.total }} Logs
                </div>
                <div class="flex items-center gap-2">
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="logPagination.page <= 1"
                    @click="changeLogPage(logPagination.page - 1)"
                  >
                    Zurück
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="logPagination.page >= logPagination.pages"
                    @click="changeLogPage(logPagination.page + 1)"
                  >
                    Weiter
                  </v-btn>
                </div>
              </div>
            </div>
          </section>
        </v-window-item>
      </v-window>
    </div>

    <v-dialog v-model="showCreateInvite" max-width="480" persistent>
      <v-card class="border border-white/10 bg-[#0b1526] text-white">
        <v-card-title class="text-lg font-semibold">Einladungscode erstellen</v-card-title>
        <v-card-text class="space-y-4">
          <p class="text-sm text-white/70">
            Der Code wird sofort aktiv und läuft standardmäßig nach 30 Tagen ab. Optional kann ein Label gesetzt werden.
          </p>
          <v-text-field
            v-model="newInviteLabel"
            label="Label (optional)"
            density="comfortable"
            variant="outlined"
            color="cyan"
            maxlength="80"
            counter="80"
            hide-details="auto"
          />
          <v-slider
            v-model="newInviteExpiry"
            :min="7"
            :max="120"
            :step="1"
            color="cyan"
            thumb-label="always"
            label="Gültigkeit in Tagen"
          />
          <v-alert
            v-if="createInviteError"
            type="warning"
            variant="tonal"
            density="compact"
            class="bg-red-500/10 text-red-100"
          >
            {{ createInviteError }}
          </v-alert>
          <v-sheet v-if="createInviteResult" class="space-y-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4">
            <p class="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Neuer Code</p>
            <p class="font-mono text-3xl tracking-widest text-white">{{ createInviteResult.code }}</p>
            <p class="text-xs text-white/60">Gültig bis {{ formatDateTime(createInviteResult.expiresAt) }}</p>
          </v-sheet>
        </v-card-text>
        <v-card-actions class="justify-between">
          <v-btn variant="text" color="white" @click="closeCreateInvite">Abbrechen</v-btn>
          <v-btn color="cyan" variant="flat" :loading="createInviteLoading" @click="submitCreateInvite">
            Code generieren
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { useHead } from '#imports'

interface OverviewUser {
  id: string
  email: string
  name?: string
  role: string
  createdAt: string
  lastLoginAt?: string
}

interface OverviewInvitation {
  id: string
  code: string
  channel: string
  label?: string
  createdAt: string
  expiresAt?: string
  usedAt?: string
}

interface OverviewTransmission {
  id: string
  role: string
  channel: string
  direction: string
  text: string
  normalized?: string
  createdAt: string
}

interface OverviewData {
  generatedAt: string
  users: {
    total: number
    admins: number
    devs: number
    newLast7Days: number
    recent: OverviewUser[]
  }
  invitations: {
    total: number
    active: number
    expiringSoon: number
    recent: OverviewInvitation[]
  }
  transmissions: {
    total: number
    last24h: number
    byChannel: Record<string, number>
    byRole: Record<string, number>
    recent: OverviewTransmission[]
  }
}

interface AdminUser extends OverviewUser {
  invitationCodesIssued: number
}

interface UsersResponse {
  items: AdminUser[]
  pagination: { total: number; page: number; pageSize: number; pages: number }
  roles: { user: number; admin: number; dev: number }
}

interface InvitationItem extends OverviewInvitation {
  createdBy?: { id: string; email: string; name?: string; role: string }
  usedBy?: { id: string; email: string; name?: string; role: string }
}

interface InvitationsResponse {
  items: InvitationItem[]
  pagination: { total: number; page: number; pageSize: number; pages: number }
}

interface TransmissionUser {
  id: string
  email: string
  name?: string
  role: string
}

interface TransmissionEntry {
  id: string
  role: string
  channel: string
  direction: string
  text: string
  normalized?: string
  createdAt: string
  metadata?: Record<string, any>
  user?: TransmissionUser
}

interface LogsResponse {
  items: TransmissionEntry[]
  pagination: { total: number; page: number; pageSize: number; pages: number }
}

interface WaitlistEntryItem {
  id: string
  email: string
  name?: string
  notes?: string
  source?: string
  joinedAt: string
  activatedAt?: string
  wantsProductUpdates: boolean
  updatesOptedInAt?: string
}

interface WaitlistStatsSummary {
  total: number
  updates: number
  activated: number
  pending: number
}

interface WaitlistResponse {
  items: WaitlistEntryItem[]
  pagination: { total: number; page: number; pageSize: number; pages: number }
  stats: WaitlistStatsSummary
}

interface CreateInviteResponse {
  success: boolean
  invitation: {
    id: string
    code: string
    label?: string
    expiresAt?: string
  }
}

definePageMeta({ middleware: 'require-admin' })
useHead({ title: 'Admin • OpenSquawk' })

const auth = useAuthStore()
const api = useApi()

const activeTab = ref<'overview' | 'users' | 'invitations' | 'waitlist' | 'logs'>('overview')
const refreshing = ref(false)

const overview = ref<OverviewData | null>(null)
const overviewLoading = ref(false)
const overviewError = ref('')

const users = ref<AdminUser[]>([])
const userPagination = reactive({ total: 0, page: 1, pages: 1, pageSize: 12 })
const userLoading = ref(false)
const userError = ref('')
const userSearch = ref('')
const userRoleFilter = ref<'all' | 'user' | 'admin' | 'dev'>('all')
const userRoleStats = reactive({ user: 0, admin: 0, dev: 0 })
const userRoleFilterOptions = [
  { title: 'Alle Rollen', value: 'all' },
  { title: 'User', value: 'user' },
  { title: 'Developer', value: 'dev' },
  { title: 'Admin', value: 'admin' },
]
const userRoleEditOptions = [
  { title: 'User', value: 'user' },
  { title: 'Developer', value: 'dev' },
  { title: 'Admin', value: 'admin' },
]
const userRoleUpdating = ref<string | null>(null)
const userRoleDraft = reactive<Record<string, 'user' | 'admin' | 'dev'>>({})

const invitations = ref<InvitationItem[]>([])
const invitationPagination = reactive({ total: 0, page: 1, pages: 1, pageSize: 12 })
const invitationLoading = ref(false)
const invitationError = ref('')
const invitationSearch = ref('')
const invitationStatus = ref<'all' | 'active' | 'used' | 'expired'>('active')
const invitationChannel = ref<'all' | 'user' | 'manual' | 'bootstrap' | 'admin'>('all')
const invitationStatusOptions = [
  { title: 'Alle Status', value: 'all' },
  { title: 'Aktiv', value: 'active' },
  { title: 'Verwendet', value: 'used' },
  { title: 'Abgelaufen', value: 'expired' },
]
const invitationChannelOptions = [
  { title: 'Alle Kanäle', value: 'all' },
  { title: 'User', value: 'user' },
  { title: 'Admin', value: 'admin' },
  { title: 'Manuell', value: 'manual' },
  { title: 'Bootstrap', value: 'bootstrap' },
]

const waitlistEntries = ref<WaitlistEntryItem[]>([])
const waitlistPagination = reactive({ total: 0, page: 1, pages: 1, pageSize: 15 })
const waitlistLoading = ref(false)
const waitlistError = ref('')
const waitlistSearch = ref('')
const waitlistSubscription = ref<'all' | 'waitlist' | 'updates'>('all')
const waitlistStatus = ref<'all' | 'pending' | 'activated'>('all')
const waitlistSubscriptionOptions = [
  { title: 'Alle Opt-Ins', value: 'all' },
  { title: 'Nur Warteliste', value: 'waitlist' },
  { title: 'Updates-Opt-in', value: 'updates' },
]
const waitlistStatusOptions = [
  { title: 'Alle Status', value: 'all' },
  { title: 'Wartend', value: 'pending' },
  { title: 'Aktiviert', value: 'activated' },
]
const waitlistStats = reactive<WaitlistStatsSummary>({ total: 0, updates: 0, activated: 0, pending: 0 })

const logs = ref<TransmissionEntry[]>([])
const logPagination = reactive({ total: 0, page: 1, pages: 1, pageSize: 15 })
const logLoading = ref(false)
const logError = ref('')
const logSearch = ref('')
const logChannel = ref<'all' | 'ptt' | 'say' | 'text'>('all')
const logDirection = ref<'all' | 'incoming' | 'outgoing'>('all')
const logRole = ref<'all' | 'pilot' | 'atc'>('all')
const logTimeframe = ref<'24h' | '7d' | '30d' | 'all'>('24h')
const logChannelOptions = [
  { title: 'Alle Kanäle', value: 'all' },
  { title: 'PTT', value: 'ptt' },
  { title: 'Say', value: 'say' },
  { title: 'Text', value: 'text' },
]
const logDirectionOptions = [
  { title: 'Alle Richtungen', value: 'all' },
  { title: 'Incoming', value: 'incoming' },
  { title: 'Outgoing', value: 'outgoing' },
]
const logRoleOptions = [
  { title: 'Alle Rollen', value: 'all' },
  { title: 'Pilot', value: 'pilot' },
  { title: 'ATC', value: 'atc' },
]
const logTimeframeOptions = [
  { title: 'Letzte 24 Stunden', value: '24h' },
  { title: '7 Tage', value: '7d' },
  { title: '30 Tage', value: '30d' },
  { title: 'Alles', value: 'all' },
]
const expandedLog = ref<string | null>(null)

const showCreateInvite = ref(false)
const newInviteLabel = ref('')
const newInviteExpiry = ref(30)
const createInviteLoading = ref(false)
const createInviteError = ref('')
const createInviteResult = ref<{ code: string; expiresAt?: string } | null>(null)

const usersLoaded = ref(false)
const invitationsLoaded = ref(false)
const waitlistLoaded = ref(false)
const logsLoaded = ref(false)

let userSearchTimeout: ReturnType<typeof setTimeout> | undefined
let invitationSearchTimeout: ReturnType<typeof setTimeout> | undefined
let logSearchTimeout: ReturnType<typeof setTimeout> | undefined
let waitlistSearchTimeout: ReturnType<typeof setTimeout> | undefined

function extractErrorMessage(error: any, fallback: string) {
  return (
    error?.data?.statusMessage ||
    error?.data?.message ||
    error?.statusMessage ||
    error?.message ||
    fallback
  )
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return value
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelative(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return value
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes < 1) return 'vor wenigen Sekunden'
  if (diffMinutes < 60) return `vor ${diffMinutes} Min`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `vor ${diffHours} Std`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `vor ${diffDays} Tagen`
  return formatDateTime(value)
}

function formatJson(value?: any) {
  if (!value) return '{}'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false
  const date = new Date(expiresAt)
  if (Number.isNaN(date.valueOf())) return false
  return date.getTime() < Date.now()
}

function invitationStatusLabel(inv: InvitationItem) {
  if (inv.usedAt) return `verwendet ${formatRelative(inv.usedAt)}`
  if (inv.expiresAt && isExpired(inv.expiresAt)) return 'abgelaufen'
  return 'aktiv'
}

function computeSince(timeframe: '24h' | '7d' | '30d' | 'all') {
  const now = Date.now()
  if (timeframe === '24h') return new Date(now - 24 * 60 * 60 * 1000)
  if (timeframe === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000)
  if (timeframe === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000)
  return null
}

async function loadOverview(force = false) {
  if (overview.value && !force) return
  overviewLoading.value = true
  overviewError.value = ''
  try {
    overview.value = await api.get<OverviewData>('/api/admin/overview')
  } catch (error) {
    overviewError.value = extractErrorMessage(error, 'Übersicht konnte nicht geladen werden.')
  } finally {
    overviewLoading.value = false
  }
}

async function fetchUsers(resetPage = false) {
  if (resetPage) {
    userPagination.page = 1
  }
  userLoading.value = true
  userError.value = ''
  try {
    const query: Record<string, any> = {
      page: userPagination.page,
      pageSize: userPagination.pageSize,
    }
    if (userSearch.value.trim()) query.search = userSearch.value.trim()
    if (userRoleFilter.value !== 'all') query.role = userRoleFilter.value
    const response = await api.get<UsersResponse>('/api/admin/users', { query })
    users.value = response.items
    response.items.forEach((user) => {
      userRoleDraft[user.id] = user.role as 'user' | 'admin' | 'dev'
    })
    Object.assign(userPagination, response.pagination)
    Object.assign(userRoleStats, response.roles)
    usersLoaded.value = true
  } catch (error) {
    userError.value = extractErrorMessage(error, 'Nutzerliste konnte nicht geladen werden.')
  } finally {
    userLoading.value = false
  }
}

function changeUserPage(page: number) {
  if (page < 1 || page > userPagination.pages) return
  userPagination.page = page
  fetchUsers()
}

async function applyRoleChange(userId: string) {
  const newRole = userRoleDraft[userId]
  const target = users.value.find((u) => u.id === userId)
  if (!target || newRole === target.role) return
  userRoleUpdating.value = userId
  try {
    await api.request(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: { role: newRole },
    })
    await fetchUsers()
  } catch (error) {
    userError.value = extractErrorMessage(error, 'Rolle konnte nicht aktualisiert werden.')
  } finally {
    userRoleUpdating.value = null
  }
}

async function fetchInvitations(resetPage = false) {
  if (resetPage) {
    invitationPagination.page = 1
  }
  invitationLoading.value = true
  invitationError.value = ''
  try {
    const query: Record<string, any> = {
      page: invitationPagination.page,
      pageSize: invitationPagination.pageSize,
    }
    if (invitationSearch.value.trim()) query.search = invitationSearch.value.trim()
    if (invitationStatus.value !== 'all') query.status = invitationStatus.value
    if (invitationChannel.value !== 'all') query.channel = invitationChannel.value
    const response = await api.get<InvitationsResponse>('/api/admin/invitations', { query })
    invitations.value = response.items
    Object.assign(invitationPagination, response.pagination)
    invitationsLoaded.value = true
  } catch (error) {
    invitationError.value = extractErrorMessage(error, 'Einladungen konnten nicht geladen werden.')
  } finally {
    invitationLoading.value = false
  }
}

function changeInvitationPage(page: number) {
  if (page < 1 || page > invitationPagination.pages) return
  invitationPagination.page = page
  fetchInvitations()
}

function computeWaitlistQuery() {
  const query: Record<string, any> = {
    page: waitlistPagination.page,
    pageSize: waitlistPagination.pageSize,
  }
  if (waitlistSearch.value.trim()) query.search = waitlistSearch.value.trim()
  if (waitlistSubscription.value !== 'all') query.updates = waitlistSubscription.value
  if (waitlistStatus.value !== 'all') query.status = waitlistStatus.value
  return query
}

async function fetchWaitlist(resetPage = false) {
  if (resetPage) {
    waitlistPagination.page = 1
  }
  waitlistLoading.value = true
  waitlistError.value = ''
  try {
    const response = await api.get<WaitlistResponse>('/api/admin/waitlist', {
      query: computeWaitlistQuery(),
    })
    waitlistEntries.value = response.items
    Object.assign(waitlistPagination, response.pagination)
    if (response.stats) {
      Object.assign(waitlistStats, response.stats)
    }
    waitlistLoaded.value = true
  } catch (error) {
    waitlistError.value = extractErrorMessage(error, 'Warteliste konnte nicht geladen werden.')
  } finally {
    waitlistLoading.value = false
  }
}

function changeWaitlistPage(page: number) {
  if (page < 1 || page > waitlistPagination.pages) return
  waitlistPagination.page = page
  fetchWaitlist()
}

function computeLogQuery() {
  const query: Record<string, any> = {
    page: logPagination.page,
    pageSize: logPagination.pageSize,
  }
  if (logSearch.value.trim()) query.search = logSearch.value.trim()
  if (logChannel.value !== 'all') query.channel = logChannel.value
  if (logDirection.value !== 'all') query.direction = logDirection.value
  if (logRole.value !== 'all') query.role = logRole.value
  const since = computeSince(logTimeframe.value)
  if (since) query.since = since.toISOString()
  return query
}

async function fetchLogs(resetPage = false) {
  if (resetPage) {
    logPagination.page = 1
  }
  logLoading.value = true
  logError.value = ''
  try {
    const response = await api.get<LogsResponse>('/api/admin/logs/transmissions', {
      query: computeLogQuery(),
    })
    logs.value = response.items
    Object.assign(logPagination, response.pagination)
    logsLoaded.value = true
  } catch (error) {
    logError.value = extractErrorMessage(error, 'Funkprotokolle konnten nicht geladen werden.')
  } finally {
    logLoading.value = false
  }
}

function changeLogPage(page: number) {
  if (page < 1 || page > logPagination.pages) return
  logPagination.page = page
  fetchLogs()
}

function toggleLog(id: string) {
  expandedLog.value = expandedLog.value === id ? null : id
}

async function submitCreateInvite() {
  createInviteLoading.value = true
  createInviteError.value = ''
  try {
    const response = await api.post<CreateInviteResponse>('/api/admin/invitations', {
      label: newInviteLabel.value.trim() || undefined,
      expiresInDays: newInviteExpiry.value,
    })
    createInviteResult.value = {
      code: response.invitation.code,
      expiresAt: response.invitation.expiresAt,
    }
    newInviteLabel.value = ''
    await fetchInvitations(true)
  } catch (error) {
    createInviteError.value = extractErrorMessage(error, 'Einladungscode konnte nicht erstellt werden.')
  } finally {
    createInviteLoading.value = false
  }
}

function closeCreateInvite() {
  showCreateInvite.value = false
  createInviteError.value = ''
  createInviteResult.value = null
  newInviteLabel.value = ''
  newInviteExpiry.value = 30
}

async function refreshActiveTab() {
  refreshing.value = true
  try {
    if (activeTab.value === 'overview') {
      await loadOverview(true)
    } else if (activeTab.value === 'users') {
      await fetchUsers(true)
    } else if (activeTab.value === 'invitations') {
      await fetchInvitations(true)
    } else if (activeTab.value === 'waitlist') {
      await fetchWaitlist(true)
    } else {
      await fetchLogs(true)
    }
  } finally {
    refreshing.value = false
  }
}

watch(userRoleFilter, () => fetchUsers(true))
watch(invitationStatus, () => fetchInvitations(true))
watch(invitationChannel, () => fetchInvitations(true))
watch(waitlistSubscription, () => fetchWaitlist(true))
watch(waitlistStatus, () => fetchWaitlist(true))
watch(logChannel, () => fetchLogs(true))
watch(logDirection, () => fetchLogs(true))
watch(logRole, () => fetchLogs(true))
watch(logTimeframe, () => fetchLogs(true))

watch(userSearch, () => {
  if (userSearchTimeout) clearTimeout(userSearchTimeout)
  userSearchTimeout = setTimeout(() => fetchUsers(true), 400)
})

watch(invitationSearch, () => {
  if (invitationSearchTimeout) clearTimeout(invitationSearchTimeout)
  invitationSearchTimeout = setTimeout(() => fetchInvitations(true), 400)
})

watch(waitlistSearch, () => {
  if (waitlistSearchTimeout) clearTimeout(waitlistSearchTimeout)
  waitlistSearchTimeout = setTimeout(() => fetchWaitlist(true), 400)
})

watch(logSearch, () => {
  if (logSearchTimeout) clearTimeout(logSearchTimeout)
  logSearchTimeout = setTimeout(() => fetchLogs(true), 400)
})

watch(activeTab, (tab) => {
  if (tab === 'overview') {
    loadOverview()
  } else if (tab === 'users' && !usersLoaded.value) {
    fetchUsers(true)
  } else if (tab === 'invitations' && !invitationsLoaded.value) {
    fetchInvitations(true)
  } else if (tab === 'waitlist' && !waitlistLoaded.value) {
    fetchWaitlist(true)
  } else if (tab === 'logs' && !logsLoaded.value) {
    fetchLogs(true)
  }
})

onMounted(() => {
  loadOverview(true)
})
</script>
<style scoped>
.trace-json {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  white-space: pre-wrap;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.4;
}
</style>
