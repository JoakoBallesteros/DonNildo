// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Compras from './pages/Compras.jsx'
import Ventas from './pages/Ventas.jsx'
import Reportes from './pages/Reportes.jsx'
import Seguridad from './pages/Seguridad.jsx'
import LoginPage from './pages/LoginPage.jsx'

/* Paginas de Stock */
import StockList from './pages/StockList.jsx'
import StockNuevoProducto from './pages/StockNuevoProducto.jsx'
import StockPesaje from './pages/StockPesaje.jsx'


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login fuera del layout si querés pantalla limpia */}
        <Route path="/login" element={<LoginPage />} />

        {/* App “protegida” bajo un layout (sin auth por ahora) */}
        <Route
          path="/"
          element={<Layout />}
        >
          <Route index element={<Home />} />
          <Route path="compras" element={<Compras />} />
          <Route path="ventas" element={<Ventas />} />
          
          
          <Route path="stock" /* Stock */>
            <Route index element={<StockList />} />
            <Route path="nuevo-producto" element={<StockNuevoProducto />} />
            <Route path="pesaje" element={<StockPesaje />} />
          </Route>

          <Route path="reportes" element={<Reportes />} />
          <Route path="seguridad" element={<Seguridad />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}