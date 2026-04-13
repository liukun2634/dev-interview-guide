<template>
  <div class="nav-header" :class="{ 'has-current': !!currentSection }">
    <!-- Brand -->
    <a class="nav-brand" :href="withBase('/')">
      <svg class="nav-brand-icon" viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
        <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z"></path>
      </svg>
      <span class="nav-brand-text">程序员面试手册</span>
    </a>

    <!-- Separator -->
    <svg class="nav-sep" viewBox="0 0 16 16" width="16" height="16">
      <line x1="11" y1="2" x2="5" y2="14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></line>
    </svg>

    <!-- Section selector -->
    <div class="nav-sections" ref="selectorRef">
      <button class="nav-sections-btn" @click="toggleDropdown" :class="{ active: dropdownOpen }">
        <span class="nav-sections-label">{{ currentSection?.text || '知识库' }}</span>
        <svg class="nav-sections-chevron" viewBox="0 0 12 12" width="12" height="12" fill="currentColor">
          <path d="M6 8.825c-.2 0-.4-.1-.5-.2l-3.3-3.3c-.3-.3-.3-.8 0-1.1.3-.3.8-.3 1.1 0l2.7 2.7 2.7-2.7c.3-.3.8-.3 1.1 0 .3.3.3.8 0 1.1l-3.2 3.3c-.2.1-.4.2-.6.2Z"></path>
        </svg>
      </button>
      <Transition name="dropdown">
        <div v-if="dropdownOpen" class="nav-dropdown">
          <a
            v-for="section in sections"
            :key="section.link"
            :href="withBase(section.link)"
            class="nav-dropdown-item"
            :class="{ current: isCurrent(section.link) }"
            @click="dropdownOpen = false"
          >
            <svg v-if="isCurrent(section.link)" class="nav-dropdown-check" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
            </svg>
            <span class="nav-dropdown-text">{{ section.text }}</span>
          </a>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, withBase } from 'vitepress'

const route = useRoute()
const dropdownOpen = ref(false)
const selectorRef = ref<HTMLElement | null>(null)

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

const currentSection = computed(() => {
  return sections.find(s =>
    route.path.startsWith(withBase(s.link.replace(/\/$/, '')))
  ) || null
})

function isCurrent(link: string) {
  return route.path.startsWith(withBase(link.replace(/\/$/, '')))
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function onClickOutside(e: MouseEvent) {
  if (selectorRef.value && !selectorRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false
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
.nav-header {
  display: flex;
  align-items: center;
  gap: 0;
  height: 100%;
  flex-grow: 1;
  padding-right: 16px;
}

/* ---- Brand ---- */
.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--ghd-fgColor-default);
  flex-shrink: 0;
  padding: 4px 0;
  transition: opacity 0.15s;
}

.nav-brand:hover {
  opacity: 0.8;
}

.nav-brand-icon {
  flex-shrink: 0;
  color: var(--ghd-fgColor-muted);
}

.nav-brand-text {
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

/* ---- Separator ---- */
.nav-sep {
  flex-shrink: 0;
  color: var(--ghd-borderColor-emphasis);
  opacity: 0.5;
  margin: 0 4px;
}

/* ---- Section selector ---- */
.nav-sections {
  position: relative;
}

.nav-sections-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 14px;
  font-weight: 400;
  color: var(--ghd-fgColor-default);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--ghd-radius);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.nav-sections-btn:hover {
  background: var(--ghd-bgColor-muted);
}

.nav-sections-btn.active {
  background: var(--ghd-bgColor-muted);
  border-color: var(--ghd-borderColor-default);
}

.nav-sections-chevron {
  color: var(--ghd-fgColor-muted);
  transition: transform 0.2s;
}

.nav-sections-btn.active .nav-sections-chevron {
  transform: rotate(180deg);
}

/* ---- Dropdown ---- */
.nav-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 240px;
  background: var(--ghd-bgColor-white);
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: var(--ghd-radius);
  box-shadow: var(--ghd-shadow-lg);
  padding: 4px 0;
  z-index: 200;
  max-height: 400px;
  overflow-y: auto;
}

:global(.dark) .nav-dropdown {
  background: var(--ghd-bgColor-muted);
}

.nav-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 16px;
  font-size: 14px;
  color: var(--ghd-fgColor-default);
  text-decoration: none;
  transition: background 0.1s;
  white-space: nowrap;
}

.nav-dropdown-item:hover {
  background: var(--ghd-bgColor-muted);
}

:global(.dark) .nav-dropdown-item:hover {
  background: rgba(56, 139, 253, 0.08);
}

.nav-dropdown-item.current {
  font-weight: 600;
}

.nav-dropdown-check {
  color: var(--ghd-fgColor-accent);
  flex-shrink: 0;
}

.nav-dropdown-text {
  flex-grow: 1;
}

.nav-dropdown-item:not(.current) {
  padding-left: 40px;
}

/* ---- Transition ---- */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .nav-header {
    display: none;
  }
}
</style>
