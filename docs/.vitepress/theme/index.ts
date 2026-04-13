import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import HomeContent from './components/HomeContent.vue'
import SidebarHeader from './components/SidebarHeader.vue'
import SidebarBack from './components/SidebarBack.vue'
import NavHeader from './components/NavHeader.vue'
import './github-docs.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'sidebar-nav-before': () => h(SidebarHeader),
      'sidebar-nav-after': () => h(SidebarBack),
      'nav-bar-content-before': () => h(NavHeader),
    })
  },
  enhanceApp({ app }) {
    app.component('HomeContent', HomeContent)
  },
}
