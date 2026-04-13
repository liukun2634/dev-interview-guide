import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import HomeContent from './components/HomeContent.vue'
import SidebarHeader from './components/SidebarHeader.vue'
import './github-docs.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'sidebar-nav-before': () => h(SidebarHeader),
    })
  },
  enhanceApp({ app }) {
    app.component('HomeContent', HomeContent)
  },
}
