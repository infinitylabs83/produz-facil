import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'

// GitHub Pages redireciona rotas desconhecidas para /?p=/caminho
// Este bloco restaura a rota correta antes do React carregar
;(function() {
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('p')
  if (redirect) {
    const url = decodeURIComponent(redirect)
    window.history.replaceState(null, '', '/produz-facil' + url)
  }
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/produz-facil">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
