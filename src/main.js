import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './i18n/index.js'
import router from './router/index.js'
import App from './App.vue'
import './styles/main.scss'

// Apply default brand to <html> before app mounts (prevents FOUC)
const defaultBrand = typeof __DEFAULT_BRAND__ !== 'undefined' ? __DEFAULT_BRAND__ : 'football1'
document.documentElement.setAttribute('data-brand', defaultBrand)
document.title = defaultBrand === 'football2' ? 'Kickoff' : 'Pitchside'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
