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
import AccountProfile from "./pages/AccountProfile.jsx";
import ForgotPassword from "./components/pages/ForgotPassword.jsx";
import ResetPassword from "./components/pages/ResetPassword.jsx";

/* Compras */
import Compras from "./pages/Compras.jsx";
import Proveedores from "./pages/Proveedores.jsx";
import RegistrarCompra from "./pages/RegistrarCompra.jsx";

import StockList from "./pages/StockList.jsx";
import StockNuevoProducto from "./pages/StockNuevoProducto.jsx";
import StockPesaje from "./pages/StockPesaje.jsx";
import StockPesajesLista from "./pages/StockPesajeLista.jsx";

import Ventas from "./pages/ListaVentas.jsx";
import RegistrarVentas from "./pages/RegistrarVentas.jsx";

import Reportes from "./pages/Reportes.jsx";

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
        <Route path="/forgot" element={<ForgotPassword />} />

        {/* invite y recovery usan lo mismo*/}
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/auth/reset" element={<ResetPassword />} />

        {/* RUTAS PROTEGIDAS POR SESIÓN */}
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<AccountProfile />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />

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

            <Route
              path="ventas"
              element={
                <RequireRoles allowed={["ADMIN", "VENTAS"]}>
                  <Outlet />
                </RequireRoles>
              }
            >
              <Route index element={<Ventas />} />
              <Route path="nueva" element={<RegistrarVentas editMode={false} />} />
              <Route path="editar/:id" element={<RegistrarVentas editMode={true} />} />
            </Route>

            <Route
              path="stock"
              element={
                <RequireRoles allowed={["ADMIN", "STOCK", "COMPRAS", "VENTAS"]}>
                  <Outlet />
                </RequireRoles>
              }
            >
              <Route index element={<StockList />} />

              <Route
                path="nuevo-producto"
                element={
                  <RequireRoles allowed={["ADMIN", "STOCK"]}>
                    <StockNuevoProducto />
                  </RequireRoles>
                }
              />

              <Route
                path="pesaje"
                element={
                  <RequireRoles allowed={["ADMIN", "STOCK"]}>
                    <StockPesaje />
                  </RequireRoles>
                }
              />

              <Route
                path="pesajes"
                element={
                  <RequireRoles allowed={["ADMIN", "STOCK", "COMPRAS", "VENTAS"]}>
                    <StockPesajesLista />
                  </RequireRoles>
                }
              />
            </Route>

            <Route
              path="reportes"
              element={
                <RequireRoles allowed={["ADMIN"]}>
                  <Reportes />
                </RequireRoles>
              }
            />

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
