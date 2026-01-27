import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ganttastic from '@infectoone/vue-ganttastic'

createApp(App)
  .use(ganttastic)
  .mount('#app')
