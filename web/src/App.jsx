// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/pages/Layout.jsx";
import Home from "./pages/Home.jsx";
import Compras from "./pages/Compras.jsx";
import Ventas from "./pages/Ventas.jsx";
import Reportes from "./pages/Reportes.jsx";
import Seguridad from "./pages/Seguridad.jsx";
import LoginPage from "./pages/LoginPage.jsx";

/* Stock */
import StockList from "./pages/StockList.jsx";
import StockNuevoProducto from "./pages/StockNuevoProducto.jsx";
import StockPesaje from "./pages/StockPesaje.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="compras" element={<Compras />} />
          <Route path="ventas" element={<Ventas />} />

          {/* 👇 Ruta padre con Outlet (importado arriba) */}
          <Route path="stock" element={<Outlet />}>
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
  );
}