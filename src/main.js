import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './i18n/index.js'
import router from './router/index.js'
import App from './App.vue'
import './styles/main.scss'
import { getBrandKey, getBrandConfig } from './config/brand.js'

// Apply default brand to <html> before app mounts (prevents FOUC)
const brandKey = getBrandKey()
const brandConfig = getBrandConfig()
document.documentElement.setAttribute('data-brand', brandKey)
document.title = brandConfig.displayName || 'Football Portal'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
