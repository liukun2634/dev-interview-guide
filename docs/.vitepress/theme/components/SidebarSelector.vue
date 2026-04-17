<template>
  <div class="sidebar-selector">
    <a class="sidebar-home" :href="withBase('/')">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <path d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Zm1.25 1.171a.25.25 0 0 0-.312 0l-5.25 4.2a.25.25 0 0 0-.094.196v7.019c0 .138.112.25.25.25H5.5V9.5a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v4.25h2.25a.25.25 0 0 0 .25-.25V6.23a.25.25 0 0 0-.094-.195Z"></path>
      </svg>
      主页
    </a>

    <button class="sidebar-dropdown-btn" @click="toggle" :class="{ open }">
      <svg class="sidebar-dropdown-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
        <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25ZM6.5 6.5v8h7.75a.25.25 0 0 0 .25-.25V6.5Zm8-1.5V1.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25V5ZM5 6.5H1.5v7.75c0 .138.112.25.25.25H5Z"></path>
      </svg>
      <span class="sidebar-dropdown-text">{{ currentLabel }}</span>
      <svg class="sidebar-dropdown-chevron" viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
        <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.94l3.72-3.72a.749.749 0 0 1 1.06 0Z"></path>
      </svg>
    </button>

    <div v-if="open" class="sidebar-dropdown-panel">
      <a
        v-for="section in sections"
        :key="section.link"
        :href="withBase(section.link)"
        class="sidebar-dropdown-item"
        :class="{ active: isCurrent(section.link) }"
        @click="open = false"
      >
        {{ section.text }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, withBase } from 'vitepress'

const open = ref(false)
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

const currentLabel = computed(() => {
  const found = sections.find(s => isCurrent(s.link))
  return found ? found.text : '知识库'
})

function toggle() {
  open.value = !open.value
}
</script>

<style scoped>
.sidebar-selector {
  margin-bottom: 16px;
  position: relative;
}

.sidebar-home {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ghd-fgColor-muted);
  text-decoration: none;
  margin-bottom: 10px;
  padding: 2px 0;
  transition: color 0.15s;
}

.sidebar-home:hover {
  color: var(--ghd-fgColor-accent);
}

.sidebar-dropdown-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: var(--ghd-bgColor-muted);
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: var(--ghd-radius, 6px);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--ghd-fgColor-default);
  font-family: inherit;
  transition: border-color 0.15s;
}

.sidebar-dropdown-btn:hover {
  border-color: var(--ghd-borderColor-emphasis);
}

.sidebar-dropdown-icon {
  flex-shrink: 0;
  color: var(--ghd-fgColor-muted);
}

.sidebar-dropdown-text {
  flex-grow: 1;
  text-align: left;
}

.sidebar-dropdown-chevron {
  flex-shrink: 0;
  color: var(--ghd-fgColor-muted);
  transition: transform 0.15s;
}

.sidebar-dropdown-btn.open .sidebar-dropdown-chevron {
  transform: rotate(180deg);
}

.sidebar-dropdown-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--ghd-bgColor-white, #fff);
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: var(--ghd-radius, 6px);
  box-shadow: var(--ghd-shadow-lg);
  z-index: 100;
  padding: 4px 0;
  max-height: 320px;
  overflow-y: auto;
}

.sidebar-dropdown-item {
  display: block;
  padding: 8px 16px;
  font-size: 14px;
  color: var(--ghd-fgColor-default);
  text-decoration: none;
  transition: background 0.1s;
}

.sidebar-dropdown-item:hover {
  background: var(--ghd-bgColor-muted);
}

.sidebar-dropdown-item.active {
  color: var(--ghd-fgColor-accent);
  font-weight: 600;
  background: rgba(9, 105, 218, 0.06);
}

:global(.dark) .sidebar-dropdown-item.active {
  background: rgba(56, 139, 253, 0.1);
}
</style>
