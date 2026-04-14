<template>
  <div class="sidebar-header" v-if="currentSection">
    <a class="sidebar-section-title" :href="withBase(currentSection.link)">
      章节提要
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, withBase } from 'vitepress'

const route = useRoute()

const sections = [
  { text: 'AI 技术', link: '/ai-technology/' },
  { text: '数据结构与算法', link: '/data-structures-and-algorithms/' },
  { text: '编程语言', link: '/programming-languages/' },
  { text: '操作系统', link: '/operating-systems/' },
  { text: '计算机网络', link: '/computer-networks/' },
  { text: '数据库', link: '/databases/' },
  { text: 'Web 与框架', link: '/web-and-frameworks/' },
  { text: '系统设计', link: '/system-design/' },
  { text: '工程实践', link: '/engineering-practice/' },
]

const currentSection = computed(() => {
  return sections.find(s =>
    route.path.startsWith(withBase(s.link.replace(/\/$/, '')))
  ) || null
})
</script>

<style scoped>
.sidebar-header {
  padding-top: 48px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ghd-borderColor-default);
}

.sidebar-section-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--ghd-fgColor-default);
  text-decoration: none;
  line-height: 1.4;
}
</style>
