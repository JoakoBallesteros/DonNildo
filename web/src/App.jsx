// src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import Layout from "./components/pages/Layout.jsx";
import Home from "./pages/Home.jsx";
import Compras from "./pages/Compras.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import RegistrarCompra from "./pages/RegistrarCompra.jsx";
import AuthReset from "./pages/AuthReset.jsx";
import AccountProfile from "./pages/AccountProfile.jsx";

/* Stock */
import StockList from "./pages/StockList.jsx";
import StockNuevoProducto from "./pages/StockNuevoProducto.jsx";
import StockPesaje from "./pages/StockPesaje.jsx";
import StockPesajesLista from "./pages/StockPesajeLista.jsx";

/* Ventas */
import Ventas from "./pages/ListaVentas.jsx";
import RegistrarVentas from "./pages/RegistrarVentas.jsx";

/* Reportes */
import Reportes from "./pages/Reportes.jsx";
/* Seguridad*/
import SegUsuarios from "./pages/SegUsuarios";
import SegAuditoria from "./pages/SegAuditoria";
import SegRoles from "./pages/SegRoles";

import ProtectedRoute from "./components/auth/ProtectedRoutes.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA LIBRE */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/reset" element={<AuthReset />} />
        <Route path="/account" element={<AccountProfile />} />
        

        {/* RUTAS PROTEGIDAS */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="compras" element={<Outlet />}>
              <Route index element={<Compras />} />
              <Route path="nueva" element={<RegistrarCompra />} />
            </Route>

            <Route path="ventas" element={<Ventas />} />
            <Route path="ventas/nueva" element={<RegistrarVentas />} />

            <Route path="stock" element={<Outlet />}>
              <Route index element={<StockList />} />
              <Route path="nuevo-producto" element={<StockNuevoProducto />} />
              <Route path="pesaje" element={<StockPesaje />} />
              <Route path="pesajes" element={<StockPesajesLista />} />
            </Route>

            <Route path="reportes" element={<Reportes />} />
           

            <Route path="seguridad" element={<SegUsuarios />} />
            <Route path="seguridad/auditoria" element={<SegAuditoria />} />
            <Route path="seguridad/roles" element={<SegRoles />} />
          </Route>
        </Route>

        {/* Cualquier otra ruta redirige */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}