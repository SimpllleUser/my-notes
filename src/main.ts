import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './app/styles/index.css'
import './app/styles/main.scss'

import App from './app/App.vue'
import router from './app/providers/router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
