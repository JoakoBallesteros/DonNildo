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


import LoginPage from "./pages/LoginPage.jsx";
import AuthReset from "./pages/AuthReset.jsx";
import AccountProfile from "./pages/AccountProfile.jsx";
import ForgotPassword from "./components/pages/ForgotPassword.jsx";
import ResetPassword from "./components/pages/ResetPassword.jsx";
/* Compras */
import Compras from "./pages/Compras.jsx";
import Proveedores from "./pages/Proveedores.jsx";   
import RegistrarCompra from "./pages/RegistrarCompra.jsx";

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
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset"  element={<ResetPassword />} />

        {/* RUTAS PROTEGIDAS */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />

            {/* COMPRAS */}
            <Route path="compras" element={<Outlet />}>
              <Route index element={<Compras />} />
              <Route path="nueva" element={<RegistrarCompra />} />
              <Route path="proveedores" element={<Proveedores />} />
              <Route path="/compras/editar/:id" element={<RegistrarCompra />} />
            </Route>

            {/* VENTAS */}
            <Route path="ventas" element={<Ventas />} />
            <Route
              path="ventas/nueva"
              element={<RegistrarVentas editMode={false} />}
            />
            <Route
              path="ventas/editar/:id"
              element={<RegistrarVentas editMode={true} />}
            />

            {/* STOCK */}
            <Route path="stock" element={<Outlet />}>
              <Route index element={<StockList />} />
              <Route path="nuevo-producto" element={<StockNuevoProducto />} />
              <Route path="pesaje" element={<StockPesaje />} />
              <Route path="pesajes" element={<StockPesajesLista />} />
            </Route>

            {/* REPORTES */}
            <Route path="reportes" element={<Reportes />} />

            {/* SEGURIDAD */}
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
