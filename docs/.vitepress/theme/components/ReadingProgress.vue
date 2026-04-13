<template>
  <div
    v-if="!isHome"
    class="reading-progress"
    :style="{ transform: `scaleX(${progress / 100})` }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()
const progress = ref(0)

const isHome = computed(() => frontmatter.value?.layout === 'home')

let rafId: number | null = null

function updateProgress() {
  const scrolled = window.scrollY || document.documentElement.scrollTop
  const total = document.documentElement.scrollHeight - window.innerHeight
  progress.value = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0
}

function onScroll() {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    updateProgress()
    rafId = null
  })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  updateProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #0d9488, #14b8a6);
  transform-origin: left center;
  z-index: 9999;
  pointer-events: none;
  transition: transform 0.1s linear;
}
</style>
