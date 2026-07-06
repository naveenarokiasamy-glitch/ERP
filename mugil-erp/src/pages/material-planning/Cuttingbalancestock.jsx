import { useMemo, useState } from "react";
import { useMaterialStore } from "../../data/materialStore";
import "./Cuttingbalancestock.css";
import { useNavigate } from "react-router-dom"; // If using React Router
import Header from "../../components/Header";

const badgeClass = (status) => {
  switch (status) {
    case "Available":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "Issued to Production":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "Consumed":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
};

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-slate-800 mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function CuttingBalanceStock() {
  const { cuttingBalanceStock } = useMaterialStore();
  const navigate = useNavigate(); // For React Router navigation

  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const warehouses = useMemo(
    () => [
      "All",
      ...Array.from(new Set(cuttingBalanceStock.map((r) => r.warehouse))),
    ],
    [cuttingBalanceStock],
  );
  const statuses = ["All", "Available", "Issued to Production", "Consumed"];

  const filtered = cuttingBalanceStock.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.jobNumber.toLowerCase().includes(q) ||
      r.parentPlate.toLowerCase().includes(q) ||
      r.material.toLowerCase().includes(q) ||
      r.grade.toLowerCase().includes(q);
    const matchesWarehouse =
      warehouseFilter === "All" || r.warehouse === warehouseFilter;
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  const stats = useMemo(() => {
    const totalPlates = cuttingBalanceStock.length;
    const totalWeight = cuttingBalanceStock.reduce(
      (sum, r) => sum + (r.remainingWeight || 0),
      0,
    );
    const available = cuttingBalanceStock.filter(
      (r) => r.status === "Available",
    ).length;
    const issued = cuttingBalanceStock.filter(
      (r) => r.status === "Issued to Production",
    ).length;
    return { totalPlates, totalWeight, available, issued };
  }, [cuttingBalanceStock]);

  const handleBack = () => {
    // Navigate back - adjust the path according to your routing structure
    navigate("/inventory"); // or navigate(-1) for browser back
  };

  return (
    <>
      <Header />
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Cutting Balance Stock
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Leftover parent-plate remnants available after cutting.
          </p>
        </div>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Balance Plates" value={stats.totalPlates} />
        <StatCard
          label="Total Weight"
          value={`${stats.totalWeight.toFixed(1)} kg`}
        />
        <StatCard label="Available" value={stats.available} />
        <StatCard label="Issued to Production" value={stats.issued} />
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Search
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Job number, plate, material, grade..."
            className="w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Warehouse
          </label>
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {warehouses.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-left">
              <th className="px-4 py-3 font-medium">Job Number</th>
              <th className="px-4 py-3 font-medium">Parent Plate</th>
              <th className="px-4 py-3 font-medium">Material</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Remaining Length</th>
              <th className="px-4 py-3 font-medium">Remaining Width</th>
              <th className="px-4 py-3 font-medium">Remaining Weight</th>
              <th className="px-4 py-3 font-medium">Warehouse</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No cutting balance records match your filters.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {r.jobNumber}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.parentPlate}</td>
                <td className="px-4 py-3 text-slate-600">{r.material}</td>
                <td className="px-4 py-3 text-slate-600">{r.grade}</td>
                <td className="px-4 py-3 text-slate-600">
                  {r.remainingLength}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.remainingWidth}</td>
                <td className="px-4 py-3 text-slate-600">
                  {r.remainingWeight} kg
                </td>
                <td className="px-4 py-3 text-slate-600">{r.warehouse}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass(r.status)}`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
