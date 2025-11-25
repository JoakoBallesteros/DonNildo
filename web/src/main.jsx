import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import '@fontsource/ubuntu/400.css'
import '@fontsource/ubuntu/500.css'
import '@fontsource/ubuntu/700.css'

//  importa el cliente una (1) sola vez y lo expone en window
import supa from './lib/supabaseClient.js'
if (typeof window !== 'undefined') {
  // evita re-asignar si haces HMR
  window.supa = window.supa || supa
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)





