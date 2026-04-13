import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import HomeContent from './components/HomeContent.vue'
import ReadingProgress from './components/ReadingProgress.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(ReadingProgress),
    })
  },
  enhanceApp({ app }) {
    app.component('HomeContent', HomeContent)
  },
}
