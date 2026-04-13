<template>
  <a v-if="showBack" class="sidebar-back" :href="withBase('/')">
    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
      <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"></path>
    </svg>
    返回主页
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, withBase } from 'vitepress'

const route = useRoute()

const showBack = computed(() => {
  const path = route.path
  return path !== withBase('/') && path !== withBase('/index.html')
})
</script>

<style scoped>
.sidebar-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 400;
  color: var(--ghd-fgColor-muted);
  text-decoration: none;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--ghd-borderColor-default);
  transition: color 0.15s;
}

.sidebar-back:hover {
  color: var(--ghd-fgColor-accent);
}
</style>
