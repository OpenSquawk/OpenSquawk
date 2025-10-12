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
                  <v-card-text class="space-y-4">
                    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div class="space-y-1">
                        <p class="text-sm text-white/50">{{ formatDateTime(user.createdAt) }}</p>
                        <h3 class="text-lg font-semibold">{{ user.email }}</h3>
                        <p v-if="user.name" class="text-sm text-white/60">{{ user.name }}</p>
                        <div class="flex flex-wrap gap-2 text-xs text-white/50">
                          <span>Invitations created: {{ user.invitationCodesIssued }}</span>
                          <span v-if="user.lastLoginAt">Last login: {{ formatRelative(user.lastLoginAt) }}</span>
                        </div>
                      </div>
                      <div class="flex flex-col items-start gap-2 md:w-48 md:items-end">
                        <v-select
                          v-model="userRoleDraft[user.id]"
                          :items="userRoleEditOptions"
                          label="Role"
                          density="comfortable"
                          variant="outlined"
                          color="cyan"
                          hide-details
                          class="w-44 md:w-full"
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
                    </div>
                    <v-divider class="border-white/10" />
                    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <v-textarea
                        v-model="userNotesDraft[user.id]"
                        label="Internal notes"
                        auto-grow
                        rows="2"
                        variant="outlined"
                        density="comfortable"
                        color="cyan"
                        :counter="2000"
                        maxlength="2000"
                        hide-details="auto"
                        class="md:flex-1"
                      />
                      <div class="flex flex-col gap-2 md:w-48">
                        <v-btn
                          color="cyan"
                          variant="tonal"
                          size="small"
                          prepend-icon="mdi-content-save-outline"
                          :loading="userNotesSaving === user.id"
                          :disabled="(userNotesDraft[user.id] || '') === (user.adminNotes || '')"
                          @click="saveUserNotes(user.id)"
                        >
                          Save notes
                        </v-btn>
                        <v-btn
                          v-if="user.role === 'user'"
                          color="red"
                          variant="text"
                          size="small"
                          prepend-icon="mdi-delete-outline"
                          :loading="userDeleteLoading === user.id"
                          @click="deleteUserAccount(user)"
                        >
                          Delete user
                        </v-btn>
                      </div>
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

            <v-alert
              v-else-if="waitlistSuccessMessage"
              type="success"
              variant="tonal"
              border="start"
              density="comfortable"
              class="bg-emerald-500/10 text-emerald-100"
            >
              {{ waitlistSuccessMessage }}
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
                    <th class="font-semibold">Invitation</th>
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
                    <td>
                      <div class="flex flex-col gap-2">
                        <div v-if="entry.invitation" class="space-y-1 text-xs">
                          <div class="font-mono text-sm text-white">{{ entry.invitation.code }}</div>
                          <div class="text-white/50">
                            Created {{ formatRelative(entry.invitation.createdAt) }}
                            <span class="text-white/40">· {{ formatDateTime(entry.invitation.createdAt) }}</span>
                          </div>
                          <div v-if="entry.invitation.sentAt" class="text-white/50">
                            Sent {{ formatRelative(entry.invitation.sentAt) }}
                            <span class="text-white/40">· {{ formatDateTime(entry.invitation.sentAt) }}</span>
                          </div>
                          <div
                            v-if="entry.invitation.usedAt"
                            class="text-[11px] font-medium uppercase tracking-[0.2em] text-green-300"
                          >
                            Code used · {{ formatRelative(entry.invitation.usedAt) }}
                          </div>
                        </div>
                        <div v-else class="text-xs text-white/50">No invitation sent yet.</div>

                        <div class="flex flex-wrap items-center gap-2">
                          <v-btn
                            size="small"
                            color="cyan"
                            variant="tonal"
                            :loading="isWaitlistSending(entry.id)"
                            :disabled="Boolean(entry.invitation?.usedAt)"
                            @click="sendWaitlistInvitation(entry)"
                          >
                            <template v-if="entry.invitation">
                              <template v-if="entry.invitation.usedAt">Registered</template>
                              <template v-else>Re-send invite</template>
                            </template>
                            <template v-else>Send invite</template>
                          </v-btn>
                          <v-chip
                            v-if="entry.invitation?.usedAt"
                            size="x-small"
                            color="green"
                            variant="tonal"
                            class="text-[11px] uppercase tracking-[0.2em]"
                          >
                            Registered
                          </v-chip>
                        </div>
                      </div>
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
          <section class="grid gap-6 xl:grid-cols-[320px,1fr]">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xl font-semibold">Sessions</h2>
                  <p class="text-xs text-white/50">{{ sessionPagination.total }} conversations</p>
                </div>
                <div class="flex items-center gap-2">
                  <v-btn
                    variant="text"
                    color="cyan"
                    size="small"
                    :disabled="sessionPagination.page <= 1 || sessionsLoading"
                    @click="changeSessionPage(sessionPagination.page - 1)"
                  >
                    Prev
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="cyan"
                    size="small"
                    :disabled="sessionPagination.page >= sessionPagination.pages || sessionsLoading"
                    @click="changeSessionPage(sessionPagination.page + 1)"
                  >
                    Next
                  </v-btn>
                </div>
              </div>

              <v-alert
                v-if="sessionsError"
                type="warning"
                variant="tonal"
                class="bg-red-500/10 text-red-100"
              >
                {{ sessionsError }}
              </v-alert>

              <div v-if="sessionsLoading" class="py-10 text-center text-white/60">
                <v-progress-circular indeterminate color="cyan" class="mb-3" />
                Loading sessions…
              </div>

              <div v-else class="space-y-3">
                <v-card
                  v-for="session in sessions"
                  :key="session.sessionId"
                  :class="[
                    'border border-white/10 bg-black/40 cursor-pointer transition',
                    session.sessionId === selectedSessionId
                      ? 'border-cyan-400/60 shadow-lg shadow-cyan-500/20'
                      : 'hover:border-cyan-400/40'
                  ]"
                  @click="selectSession(session.sessionId)"
                >
                  <v-card-text class="space-y-2">
                    <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                      <span>{{ session.callsign || 'Unknown' }}</span>
                      <span>{{ formatRelative(session.updatedAt || undefined) }}</span>
                    </div>
                    <p class="text-sm font-semibold text-white">Session {{ session.sessionId }}</p>
                    <div class="flex items-center gap-2 text-xs text-white/60">
                      <v-chip size="x-small" color="cyan" variant="outlined">{{ session.entryCount }} entries</v-chip>
                      <span>{{ formatDateTime(session.startedAt || undefined) }}</span>
                    </div>
                    <p v-if="session.lastMessage" class="text-xs text-white/50 line-clamp-2">
                      {{ session.lastMessage.role.toUpperCase() }} · {{ session.lastMessage.text }}
                    </p>
                  </v-card-text>
                </v-card>

                <p v-if="!sessions.length" class="text-xs text-white/50 text-center py-6">
                  No sessions recorded yet.
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <div v-if="sessionDetailLoading" class="py-10 text-center text-white/60">
                <v-progress-circular indeterminate color="cyan" class="mb-3" />
                Loading session details…
              </div>

              <v-alert
                v-else-if="sessionDetailError"
                type="warning"
                variant="tonal"
                class="bg-red-500/10 text-red-100"
              >
                {{ sessionDetailError }}
              </v-alert>

              <div v-else-if="sessionDetails" class="space-y-4">
                <div class="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/40">Session</p>
                      <p class="font-mono text-sm text-white">{{ sessionDetails.sessionId }}</p>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-white/50">
                      <v-chip size="x-small" color="cyan" variant="outlined">{{ sessionDetails.entryCount }} entries</v-chip>
                      <span>{{ formatDateTime(sessionDetails.startedAt || undefined) }}</span>
                      <span>→</span>
                      <span>{{ formatDateTime(sessionDetails.updatedAt || undefined) }}</span>
                    </div>
                  </div>
                  <p class="text-xs text-white/60">Callsign: {{ sessionDetails.callsign || 'Unknown' }}</p>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="entry in sessionDetails.entries"
                    :key="entry.id"
                    class="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                      <span class="flex items-center gap-2">
                        <v-chip size="x-small" color="cyan" variant="outlined">{{ entry.channel }}</v-chip>
                        <v-chip size="x-small" color="cyan" variant="text">{{ entry.role }}</v-chip>
                        <span>{{ entry.direction }}</span>
                      </span>
                      <span>{{ formatDateTime(entry.createdAt) }}</span>
                    </div>
                    <p class="text-sm font-mono text-white">{{ entry.text }}</p>
                    <p v-if="entry.normalized" class="text-[11px] text-white/50">{{ entry.normalized }}</p>
                    <div class="flex items-center justify-between text-xs text-white/60">
                      <span v-if="entry.user">User: {{ entry.user.email }}</span>
                      <v-btn
                        v-if="entry.metadata?.decisionTrace"
                        size="small"
                        variant="text"
                        color="cyan"
                        prepend-icon="mdi-timeline-text"
                        @click="expandedEntryId = expandedEntryId === entry.id ? null : entry.id"
                      >
                        {{ expandedEntryId === entry.id ? 'Hide decision' : 'Show decision' }}
                      </v-btn>
                    </div>
                    <v-expand-transition>
                      <div
                        v-if="expandedEntryId === entry.id && entry.metadata?.decisionTrace"
                        class="space-y-3 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4"
                      >
                        <div class="flex items-center justify-between">
                          <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Decision trace</p>
                          <div class="flex items-center gap-2 text-[11px] text-cyan-100/80">
                            <span v-if="entry.metadata.decision?.next_state">Next: {{ entry.metadata.decision.next_state }}</span>
                            <span v-if="entry.metadata.decision?.activate_flow">
                              Flow:
                              {{ typeof entry.metadata.decision.activate_flow === 'string'
                                ? entry.metadata.decision.activate_flow
                                : entry.metadata.decision.activate_flow.slug }}
                            </span>
                          </div>
                        </div>
                        <div v-if="entry.metadata.decisionTrace.candidateTimeline?.steps?.length" class="space-y-3">
                          <div
                            v-for="(step, index) in entry.metadata.decisionTrace.candidateTimeline.steps"
                            :key="`${entry.id}-${step.stage}-${index}`"
                            class="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3"
                          >
                            <div class="flex items-start justify-between gap-3">
                              <div>
                                <p class="font-semibold text-sm text-white">{{ step.label }}</p>
                                <p class="text-[11px] text-white/50 uppercase tracking-[0.2em]">{{ step.stage }}</p>
                              </div>
                              <v-chip size="x-small" color="cyan" variant="outlined">{{ step.candidates.length }} candidates</v-chip>
                            </div>
                            <p v-if="step.note" class="text-[11px] text-white/50">{{ step.note }}</p>
                            <div v-if="step.candidates.length" class="space-y-2">
                              <div
                                v-for="candidate in step.candidates"
                                :key="candidate.id"
                                class="rounded-lg border border-white/10 bg-black/40 p-2"
                              >
                                <div class="flex items-center justify-between gap-2">
                                  <span class="font-mono text-sm text-white">{{ candidate.id }}</span>
                                  <span class="text-[11px] text-white/50">{{ candidate.flow || 'current' }}</span>
                                </div>
                                <p v-if="candidate.summary" class="text-[11px] text-white/60 mt-1">{{ candidate.summary }}</p>
                              </div>
                            </div>
                            <div v-if="step.eliminated?.length" class="space-y-2">
                              <p class="text-[11px] text-red-200/80 uppercase tracking-[0.25em]">Eliminated</p>
                              <div
                                v-for="elim in step.eliminated"
                                :key="`${entry.id}-${step.stage}-${elim.candidate.id}`"
                                class="space-y-1 rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-xs text-red-100"
                              >
                                <div class="flex items-center justify-between gap-2">
                                  <span class="font-mono text-sm">{{ elim.candidate.id }}</span>
                                  <span class="text-[11px] text-red-200/80">{{ elim.kind }}</span>
                                </div>
                                <p class="text-[11px] text-red-100/80">{{ elim.reason }}</p>
                                <p v-if="describeElimination(elim)" class="text-[10px] text-red-100/70">{{ describeElimination(elim) }}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p v-else class="text-[11px] text-white/60">No candidate timeline recorded.</p>
                      </div>
                    </v-expand-transition>
                  </div>
                </div>

                <p v-if="!sessionDetails.entries.length" class="text-xs text-white/50 text-center py-6">
                  No messages recorded for this session.
                </p>
              </div>

              <p v-else class="text-xs text-white/50">Select a session to view its transcript.</p>
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
  adminNotes?: string
}

interface UsersResponse {
  items: AdminUser[]
  pagination: { total: number; page: number; pageSize: number; pages: number }
  roles: { user: number; admin: number; dev: number }
}

interface UpdateNotesResponse {
  success: boolean
  notes: string
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
  sessionId?: string
}

interface SessionSummary {
  sessionId: string
  startedAt: string | null
  updatedAt: string | null
  entryCount: number
  callsign?: string
  lastMessage?: {
    text: string
    role: string
    channel: string
    createdAt: string
  }
}

interface SessionsResponse {
  items: SessionSummary[]
  pagination: { total: number; page: number; pageSize: number; pages: number }
}

interface WaitlistInvitationInfo {
  id: string
  code: string
  channel: string
  label?: string
  createdAt: string
  expiresAt?: string
  sentAt?: string
  usedAt?: string
}

interface SessionDetail {
  sessionId: string
  startedAt: string | null
  updatedAt: string | null
  entryCount: number
  callsign?: string
  entries: TransmissionEntry[]
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
  invitationSentAt?: string
  invitation?: WaitlistInvitationInfo
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

interface WaitlistInviteResponse {
  success: boolean
  invitation: WaitlistInvitationInfo
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
const userNotesDraft = reactive<Record<string, string>>({})
const userNotesSaving = ref<string | null>(null)
const userDeleteLoading = ref<string | null>(null)

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
const waitlistSuccessMessage = ref('')
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
const waitlistSending = ref<string[]>([])

const sessions = ref<SessionSummary[]>([])
const sessionsLoading = ref(false)
const sessionsError = ref('')
const sessionsLoaded = ref(false)
const sessionPagination = reactive({ total: 0, page: 1, pages: 1, pageSize: 10 })
const selectedSessionId = ref<string | null>(null)
const sessionDetails = ref<SessionDetail | null>(null)
const sessionDetailLoading = ref(false)
const sessionDetailError = ref('')
const expandedEntryId = ref<string | null>(null)

const showCreateInvite = ref(false)
const newInviteLabel = ref('')
const newInviteExpiry = ref(30)
const createInviteLoading = ref(false)
const createInviteError = ref('')
const createInviteResult = ref<{ code: string; expiresAt?: string } | null>(null)

const usersLoaded = ref(false)
const invitationsLoaded = ref(false)
const waitlistLoaded = ref(false)

let userSearchTimeout: ReturnType<typeof setTimeout> | undefined
let invitationSearchTimeout: ReturnType<typeof setTimeout> | undefined
let waitlistSearchTimeout: ReturnType<typeof setTimeout> | undefined
let activeSessionDetailRequest: string | null = null

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
    const itemIds = new Set(response.items.map((user) => user.id))
    Object.keys(userNotesDraft).forEach((key) => {
      if (!itemIds.has(key)) {
        delete userNotesDraft[key]
      }
    })
    response.items.forEach((user) => {
      userRoleDraft[user.id] = user.role as 'user' | 'admin' | 'dev'
      userNotesDraft[user.id] = user.adminNotes ?? ''
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

async function saveUserNotes(userId: string) {
  userNotesSaving.value = userId
  try {
    const notes = userNotesDraft[userId] ?? ''
    const response = await api.request<UpdateNotesResponse>(`/api/admin/users/${userId}/notes`, {
      method: 'PATCH',
      body: { notes },
    })
    const target = users.value.find((u) => u.id === userId)
    if (target) {
      target.adminNotes = response.notes
    }
    userNotesDraft[userId] = response.notes
  } catch (error) {
    userError.value = extractErrorMessage(error, 'Could not save notes.')
  } finally {
    userNotesSaving.value = null
  }
}

async function deleteUserAccount(user: AdminUser) {
  if (typeof window !== 'undefined') {
    const confirmed = window.confirm(`Delete user ${user.email}? This action cannot be undone.`)
    if (!confirmed) return
  }

  userDeleteLoading.value = user.id
  try {
    await api.request(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    const shouldMoveBack = users.value.length === 1 && userPagination.page > 1
    if (shouldMoveBack) {
      userPagination.page -= 1
    }
    await fetchUsers()
  } catch (error) {
    userError.value = extractErrorMessage(error, 'Could not delete user.')
  } finally {
    userDeleteLoading.value = null
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
  waitlistSuccessMessage.value = ''
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

function isWaitlistSending(id: string) {
  return waitlistSending.value.includes(id)
}

async function sendWaitlistInvitation(entry: WaitlistEntryItem) {
  if (isWaitlistSending(entry.id)) return

  waitlistError.value = ''
  waitlistSuccessMessage.value = ''
  waitlistSending.value = [...waitlistSending.value, entry.id]

  try {
    const response = await api.post<WaitlistInviteResponse>(
      `/api/admin/waitlist/${entry.id}/invite`,
      {},
    )

    entry.invitation = response.invitation
    entry.invitationSentAt = response.invitation.sentAt
    waitlistEntries.value = [...waitlistEntries.value]
    waitlistSuccessMessage.value = `Invitation ${response.invitation.code} sent to ${entry.email}.`
  } catch (error) {
    waitlistError.value = extractErrorMessage(error, 'Could not send invitation.')
  } finally {
    waitlistSending.value = waitlistSending.value.filter((existing) => existing !== entry.id)
  }
}

async function fetchSessions(resetPage = false, options: { forceDetail?: boolean } = {}) {
  if (resetPage) {
    sessionPagination.page = 1
  }

  sessionsLoading.value = true
  sessionsError.value = ''
  try {
    const query: Record<string, any> = {
      page: sessionPagination.page,
      pageSize: sessionPagination.pageSize,
    }
    const response = await api.get<SessionsResponse>('/api/admin/logs/sessions', { query })
    sessions.value = response.items
    Object.assign(sessionPagination, response.pagination)
    sessionsLoaded.value = true

    if (!response.items.length) {
      sessionDetails.value = null
      selectedSessionId.value = null
      expandedEntryId.value = null
      sessionDetailError.value = ''
      sessionDetailLoading.value = false
      activeSessionDetailRequest = null
      return
    }

    const hasSelected = selectedSessionId.value
      ? response.items.some((item) => item.sessionId === selectedSessionId.value)
      : false

    if (!hasSelected) {
      await selectSession(response.items[0].sessionId, { force: true })
    } else if (options.forceDetail && selectedSessionId.value) {
      await selectSession(selectedSessionId.value, { force: true })
    }
  } catch (error) {
    sessionsError.value = extractErrorMessage(error, 'Could not load sessions.')
  } finally {
    sessionsLoading.value = false
  }
}

function changeSessionPage(page: number) {
  if (page < 1 || page > sessionPagination.pages || page === sessionPagination.page) return
  sessionPagination.page = page
  fetchSessions()
}

async function fetchSessionDetail(sessionId: string) {
  if (!sessionId) {
    sessionDetails.value = null
    return
  }

  const requestId = sessionId
  activeSessionDetailRequest = requestId
  sessionDetailLoading.value = true
  sessionDetailError.value = ''

  try {
    const detail = await api.get<SessionDetail>(`/api/admin/logs/sessions/${sessionId}`)
    if (activeSessionDetailRequest !== requestId) {
      return
    }
    sessionDetails.value = detail
  } catch (error) {
    if (activeSessionDetailRequest !== requestId) {
      return
    }
    sessionDetailError.value = extractErrorMessage(error, 'Could not load session details.')
    sessionDetails.value = null
  } finally {
    if (activeSessionDetailRequest === requestId) {
      sessionDetailLoading.value = false
      activeSessionDetailRequest = null
    }
  }
}

async function selectSession(sessionId: string | null, options: { force?: boolean } = {}) {
  if (!sessionId) {
    selectedSessionId.value = null
    sessionDetails.value = null
    sessionDetailError.value = ''
    expandedEntryId.value = null
    sessionDetailLoading.value = false
    activeSessionDetailRequest = null
    return
  }

  if (!options.force && selectedSessionId.value === sessionId && sessionDetails.value) {
    expandedEntryId.value = null
    return
  }

  selectedSessionId.value = sessionId
  sessionDetails.value = null
  sessionDetailError.value = ''
  expandedEntryId.value = null
  await fetchSessionDetail(sessionId)
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
      await fetchSessions(true, { forceDetail: true })
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

watch(activeTab, (tab) => {
  if (tab === 'overview') {
    loadOverview()
  } else if (tab === 'users' && !usersLoaded.value) {
    fetchUsers(true)
  } else if (tab === 'invitations' && !invitationsLoaded.value) {
    fetchInvitations(true)
  } else if (tab === 'waitlist' && !waitlistLoaded.value) {
    fetchWaitlist(true)
  } else if (tab === 'logs' && !sessionsLoaded.value) {
    fetchSessions(true)
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
