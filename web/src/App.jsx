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
import RequireRoles from "./components/auth/RequireRoles.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/reset" element={<AuthReset />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset" element={<ResetPassword />} />

        {/* RUTAS PROTEGIDAS POR SESIÓN */}
        <Route element={<ProtectedRoute />}>
          {/* Perfil también debería requerir sesión */}
          <Route path="/account" element={<AccountProfile />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />

            {/* ========== COMPRAS ========== */}
            <Route
              path="compras"
              element={
                <RequireRoles allowed={["ADMIN", "COMPRAS"]}>
                  <Outlet />
                </RequireRoles>
              }
            >
              <Route index element={<Compras />} />
              <Route path="nueva" element={<RegistrarCompra />} />
              <Route path="proveedores" element={<Proveedores />} />
              <Route path="editar/:id" element={<RegistrarCompra />} />
            </Route>

            {/* ========== VENTAS ========== */}
            <Route
              path="ventas"
              element={
                <RequireRoles allowed={["ADMIN", "VENTAS"]}>
                  <Outlet />
                </RequireRoles>
              }
            >
              <Route index element={<Ventas />} />
              <Route
                path="nueva"
                element={<RegistrarVentas editMode={false} />}
              />
              <Route
                path="editar/:id"
                element={<RegistrarVentas editMode={true} />}
              />
            </Route>

            {/* ========== STOCK ========== */}
            {/* Admin + Stock + Compras + Ventas pueden entrar a la sección Stock */}
            <Route
              path="stock"
              element={
                <RequireRoles
                  allowed={["ADMIN", "STOCK", "COMPRAS", "VENTAS"]}
                >
                  <Outlet />
                </RequireRoles>
              }
            >
              {/* Listado de productos/stock: todos los anteriores */}
              <Route index element={<StockList />} />

              {/* Nuevo producto: solo ADMIN + STOCK */}
              <Route
                path="nuevo-producto"
                element={
                  <RequireRoles allowed={["ADMIN", "STOCK"]}>
                    <StockNuevoProducto />
                  </RequireRoles>
                }
              />

              {/* Registrar pesaje: solo ADMIN + STOCK */}
              <Route
                path="pesaje"
                element={
                  <RequireRoles allowed={["ADMIN", "STOCK"]}>
                    <StockPesaje />
                  </RequireRoles>
                }
              />

              {/* Historial de pesajes: ADMIN + STOCK + COMPRAS + VENTAS */}
              <Route
                path="pesajes"
                element={
                  <RequireRoles
                    allowed={["ADMIN", "STOCK", "COMPRAS", "VENTAS"]}
                  >
                    <StockPesajesLista />
                  </RequireRoles>
                }
              />
            </Route>

            {/* ========== REPORTES (solo ADMIN) ========== */}
            <Route
              path="reportes"
              element={
                <RequireRoles allowed={["ADMIN"]}>
                  <Reportes />
                </RequireRoles>
              }
            />

            {/* ========== SEGURIDAD (solo ADMIN) ========== */}
            <Route
              path="seguridad"
              element={
                <RequireRoles allowed={["ADMIN"]}>
                  <SegUsuarios />
                </RequireRoles>
              }
            />
            <Route
              path="seguridad/auditoria"
              element={
                <RequireRoles allowed={["ADMIN"]}>
                  <SegAuditoria />
                </RequireRoles>
              }
            />
            <Route
              path="seguridad/roles"
              element={
                <RequireRoles allowed={["ADMIN"]}>
                  <SegRoles />
                </RequireRoles>
              }
            />
          </Route>
        </Route>

        {/* Cualquier otra ruta redirige */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
