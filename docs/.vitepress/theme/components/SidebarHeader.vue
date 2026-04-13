<template>
  <div class="sidebar-header" v-if="currentSection">
    <a class="sidebar-back" :href="withBase('/')">
      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
        <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"></path>
      </svg>
      返回主页
    </a>
    <a class="sidebar-section-title" :href="withBase(currentSection.link)">
      {{ currentSection.text }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, withBase } from 'vitepress'

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

const currentSection = computed(() => {
  return sections.find(s =>
    route.path.startsWith(withBase(s.link.replace(/\/$/, '')))
  ) || null
})
</script>

<style scoped>
.sidebar-header {
  padding-top: 16px;
  margin-bottom: 16px;
}

.sidebar-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ghd-fgColor-default);
  text-decoration: none;
  margin-bottom: 20px;
}

.sidebar-back:hover {
  color: var(--ghd-fgColor-accent);
}

.sidebar-section-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--ghd-fgColor-default);
  text-decoration: none;
  line-height: 1.4;
  padding-top: 16px;
  border-top: 1px solid var(--ghd-borderColor-default);
}
</style>
