import FilterBar from "../components/forms/FilterBars";
import DataTable from "../components/tables/DataTable";
import PrimaryButton from "../components/buttons/PrimaryButton";

export default function Ventas() {
  const headers = ["N° Venta", "Tipo", "Fecha", "Total", "Detalle", "Observaciones", "Acciones"];
  const data = [
    [1, "Mixta", "08/10/2025", "$0.00", "Ver Detalle", "-", ""],
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl mb-5 font-semibold text-[#154734]">Lista de Ventas</h2>
        <PrimaryButton text="Añadir nueva venta" />
      </div>

      <FilterBar />

    
        <DataTable headers={headers} data={data} />
      
    </div>
  );
}
