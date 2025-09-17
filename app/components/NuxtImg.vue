<template>
  <img
    :src="resolvedSrc"
    :alt="alt"
    :loading="loadingAttr"
    :sizes="sizes || undefined"
    :width="widthAttr"
    :height="heightAttr"
    :decoding="decoding"
    :class="combinedClass"
    v-bind="restAttrs"
  />
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

type LoadingValue = 'lazy' | 'eager'

type DecodingValue = 'auto' | 'sync' | 'async'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  src: string
  alt?: string
  sizes?: string
  loading?: LoadingValue
  width?: string | number
  height?: string | number
  decoding?: DecodingValue
}>(), {
  alt: '',
  sizes: '',
  loading: 'lazy',
  decoding: 'async',
})

const attrs = useAttrs()

const resolvedSrc = computed(() => {
  if (!props.src) return ''
  if (/^(https?:)?\/\//i.test(props.src) || props.src.startsWith('data:')) {
    return props.src
  }
  const trimmed = props.src.replace(/^\/+/, '')
  return `/${trimmed}`
})

const loadingAttr = computed<LoadingValue>(() => (props.loading === 'eager' ? 'eager' : 'lazy'))
const widthAttr = computed(() => (props.width ? String(props.width) : undefined))
const heightAttr = computed(() => (props.height ? String(props.height) : undefined))

const toClassString = (value: unknown): string => {
  if (!value) return ''
  if (Array.isArray(value)) {
    return value.map((entry) => toClassString(entry)).filter(Boolean).join(' ')
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, active]) => Boolean(active))
      .map(([key]) => key)
      .join(' ')
  }
  return String(value)
}

const combinedClass = computed(() => {
  const normalized = toClassString(attrs.class)
  return normalized ? `nuxt-img ${normalized}` : 'nuxt-img'
})

const restAttrs = computed(() => {
  const keysToOmit = new Set(['class', 'src', 'alt', 'sizes', 'loading', 'width', 'height', 'decoding'])
  return Object.fromEntries(
    Object.entries(attrs as Record<string, unknown>).filter(([key]) => !keysToOmit.has(key))
  )
})
</script>

<style scoped>
.nuxt-img {
  display: block;
  width: 100%;
}
</style>
