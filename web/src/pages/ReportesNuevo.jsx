import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../components/pages/PageContainer";
import NuevoReporte from "../components/modals/NuevoReporte";

export default function ReportesNuevo() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(true); // abre al montar
  }, []);

  const handleClose = () => {
    setOpen(false);
    navigate("/reportes"); // vuelve a la lista
  };

  const handleCreate = () => {
    // TODO: guardar/dispachar si hace falta.
    // Por ahora solo volvemos como acordamos.
    handleClose();
  };

  return (
    <PageContainer title="Reportes">
      <NuevoReporte isOpen={open} onClose={handleClose} onCreate={handleCreate} />
    </PageContainer>
  );
}
