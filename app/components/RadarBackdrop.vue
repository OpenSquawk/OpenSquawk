<script setup lang="ts">
withDefaults(defineProps<{
  glowPrimary?: string
  glowSecondary?: string
}>(), {
  glowPrimary: 'rgba(103, 232, 249, 0.35)',
  glowSecondary: 'rgba(251, 191, 36, 0.25)',
})
</script>

<template>
  <div class="radar-backdrop" aria-hidden="true">
    <div
        class="radar-backdrop__glow radar-backdrop__glow--a"
        :style="{ background: `radial-gradient(circle, ${glowPrimary}, transparent 70%)` }"
    />
    <div
        class="radar-backdrop__glow radar-backdrop__glow--b"
        :style="{ background: `radial-gradient(circle, ${glowSecondary}, transparent 70%)` }"
    />
    <div class="radar-backdrop__grid" />
    <svg class="radar-backdrop__radar" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="200" r="60" stroke="currentColor" stroke-width="1" />
      <circle cx="200" cy="200" r="120" stroke="currentColor" stroke-width="1" />
      <circle cx="200" cy="200" r="180" stroke="currentColor" stroke-width="1" />
      <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" stroke-width="1" />
      <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" stroke-width="1" />
    </svg>
  </div>
</template>

<style scoped>
.radar-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.radar-backdrop__glow {
  position: absolute;
  border-radius: 9999px;
  filter: blur(90px);
  opacity: 0.35;
  width: 32rem;
  height: 32rem;
}

.radar-backdrop__glow--a {
  top: -10%;
  left: -8%;
}

.radar-backdrop__glow--b {
  bottom: -15%;
  right: -10%;
  width: 30rem;
  height: 30rem;
}

.radar-backdrop__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%);
}

.radar-backdrop__radar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44rem;
  height: 44rem;
  transform: translate(-50%, -50%);
  color: rgba(103, 232, 249, 0.08);
  animation: radar-backdrop-spin 60s linear infinite;
}

@keyframes radar-backdrop-spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .radar-backdrop__radar {
    animation: none;
  }
}
</style>
