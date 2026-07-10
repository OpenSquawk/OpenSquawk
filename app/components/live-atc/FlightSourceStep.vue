<script setup lang="ts">
import SetupCard from '~/components/live-atc/SetupCard.vue'

defineProps<{
  loading: boolean
  error: string
}>()

const vatsimId = defineModel<string>('vatsimId', { required: true })

defineEmits<{
  (e: 'load-flight-plans'): void
  (e: 'start-demo'): void
}>()
</script>

<template>
  <section class="space-y-6">
    <SetupCard>
      <div class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold">VATSIM Integration</h2>
          <p class="text-sm text-[var(--t3)]">Enter your CID to load your filtered flight plans.</p>
        </div>
        <v-text-field
            v-model="vatsimId"
            label="VATSIM CID"
            variant="outlined"
            density="comfortable"
            color="cyan"
            prepend-inner-icon="mdi-account-circle"
            hide-details
            inputmode="numeric"
        />
        <v-btn
            block
            color="cyan"
            variant="flat"
            :loading="loading"
            @click="$emit('load-flight-plans')"
        >
          Load flight plans
        </v-btn>
        <v-alert
            v-if="error"
            type="warning"
            density="compact"
            variant="tonal"
            class="bg-amber-500/10 text-amber-200"
        >
          {{ error }}
        </v-alert>
      </div>
    </SetupCard>

    <!-- Demo Mode -->
    <SetupCard>
      <div class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold">Demo Mode</h2>
          <p class="text-sm text-[var(--t3)]">Start with a sample flight plan for testing.</p>
        </div>
        <v-btn
            block
            color="orange"
            variant="outlined"
            @click="$emit('start-demo')"
        >
          Start demo (DLH39A EDDF→EDDM)
        </v-btn>
      </div>
    </SetupCard>
  </section>
</template>
