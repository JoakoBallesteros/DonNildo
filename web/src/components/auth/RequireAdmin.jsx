import RequireRoles from "./RequireRoles.jsx";

export default function RequireAdmin({ children }) {
  return <RequireRoles allowed={["ADMIN"]}>{children}</RequireRoles>;
}