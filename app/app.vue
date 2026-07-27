<template>
  <v-app>
    <NuxtPage/>
  </v-app>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute, useState } from '#imports';
import { useAuthStore } from '~/stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const productSession = useState<{ product: 'classroom' | 'liveatc'; path: string; startedAt: number } | null>('product-usage-session', () => null);

const resolveTrackedProduct = (path: string): 'classroom' | 'liveatc' | null => {
  if (path.startsWith('/classroom')) return 'classroom';
  if (path.startsWith('/live-atc') || path.startsWith('/pm') || path.startsWith('/copilot') || path.startsWith('/bridge')) return 'liveatc';
  return null;
};

const flushProductSession = () => {
  if (typeof window === 'undefined' || !productSession.value) {
    return;
  }

  const session = productSession.value;
  productSession.value = null;
  const endedAt = Date.now();
  const durationSeconds = Math.round((endedAt - session.startedAt) / 1000);

  if (durationSeconds < 5) {
    return;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authStore.accessToken) {
    headers.Authorization = `Bearer ${authStore.accessToken}`;
  }

  fetch('/api/analytics/product-session', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      product: session.product,
      path: session.path,
      durationSeconds,
      startedAt: new Date(session.startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
    }),
    keepalive: true,
  }).catch(() => undefined);
};

const syncProductSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const product = authStore.isAuthenticated ? resolveTrackedProduct(route.path) : null;
  const current = productSession.value;

  if (current && (!product || current.product !== product || current.path !== route.path)) {
    flushProductSession();
  }

  if (product && !productSession.value) {
    productSession.value = {
      product,
      path: route.path,
      startedAt: Date.now(),
    };
  }
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    flushProductSession();
  } else {
    syncProductSession();
  }
};

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }

  watch(
    [() => route.path, () => authStore.isAuthenticated],
    () => syncProductSession(),
    { immediate: true }
  );

  window.addEventListener('beforeunload', flushProductSession);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  flushProductSession();
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', flushProductSession);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }
});
</script>
