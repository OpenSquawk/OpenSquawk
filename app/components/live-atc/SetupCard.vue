<script setup lang="ts">
/**
 * The navy/glow panel the /live-atc setup screens are built from — replaces the
 * old `bg-white/5 border-white/10` glassmorphism cards. Shared so the four step
 * components can't drift apart, and so the light-theme overrides live in one place.
 */
withDefaults(defineProps<{
  /** Renders as a <button> with hover/focus affordance instead of a plain panel. */
  interactive?: boolean
}>(), {
  interactive: false,
})
</script>

<template>
  <component
      :is="interactive ? 'button' : 'div'"
      :type="interactive ? 'button' : undefined"
      class="setup-card"
      :class="{ 'setup-card--interactive': interactive }"
  >
    <div class="setup-card__body">
      <slot />
    </div>
  </component>
</template>

<style scoped>
.setup-card {
  position: relative;
  display: block;
  width: 100%;
  border-radius: 16px;
  border: 1px solid var(--border);
  background:
    linear-gradient(160deg,
      color-mix(in srgb, var(--bg2) 88%, transparent),
      color-mix(in srgb, var(--bg) 94%, transparent));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--text) 6%, transparent),
    0 18px 40px -24px rgba(0, 0, 0, 0.85);
  overflow: hidden;
  text-align: left;
}

/* Hairline accent along the top edge — the one cyan cue on an otherwise dark panel. */
.setup-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--accent) 55%, transparent),
      transparent
  );
  opacity: 0.7;
}

.setup-card__body {
  position: relative;
  padding: 1rem;
}

.setup-card--interactive {
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.setup-card--interactive:hover,
.setup-card--interactive:focus-visible {
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--text) 8%, transparent),
    0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent),
    0 20px 44px -22px color-mix(in srgb, var(--accent) 35%, transparent);
}

.setup-card--interactive:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .setup-card--interactive {
    transition: none;
  }
}
</style>
