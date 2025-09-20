<template>
  <v-app>
    <NuxtPage/>
    <CookieConsentBanner v-if="showCookieBanner"/>
  </v-app>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from '#imports';
import { useAuthStore } from '~/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

const showCookieBanner = computed(() => {
  if (!authStore.isAuthenticated) {
    return true;
  }

  return route.path === '/';
});
</script>
