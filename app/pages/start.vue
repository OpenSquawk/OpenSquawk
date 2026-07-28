<script setup lang="ts">
const route = useRoute()

definePageMeta({ layout: false })

// This page was /start in the monorepo and became the app's front page in the
// split (see index.vue). Bookmarks, the website's redirect and every link that
// predates the split still point at /start, so catch it here instead of
// showing a 404 — the app should not depend on the website being redeployed
// for its own old URLs to work.
await navigateTo({ path: '/', query: route.query }, { replace: true })
</script>
