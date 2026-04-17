<template>
  <div class="nav-section-selector" ref="container">
    <button class="nav-section-btn" @click="toggle" :class="{ open }">
      <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
        <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25ZM6.5 6.5v8h7.75a.25.25 0 0 0 .25-.25V6.5Zm8-1.5V1.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25V5ZM5 6.5H1.5v7.75c0 .138.112.25.25.25H5Z"></path>
      </svg>
      <span>知识库</span>
      <svg class="nav-section-chevron" viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
        <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.94l3.72-3.72a.749.749 0 0 1 1.06 0Z"></path>
      </svg>
    </button>

    <div v-if="open" class="nav-section-panel">
      <a
        v-for="section in sections"
        :key="section.link"
        :href="withBase(section.link)"
        class="nav-section-item"
        :class="{ active: isCurrent(section.link) }"
        @click="open = false"
      >
        {{ section.text }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, withBase } from 'vitepress'

const open = ref(false)
const container = ref<HTMLElement | null>(null)
const route = useRoute()

const sections = [
  { text: '数据结构与算法', link: '/data-structures-and-algorithms/' },
  { text: '操作系统', link: '/operating-systems/' },
  { text: '计算机网络', link: '/computer-networks/' },
  { text: '数据库', link: '/databases/' },
  { text: '系统设计', link: '/system-design/' },
  { text: '工程实践', link: '/engineering-practice/' },
  { text: '编程语言', link: '/programming-languages/' },
  { text: 'Web 与框架', link: '/web-and-frameworks/' },
  { text: 'AI 技术', link: '/ai-technology/' },
]

function isCurrent(link: string) {
  return route.path.startsWith(withBase(link.replace(/\/$/, '')))
}

function toggle() {
  open.value = !open.value
}

function onClickOutside(e: MouseEvent) {
  if (container.value && !container.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
.nav-section-selector {
  position: relative;
  display: flex;
  align-items: center;
}

.nav-section-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
  color: var(--ghd-fgColor-default);
  font-family: inherit;
  border-radius: var(--ghd-radius, 6px);
  transition: color 0.15s;
}

.nav-section-btn:hover {
  color: var(--ghd-fgColor-muted);
}

.nav-section-chevron {
  color: var(--ghd-fgColor-muted);
  transition: transform 0.15s;
}

.nav-section-btn.open .nav-section-chevron {
  transform: rotate(180deg);
}

.nav-section-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  background: var(--ghd-bgColor-white, #fff);
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: var(--ghd-radius, 6px);
  box-shadow: var(--ghd-shadow-lg);
  z-index: 200;
  padding: 4px 0;
  max-height: 400px;
  overflow-y: auto;
}

.nav-section-item {
  display: block;
  padding: 8px 16px;
  font-size: 14px;
  color: var(--ghd-fgColor-default);
  text-decoration: none;
  transition: background 0.1s;
  white-space: nowrap;
}

.nav-section-item:hover {
  background: var(--ghd-bgColor-muted);
}

.nav-section-item.active {
  color: var(--ghd-fgColor-accent);
  font-weight: 600;
  background: rgba(9, 105, 218, 0.06);
}

:global(.dark) .nav-section-item.active {
  background: rgba(56, 139, 253, 0.1);
}
</style>
