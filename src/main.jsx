import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import App from './App'
import { ToastProvider } from './components/Toast'
import { AuthProvider } from './context/AuthContext'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider>
  </React.StrictMode>,
)
