<script setup lang="ts">
import { takeoffEddf } from '~~/shared/data/flightlab/takeoff-eddf'

const scenarios = [takeoffEddf]
</script>

<template>
  <v-container class="py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white">FlightLab</h1>
      <p class="text-slate-300 mt-2">Gefuehrte Flugerlebnisse fuer Menschen mit Flugangst.</p>
    </div>

    <v-row>
      <v-col
        v-for="scenario in scenarios"
        :key="scenario.id"
        cols="12"
        md="6"
      >
        <v-card class="glass-card h-100" rounded="xl" elevation="0">
          <v-card-item>
            <template #prepend>
              <v-icon :icon="scenario.icon" color="primary" size="32" />
            </template>
            <v-card-title class="text-white">{{ scenario.title }}</v-card-title>
            <v-card-subtitle>{{ scenario.aircraft }} · {{ scenario.airport }}</v-card-subtitle>
          </v-card-item>

          <v-card-text class="text-slate-300">
            {{ scenario.description }}
          </v-card-text>

          <v-card-actions>
            <v-btn color="primary" :to="`/flightlab/takeoff`">Starten</v-btn>
            <v-btn variant="text" :to="`/flightlab/takeoff/instructor`">Als Instructor</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
