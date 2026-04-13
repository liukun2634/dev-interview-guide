import DefaultTheme from 'vitepress/theme'
import HomeContent from './components/HomeContent.vue'
import './github-docs.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeContent', HomeContent)
  },
}
