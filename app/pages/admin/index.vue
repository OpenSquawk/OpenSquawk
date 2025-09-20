<template>
  <div class="min-h-screen bg-[#050910] pb-20 text-white">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6 lg:px-8">
      <header class="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-[0.4em] text-cyan-300/70">OpenSquawk</p>
          <h1 class="text-3xl font-semibold">Admin Operations Center</h1>
          <p class="text-sm text-white/70">
            Complete overview of users, invitation codes and radio logs with live tracing.
          </p>
        </div>
        <div class="flex flex-col items-start gap-3 text-sm text-white/70 sm:items-end">
          <div class="flex items-center gap-2 text-white/80">
            <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>
              Signed in as <strong>{{ auth.user?.email }}</strong>
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
            Refresh data
          </v-btn>
        </div>
      </header>

      <v-tabs
        v-model="activeTab"
        class="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
        slider-color="cyan"
        density="comfortable"
      >
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="users">Users</v-tab>
        <v-tab value="invitations">Invitations</v-tab>
        <v-tab value="waitlist">Waitlist</v-tab>
        <v-tab value="logs">Transmissions</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <v-window-item value="overview">
          <section class="space-y-6">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h2 class="text-2xl font-semibold">System metrics</h2>
                <p class="text-sm text-white/70">Last updated: {{ formatDateTime(overview?.generatedAt) }}</p>
              </div>
              <v-chip v-if="overviewLoading" color="cyan" variant="tonal" size="small">loading…</v-chip>
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
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">New (7 days)</p>
                      <p class="text-xl font-semibold text-emerald-300">{{ overview.users.newLast7Days }}</p>
                    </div>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Latest accounts</p>
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
                    <h3 class="text-lg font-semibold">Invitation codes</h3>
                    <v-chip size="small" color="cyan" variant="outlined">{{ overview.invitations.total }}</v-chip>
                  </div>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">Active</p>
                      <p class="text-xl font-semibold text-white">{{ overview.invitations.active }}</p>
                    </div>
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">Expires in 7 days</p>
                      <p class="text-xl font-semibold text-orange-300">{{ overview.invitations.expiringSoon }}</p>
                    </div>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Latest codes</p>
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
                          Valid until {{ formatDateTime(inv.expiresAt) }}
                        </p>
                      </li>
                    </ul>
                  </div>
                </v-card-text>
              </v-card>

              <v-card class="bg-black/40">
                <v-card-text class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Radio logs</h3>
                    <v-chip size="small" color="cyan" variant="outlined">{{ overview.transmissions.total }}</v-chip>
                  </div>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">24h</p>
                      <p class="text-xl font-semibold text-white">{{ overview.transmissions.last24h }}</p>
                    </div>
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">Channels</p>
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
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Latest transmissions</p>
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
              <p>Loading data…</p>
            </div>
          </section>
        </v-window-item>

        <v-window-item value="users">
          <section class="space-y-6">
            <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div class="flex flex-1 flex-col gap-4 md:flex-row md:items-end">
                <v-text-field
                  v-model="userSearch"
                  label="Search users"
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
                  label="Filter by role"
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
                  Apply
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
              <p>Loading user data…</p>
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
                        <span>Invitations created: {{ user.invitationCodesIssued }}</span>
                        <span v-if="user.lastLoginAt">Last login: {{ formatRelative(user.lastLoginAt) }}</span>
                      </div>
                    </div>
                    <div class="flex flex-col items-start gap-2 md:items-end">
                      <v-select
                        v-model="userRoleDraft[user.id]"
                        :items="userRoleEditOptions"
                        label="Role"
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
                        Update role
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
              <p v-else class="py-12 text-center text-sm text-white/60">No users found.</p>

              <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div class="text-xs text-white/50">
                  Page {{ userPagination.page }} of {{ userPagination.pages }} · {{ userPagination.total }} entries
                </div>
                <div class="flex items-center gap-2">
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="userPagination.page <= 1"
                    @click="changeUserPage(userPagination.page - 1)"
                  >
                    Back
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="userPagination.page >= userPagination.pages"
                    @click="changeUserPage(userPagination.page + 1)"
                  >
                    Next
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
                  label="Search code or label"
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
                  label="Channel"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                  class="md:w-48"
                />
              </div>
              <div class="flex items-center gap-3">
                <v-btn color="cyan" variant="outlined" prepend-icon="mdi-plus" @click="showCreateInvite = true">
                  Create invitation code
                </v-btn>
                <v-btn color="cyan" variant="tonal" :loading="invitationLoading" @click="fetchInvitations(true)">
                  Apply
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
              <p>Loading invitation codes…</p>
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
                      <span v-if="inv.expiresAt">Valid until {{ formatDateTime(inv.expiresAt) }}</span>
                      <span v-if="inv.createdBy">Created by {{ inv.createdBy.email }}</span>
                      <span v-if="inv.usedBy">Used by {{ inv.usedBy.email }}</span>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
              <p v-else class="py-12 text-center text-sm text-white/60">No invitations found.</p>

              <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div class="text-xs text-white/50">
                  Page {{ invitationPagination.page }} of {{ invitationPagination.pages }} · {{ invitationPagination.total }} codes
                </div>
                <div class="flex items-center gap-2">
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="invitationPagination.page <= 1"
                    @click="changeInvitationPage(invitationPagination.page - 1)"
                  >
                    Back
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="invitationPagination.page >= invitationPagination.pages"
                    @click="changeInvitationPage(invitationPagination.page + 1)"
                  >
                    Next
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
                <h2 class="text-2xl font-semibold">Waitlist</h2>
                <p class="text-sm text-white/70">
                  Total: {{ waitlistStats.total }} · Updates: {{ waitlistStats.updates }} · Activated: {{ waitlistStats.activated }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2 text-xs text-white/60">
                <v-chip size="small" color="cyan" variant="outlined">Total: {{ waitlistStats.total }}</v-chip>
                <v-chip size="small" color="cyan" variant="text">Updates: {{ waitlistStats.updates }}</v-chip>
                <v-chip size="small" color="cyan" variant="text">Activated: {{ waitlistStats.activated }}</v-chip>
                <v-chip size="small" color="cyan" variant="text">Pending: {{ waitlistStats.pending }}</v-chip>
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
                  label="Name, email or notes"
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
                  label="Opt-in"
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
                  Apply filters
                </v-btn>
              </div>
              <div class="text-xs text-white/50">
                {{ waitlistPagination.total }} entries · Page {{ waitlistPagination.page }} of {{ waitlistPagination.pages }}
              </div>
            </div>

            <div v-if="waitlistLoading" class="py-12 text-center text-white/70">
              <v-progress-circular indeterminate color="cyan" class="mb-4" />
              <p>Loading waitlist…</p>
            </div>

            <div v-else class="space-y-4">
              <v-table v-if="waitlistEntries.length" density="comfortable" class="text-sm text-white/80">
                <thead>
                  <tr class="text-xs uppercase tracking-[0.3em] text-white/40">
                    <th class="font-semibold">Contact</th>
                    <th class="font-semibold">Joined</th>
                    <th class="font-semibold">Opt-in</th>
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
                        <span>Source: {{ entry.source || 'landing' }}</span>
                      </div>
                    </td>
                    <td>
                      <div>{{ formatDateTime(entry.joinedAt) }}</div>
                      <div class="text-xs text-white/50">{{ formatRelative(entry.joinedAt) }}</div>
                    </td>
                    <td>
                      <div class="flex flex-wrap gap-2">
                        <v-chip size="x-small" color="cyan" variant="outlined">Waitlist</v-chip>
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
                        since {{ formatDateTime(entry.updatesOptedInAt) }}
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
                          Activated · {{ formatRelative(entry.activatedAt) }}
                        </template>
                        <template v-else>
                          Waiting for access
                        </template>
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <p v-else class="py-12 text-center text-sm text-white/60">No waitlist entries found.</p>

              <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div class="text-xs text-white/50">
                  Page {{ waitlistPagination.page }} of {{ waitlistPagination.pages }} · {{ waitlistPagination.total }} entries
                </div>
                <div class="flex items-center gap-2">
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="waitlistPagination.page <= 1"
                    @click="changeWaitlistPage(waitlistPagination.page - 1)"
                  >
                    Back
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="waitlistPagination.page >= waitlistPagination.pages"
                    @click="changeWaitlistPage(waitlistPagination.page + 1)"
                  >
                    Next
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
                  label="Search radio transcripts"
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
                  label="Channel"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                />
                <v-select
                  v-model="logDirection"
                  :items="logDirectionOptions"
                  label="Direction"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                />
                <v-select
                  v-model="logRole"
                  :items="logRoleOptions"
                  label="Role"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                />
                <v-select
                  v-model="logTimeframe"
                  :items="logTimeframeOptions"
                  label="Timeframe"
                  density="comfortable"
                  variant="outlined"
                  color="cyan"
                  hide-details
                />
                <v-btn color="cyan" variant="tonal" :loading="logLoading" @click="fetchLogs(true)">
                  Apply filters
                </v-btn>
              </div>
              <div class="text-xs text-white/50">
                {{ logPagination.total }} entries · Page {{ logPagination.page }} of {{ logPagination.pages }}
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
              <p>Loading radio logs…</p>
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
                      <span v-if="entry.metadata?.moduleId">Module {{ entry.metadata.moduleId }}</span>
                      <span v-if="entry.metadata?.lessonId">Lesson {{ entry.metadata.lessonId }}</span>
                      <span v-if="entry.metadata?.autoDecide !== undefined">
                        Auto Decision: {{ entry.metadata.autoDecide ? 'Yes' : 'No' }}
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
                        {{ expandedLog === entry.id ? 'Close tracer' : 'Open tracer' }}
                      </v-btn>
                    </div>
                    <v-expand-transition>
                      <div
                        v-if="expandedLog === entry.id"
                        class="space-y-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-xs text-white/80"
                      >
                        <div v-if="entry.metadata?.decision" class="space-y-3">
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
                              Off-script: {{ entry.metadata.decision.off_schema ? 'Yes' : 'No' }}
                            </v-chip>
                            <v-chip size="x-small" color="cyan" variant="outlined">
                              Radio check: {{ entry.metadata.decision.radio_check ? 'Yes' : 'No' }}
                            </v-chip>
                          </div>
                        </div>
                        <template v-for="usage in [buildLlmUsage(entry)]" :key="`${entry.id}-usage`">
                          <div
                            v-if="usage"
                            class="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-white/70"
                          >
                            <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/80">LLM usage</p>
                            <p class="text-sm font-semibold text-white">{{ usage.method }}</p>
                            <div class="flex flex-wrap gap-2">
                              <v-chip size="x-small" color="cyan" variant="outlined">
                                Auto decision: {{ usage.autoDecide === false ? 'Disabled' : 'Enabled' }}
                              </v-chip>
                              <v-chip size="x-small" color="cyan" variant="outlined">
                                OpenAI: {{ usage.openaiUsed ? 'Used' : 'Not used' }}
                              </v-chip>
                              <v-chip v-if="usage.openaiUsed" size="x-small" color="cyan" variant="outlined">
                                Calls: {{ usage.callCount }}
                              </v-chip>
                              <v-chip v-if="usage.fallbackUsed" size="x-small" color="orange" variant="tonal">
                                Fallback triggered
                              </v-chip>
                            </div>
                            <p v-if="usage.reason" class="text-white/60">{{ usage.reason }}</p>
                          </div>
                        </template>
                        <div v-if="entry.metadata?.context" class="space-y-3">
                          <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/80">State context snapshot</p>
                          <div class="space-y-3 rounded-xl border border-white/10 bg-black/30 p-3">
                            <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p class="font-mono text-sm text-white">
                                  {{ entry.metadata.context.stateId || 'Unknown state' }}
                                </p>
                                <p v-if="entry.metadata.context.state?.name" class="text-[11px] text-white/60">
                                  {{ entry.metadata.context.state?.name }}
                                </p>
                              </div>
                              <div class="flex flex-wrap gap-2 text-[11px] text-white/60">
                                <v-chip v-if="entry.metadata.context.state?.role" size="x-small" color="cyan" variant="outlined">
                                  Role: {{ entry.metadata.context.state?.role }}
                                </v-chip>
                                <v-chip v-if="entry.metadata.context.state?.phase" size="x-small" color="cyan" variant="text">
                                  Phase: {{ entry.metadata.context.state?.phase }}
                                </v-chip>
                              </div>
                            </div>
                            <div
                              v-if="entry.metadata.context.state?.say_tpl"
                              class="rounded-lg border border-white/10 bg-black/40 p-3"
                            >
                              <p class="text-[11px] text-white/50">State Say Template</p>
                              <p class="font-mono text-sm">{{ entry.metadata.context.state?.say_tpl }}</p>
                            </div>
                            <div class="grid gap-3 md:grid-cols-3">
                              <div>
                                <p class="text-[11px] text-white/50">Next transitions</p>
                                <ul
                                  v-if="transitionList(entry.metadata.context.state?.next).length"
                                  class="list-inside list-disc space-y-1 text-[11px] text-white/70"
                                >
                                  <li
                                    v-for="(transition, index) in transitionList(entry.metadata.context.state?.next)"
                                    :key="`next-${index}`"
                                  >
                                    {{ describeTransition(transition) }}
                                  </li>
                                </ul>
                                <p v-else class="text-[11px] text-white/50">—</p>
                              </div>
                              <div>
                                <p class="text-[11px] text-white/50">OK transitions</p>
                                <ul
                                  v-if="transitionList(entry.metadata.context.state?.ok_next).length"
                                  class="list-inside list-disc space-y-1 text-[11px] text-white/70"
                                >
                                  <li
                                    v-for="(transition, index) in transitionList(entry.metadata.context.state?.ok_next)"
                                    :key="`ok-${index}`"
                                  >
                                    {{ describeTransition(transition) }}
                                  </li>
                                </ul>
                                <p v-else class="text-[11px] text-white/50">—</p>
                              </div>
                              <div>
                                <p class="text-[11px] text-white/50">Bad transitions</p>
                                <ul
                                  v-if="transitionList(entry.metadata.context.state?.bad_next).length"
                                  class="list-inside list-disc space-y-1 text-[11px] text-white/70"
                                >
                                  <li
                                    v-for="(transition, index) in transitionList(entry.metadata.context.state?.bad_next)"
                                    :key="`bad-${index}`"
                                  >
                                    {{ describeTransition(transition) }}
                                  </li>
                                </ul>
                                <p v-else class="text-[11px] text-white/50">—</p>
                              </div>
                            </div>
                            <div v-if="entry.metadata.context.candidates?.length" class="space-y-2">
                              <p class="text-[11px] text-white/50 uppercase tracking-[0.3em]">Candidates</p>
                              <div
                                v-for="(candidate, index) in entry.metadata.context.candidates"
                                :key="candidate.id || index"
                                class="space-y-2 rounded-lg border border-white/10 bg-black/40 p-3"
                              >
                                <div class="flex items-center justify-between">
                                  <span class="font-mono text-sm text-white">{{ candidate.id || 'unknown' }}</span>
                                  <v-chip
                                    v-if="candidate.id && candidate.id === entry.metadata?.decision?.next_state"
                                    size="x-small"
                                    color="cyan"
                                    variant="flat"
                                  >
                                    Selected
                                  </v-chip>
                                </div>
                                <p v-if="candidate.state?.name" class="text-[11px] text-white/60">
                                  {{ candidate.state?.name }}
                                </p>
                                <div class="flex flex-wrap gap-2 text-[11px] text-white/60">
                                  <v-chip v-if="candidate.state?.role" size="x-small" color="cyan" variant="outlined">
                                    Role: {{ candidate.state?.role }}
                                  </v-chip>
                                  <v-chip
                                    v-if="candidate.state?.requires_atc_reply"
                                    size="x-small"
                                    color="cyan"
                                    variant="tonal"
                                  >
                                    Requires ATC reply
                                  </v-chip>
                                </div>
                                <p
                                  v-if="candidate.state?.say_tpl"
                                  class="rounded-lg border border-white/10 bg-black/60 p-2 font-mono text-[11px] text-white"
                                >
                                  {{ candidate.state?.say_tpl }}
                                </p>
                              </div>
                            </div>
                            <div class="grid gap-3 md:grid-cols-2">
                              <div v-if="entry.metadata.context.variables">
                                <p class="text-[11px] text-white/50">Variables snapshot</p>
                                <pre class="trace-json">{{ formatJson(entry.metadata.context.variables) }}</pre>
                              </div>
                              <div v-if="entry.metadata.context.flags">
                                <p class="text-[11px] text-white/50">Flags snapshot</p>
                                <pre class="trace-json">{{ formatJson(entry.metadata.context.flags) }}</pre>
                              </div>
                            </div>
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
                                Step: {{ call.stage === 'decision' ? 'Decision' : 'Readback check' }}
                              </span>
                              <span v-if="call.error" class="text-red-300">Call failed</span>
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
                              No response received.
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
                            <p class="text-xs uppercase tracking-[0.3em] text-orange-200/80">Fallback activated</p>
                            <p>
                              Reason: {{ entry.metadata.decisionTrace.fallback.reason || 'unknown' }}
                              <span v-if="entry.metadata.decisionTrace.fallback.selected">
                                · Path: {{ entry.metadata.decisionTrace.fallback.selected }}
                              </span>
                            </p>
                          </div>
                        </div>
                        <template v-else>
                          <template v-for="usage in [buildLlmUsage(entry)]" :key="`${entry.id}-usage-empty`">
                            <div
                              v-if="usage"
                              class="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-white/70"
                            >
                              <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/80">OpenAI Decision Calls</p>
                              <p>No OpenAI call was recorded for this transmission.</p>
                              <p v-if="usage.reason" class="text-white/60">{{ usage.reason }}</p>
                            </div>
                          </template>
                        </template>
                        <div v-if="entry.channel === 'say'" class="space-y-2">
                          <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Say endpoint invocation</p>
                          <div class="grid gap-3 md:grid-cols-2">
                            <div class="rounded-lg border border-white/10 bg-black/30 p-3">
                              <p class="text-[11px] text-white/50">Voice</p>
                              <p class="font-mono text-sm text-white">{{ entry.metadata?.voice || '—' }}</p>
                            </div>
                            <div class="rounded-lg border border-white/10 bg-black/30 p-3">
                              <p class="text-[11px] text-white/50">Signal level</p>
                              <p class="font-mono text-sm text-white">{{ entry.metadata?.level ?? '—' }}</p>
                            </div>
                            <div class="rounded-lg border border-white/10 bg-black/30 p-3">
                              <p class="text-[11px] text-white/50">Speech speed</p>
                              <p class="font-mono text-sm text-white">{{ entry.metadata?.speed ?? '—' }}</p>
                            </div>
                            <div class="rounded-lg border border-white/10 bg-black/30 p-3">
                              <p class="text-[11px] text-white/50">Radio quality</p>
                              <p class="font-mono text-sm text-white">{{ entry.metadata?.radioQuality || '—' }}</p>
                            </div>
                          </div>
                          <div class="grid gap-3 md:grid-cols-3">
                            <div class="rounded-lg border border-white/10 bg-black/30 p-3">
                              <p class="text-[11px] text-white/50">TTS provider</p>
                              <p class="font-mono text-sm text-white">{{ entry.metadata?.tts?.provider || '—' }}</p>
                            </div>
                            <div class="rounded-lg border border-white/10 bg-black/30 p-3">
                              <p class="text-[11px] text-white/50">Model</p>
                              <p class="font-mono text-sm text-white">{{ entry.metadata?.tts?.model || '—' }}</p>
                            </div>
                            <div class="rounded-lg border border-white/10 bg-black/30 p-3">
                              <p class="text-[11px] text-white/50">Format</p>
                              <p class="font-mono text-sm text-white">
                                {{ entry.metadata?.tts?.format || '—' }}
                                <span v-if="entry.metadata?.tts?.extension">
                                  ({{ entry.metadata?.tts?.extension }})
                                </span>
                              </p>
                            </div>
                          </div>
                          <div v-if="entry.metadata?.tag" class="rounded-lg border border-white/10 bg-black/30 p-3">
                            <p class="text-[11px] text-white/50">Tag</p>
                            <p class="font-mono text-sm text-white">{{ entry.metadata?.tag }}</p>
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
              <p v-else class="py-12 text-center text-sm text-white/60">No transmissions found.</p>

              <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div class="text-xs text-white/50">
                  Page {{ logPagination.page }} of {{ logPagination.pages }} · {{ logPagination.total }} logs
                </div>
                <div class="flex items-center gap-2">
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="logPagination.page <= 1"
                    @click="changeLogPage(logPagination.page - 1)"
                  >
                    Back
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="cyan"
                    :disabled="logPagination.page >= logPagination.pages"
                    @click="changeLogPage(logPagination.page + 1)"
                  >
                    Next
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
        <v-card-title class="text-lg font-semibold">Create invitation code</v-card-title>
        <v-card-text class="space-y-4">
          <p class="text-sm text-white/70">
            The code becomes active immediately and expires after 30 days by default. Adding a label is optional.
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
            label="Validity in days"
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
            <p class="text-xs uppercase tracking-[0.3em] text-emerald-200/80">New code</p>
            <p class="font-mono text-3xl tracking-widest text-white">{{ createInviteResult.code }}</p>
            <p class="text-xs text-white/60">Valid until {{ formatDateTime(createInviteResult.expiresAt) }}</p>
          </v-sheet>
        </v-card-text>
        <v-card-actions class="justify-between">
          <v-btn variant="text" color="white" @click="closeCreateInvite">Cancel</v-btn>
          <v-btn color="cyan" variant="flat" :loading="createInviteLoading" @click="submitCreateInvite">
            Generate code
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

interface DecisionTraceCall {
  stage: 'readback-check' | 'decision'
  request: Record<string, any>
  response?: any
  rawResponseText?: string
  error?: string
}

interface DecisionTraceMetadata {
  calls?: DecisionTraceCall[]
  fallback?: { used?: boolean; reason?: string; selected?: string }
}

interface CandidateSnapshot {
  id?: string
  state?: Record<string, any>
}

interface TransmissionContextSnapshot {
  stateId?: string
  state?: Record<string, any>
  candidates?: CandidateSnapshot[]
  selectedCandidate?: CandidateSnapshot
  variables?: Record<string, any>
  flags?: Record<string, any>
}

interface LlmUsageMetadata {
  autoDecide?: boolean
  openaiUsed?: boolean
  callCount?: number
  fallbackUsed?: boolean
  strategy?: 'manual' | 'openai' | 'heuristic' | 'fallback'
  reason?: string
}

interface TransmissionMetadata {
  moduleId?: string
  lessonId?: string
  autoDecide?: boolean
  decision?: {
    next_state?: string
    controller_say_tpl?: string
    off_schema?: boolean
    radio_check?: boolean
  }
  decisionTrace?: DecisionTraceMetadata
  context?: TransmissionContextSnapshot
  llm?: LlmUsageMetadata
  tts?: {
    provider?: string
    model?: string
    format?: string
    extension?: string
  }
  voice?: string
  level?: number
  speed?: number
  tag?: string | null
  radioQuality?: string
  [key: string]: any
}

interface LlmUsageSummary {
  method: string
  openaiUsed: boolean
  callCount: number
  fallbackUsed: boolean
  autoDecide?: boolean
  reason?: string
}

interface TransmissionEntry {
  id: string
  role: string
  channel: string
  direction: string
  text: string
  normalized?: string
  createdAt: string
  metadata?: TransmissionMetadata
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
  { title: 'All roles', value: 'all' },
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
  { title: 'All statuses', value: 'all' },
  { title: 'Active', value: 'active' },
  { title: 'Used', value: 'used' },
  { title: 'Expired', value: 'expired' },
]
const invitationChannelOptions = [
  { title: 'All channels', value: 'all' },
  { title: 'User', value: 'user' },
  { title: 'Admin', value: 'admin' },
  { title: 'Manual', value: 'manual' },
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
  { title: 'All opt-ins', value: 'all' },
  { title: 'Waitlist only', value: 'waitlist' },
  { title: 'Product updates', value: 'updates' },
]
const waitlistStatusOptions = [
  { title: 'All statuses', value: 'all' },
  { title: 'Pending', value: 'pending' },
  { title: 'Activated', value: 'activated' },
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
  { title: 'All channels', value: 'all' },
  { title: 'PTT', value: 'ptt' },
  { title: 'Say', value: 'say' },
  { title: 'Text', value: 'text' },
]
const logDirectionOptions = [
  { title: 'All directions', value: 'all' },
  { title: 'Incoming', value: 'incoming' },
  { title: 'Outgoing', value: 'outgoing' },
]
const logRoleOptions = [
  { title: 'All roles', value: 'all' },
  { title: 'Pilot', value: 'pilot' },
  { title: 'ATC', value: 'atc' },
]
const logTimeframeOptions = [
  { title: 'Last 24 hours', value: '24h' },
  { title: '7 days', value: '7d' },
  { title: '30 days', value: '30d' },
  { title: 'All time', value: 'all' },
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
  return date.toLocaleString('en-US', {
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
  if (diffMinutes < 1) return 'a few seconds ago'
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} days ago`
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

function transitionList(value: any) {
  return Array.isArray(value) ? value : []
}

function describeTransition(transition: any) {
  if (!transition) return '—'
  if (typeof transition === 'string') return transition
  if (typeof transition !== 'object') return String(transition)

  const destination = transition.to || transition.id || '—'
  const details: string[] = []

  if (transition.when) details.push(`when: ${transition.when}`)
  if (transition.action) details.push(`action: ${transition.action}`)
  if (transition.intent) details.push(`intent: ${transition.intent}`)
  if (transition.auto) details.push(`auto: ${transition.auto}`)
  if (transition.say_tpl || transition.controller_say_tpl) details.push('say')
  if (transition.note) details.push(`note: ${transition.note}`)
  if (transition.condition) details.push(`cond: ${transition.condition}`)

  return details.length ? `${destination} (${details.join(', ')})` : destination
}

function buildLlmUsage(entry: TransmissionEntry): LlmUsageSummary | null {
  const metadata = entry.metadata
  if (!metadata) return null

  const hasDecisionData =
    metadata.autoDecide !== undefined ||
    Boolean(metadata.llm) ||
    Boolean(metadata.decisionTrace?.calls?.length) ||
    Boolean(metadata.decisionTrace?.fallback?.used)

  if (!hasDecisionData) return null

  const autoDecide = metadata.llm?.autoDecide ?? metadata.autoDecide
  const callCount = metadata.llm?.callCount ?? metadata.decisionTrace?.calls?.length ?? 0
  const fallbackUsed = metadata.llm?.fallbackUsed ?? Boolean(metadata.decisionTrace?.fallback?.used)
  const openaiUsed = metadata.llm?.openaiUsed ?? callCount > 0

  const strategy =
    metadata.llm?.strategy ||
    (!autoDecide
      ? 'manual'
      : openaiUsed
        ? 'openai'
        : fallbackUsed
          ? 'fallback'
          : 'heuristic')

  let method: string
  switch (strategy) {
    case 'openai':
      method = `OpenAI decision (${callCount} ${callCount === 1 ? 'call' : 'calls'})`
      break
    case 'fallback':
      method = 'Fallback decision after OpenAI error'
      break
    case 'manual':
      method = 'Manual routing (auto decision disabled)'
      break
    default:
      method = 'Heuristic decision (no OpenAI call)'
      break
  }

  const reason =
    metadata.llm?.reason ||
    (strategy === 'openai'
      ? `Decision derived from OpenAI with ${callCount} ${callCount === 1 ? 'call' : 'calls'}.`
      : strategy === 'fallback'
        ? metadata.decisionTrace?.fallback?.reason || 'Fallback executed because OpenAI response could not be used.'
        : strategy === 'manual'
          ? 'Automatic decision was disabled for this transmission.'
          : 'Rules and heuristics resolved the decision without contacting OpenAI.')

  return {
    method,
    openaiUsed,
    callCount,
    fallbackUsed,
    autoDecide,
    reason,
  }
}

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false
  const date = new Date(expiresAt)
  if (Number.isNaN(date.valueOf())) return false
  return date.getTime() < Date.now()
}

function invitationStatusLabel(inv: InvitationItem) {
  if (inv.usedAt) return `used ${formatRelative(inv.usedAt)}`
  if (inv.expiresAt && isExpired(inv.expiresAt)) return 'expired'
  return 'active'
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
    overviewError.value = extractErrorMessage(error, 'Could not load overview.')
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
    userError.value = extractErrorMessage(error, 'Could not load user list.')
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
    userError.value = extractErrorMessage(error, 'Could not update role.')
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
    invitationError.value = extractErrorMessage(error, 'Could not load invitations.')
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
    waitlistError.value = extractErrorMessage(error, 'Could not load waitlist.')
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
    logError.value = extractErrorMessage(error, 'Could not load radio logs.')
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
    createInviteError.value = extractErrorMessage(error, 'Could not create invitation code.')
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
