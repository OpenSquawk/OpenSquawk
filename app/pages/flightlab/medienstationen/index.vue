<template>
  <div class="min-h-screen bg-[#070d1a] text-white">
    <!-- Header -->
    <header class="border-b border-white/5 bg-[#070d1a]/80 backdrop-blur">
      <div class="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 px-4 py-6 sm:px-6 md:px-8">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
            <v-icon icon="mdi-airplane" size="26" class="text-cyan-300" />
          </div>
          <div>
            <p class="text-lg font-semibold tracking-tight">FlightLab</p>
            <p class="text-sm text-white/60">Guided cockpit experiences</p>
          </div>
        </div>
        <NuxtLink to="/flightlab" class="text-sm text-white/50 transition hover:text-white/80">
          <v-icon icon="mdi-arrow-left" size="16" class="mr-1" />
          Zurück
        </NuxtLink>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section class="relative border-b border-white/5">
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-indigo-500/25" />
        <div class="relative z-10 mx-auto w-full max-w-screen-xl px-4 py-16 sm:px-6 md:px-8">
          <div class="max-w-3xl space-y-6">
            <span
              class="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80"
            >
              <v-icon icon="mdi-monitor-dashboard" size="14" />
              Medienstationen
            </span>
            <h1 class="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
              Instrumente verstehen.<br />
              <span class="text-cyan-300">Interaktiv lernen.</span>
            </h1>
            <p class="max-w-2xl text-base text-white/80 sm:text-lg">
              Entdecke die wichtigsten Cockpit-Instrumente Schritt für Schritt -
              interaktiv, visuell und in deinem eigenen Tempo.
              Verstehe, was Piloten auf ihren Anzeigen sehen und warum.
            </p>
          </div>
        </div>
      </section>

      <!-- Cards Grid -->
      <section class="mx-auto w-full max-w-screen-xl px-4 py-12 sm:px-6 md:px-8">
        <h2 class="mb-8 text-xl font-semibold text-white/90">Verfügbare Stationen</h2>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <!-- PFD verstehen Card -->
          <div class="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1328]/90 shadow-xl shadow-cyan-500/5 transition hover:border-cyan-400/30 hover:shadow-cyan-500/15">
            <!-- Card glow -->
            <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

            <div class="relative z-10 p-6">
              <!-- Icon + Badge -->
              <div class="mb-5 flex items-start justify-between">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
                  <v-icon icon="mdi-gauge" size="30" class="text-cyan-300" />
                </div>
                <span class="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Bereit
                </span>
              </div>

              <!-- Title + Info -->
              <h3 class="mb-2 text-xl font-semibold">PFD verstehen</h3>
              <p class="mb-4 text-sm text-white/60 leading-relaxed">
                Lerne Schritt für Schritt das Primary Flight Display des Airbus A320
                zu lesen — mit echtem Sidestick-Input.
              </p>

              <!-- Meta -->
              <div class="mb-6 flex flex-wrap gap-3 text-xs text-white/50">
                <span class="flex items-center gap-1.5">
                  <v-icon icon="mdi-airplane" size="14" class="text-cyan-400/60" />
                  Airbus A320
                </span>
                <span class="flex items-center gap-1.5">
                  <v-icon icon="mdi-gesture-tap" size="14" class="text-cyan-400/60" />
                  Interaktiv
                </span>
              </div>

              <!-- Actions -->
              <div class="flex flex-col gap-3">
                <NuxtLink to="/flightlab/medienstationen/learn-pfd">
                  <v-btn
                    color="primary"
                    variant="flat"
                    size="large"
                    block
                    class="rounded-xl font-semibold"
                    prepend-icon="mdi-play-circle"
                  >
                    Starten
                  </v-btn>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Coming Soon Card -->
          <div class="flex items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#0b1328]/40 p-6">
            <div class="text-center">
              <v-icon icon="mdi-monitor-dashboard" size="40" class="mb-3 text-white/20" />
              <p class="text-sm font-medium text-white/30">Weitere Stationen</p>
              <p class="text-xs text-white/20">Demnächst verfügbar</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: ['require-auth'],
})

useHead({
  title: 'FlightLab - Medienstationen',
})
</script>
