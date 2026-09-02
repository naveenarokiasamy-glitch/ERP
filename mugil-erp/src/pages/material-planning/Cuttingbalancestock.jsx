import { useMemo, useState } from "react";
import { useMaterialStore } from "../../data/materialStore";
import "./Cuttingbalancestock.css";
import { Link, useNavigate } from "react-router-dom"; // If using React Router
import Header from "../../components/Header";
import { ArrowLeft } from "lucide-react";

const badgeClass = (status) => {
  switch (status) {
    case "Available":
      return "cbs-status-available";

    case "Issued to Production":
      return "cbs-status-issued";

    case "Consumed":
      return "cbs-status-consumed";

    default:
      return "cbs-status-default";
  }
};



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



  return (
<>
  <Header />

  <div className="cutting-balance-page">
    <div className="cutting-balance-container">

      {/* Page Header */}

<div className="cbs-page-header">

  <div className="cbs-page-header-left">

    <div className="cbs-breadcrumb">

      <span
        className="cbs-breadcrumb-link"
        onClick={() => navigate("/inventory")}
      >
        Inventory
      </span>

      <span className="cbs-breadcrumb-separator">/</span>

      <span className="cbs-breadcrumb-current">
        Cutting Balance Stock
      </span>

    </div>

    <Link to="/inventory/material" className="erp-back-button">
  <ArrowLeft size={16} />
  Back
</Link>

    <h1 className="cbs-page-title">
      Cutting Balance Stock
    </h1>

    <p className="cbs-page-subtitle">
      Monitor leftover parent plate remnants available after cutting operations.
    </p>

  </div>



</div>

      {/* KPI Cards */}
      {/* KPI Cards */}

      <div className="cbs-kpi-grid">

        <div className="cbs-kpi-card cbs-total-card">
          <div className="cbs-kpi-label">
            Total Balance Plates
          </div>

          <div className="cbs-kpi-value">
            {stats.totalPlates}
          </div>
        </div>

        <div className="cbs-kpi-card cbs-weight-card">
          <div className="cbs-kpi-label">
            Total Weight
          </div>

          <div className="cbs-kpi-value">
            {stats.totalWeight.toFixed(1)} kg
          </div>
        </div>

        <div className="cbs-kpi-card cbs-available-card">
          <div className="cbs-kpi-label">
            Available
          </div>

          <div className="cbs-kpi-value">
            {stats.available}
          </div>
        </div>

        <div className="cbs-kpi-card cbs-issued-card">
          <div className="cbs-kpi-label">
            Issued to Production
          </div>

          <div className="cbs-kpi-value">
            {stats.issued}
          </div>
        </div>

      </div>

            {/* ================= Filters ================= */}

      <div className="cbs-filter-card">

        <div className="cbs-filter-card-header">

          <h3>
            Filters
          </h3>

          <div className="cbs-filter-count">
            {filtered.length} of {cuttingBalanceStock.length} Plates
          </div>

        </div>

        <div className="cbs-filter-grid">

          <div className="cbs-filter-group">

            <label>
              Search
            </label>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Job number, plate, material, grade..."
              className="cbs-filter-input cbs-filter-search"
            />

          </div>

          <div className="cbs-filter-group">

            <label>
              Warehouse
            </label>

            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="cbs-filter-select"
            >
              {warehouses.map((w) => (
                <option key={w}>
                  {w}
                </option>
              ))}
            </select>

          </div>

          <div className="cbs-filter-group">

            <label>
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cbs-filter-select"
            >
              {statuses.map((s) => (
                <option key={s}>
                  {s}
                </option>
              ))}
            </select>

          </div>

        </div>

      </div>

      {/* ================= End Filters ================= */}

      {/* ================= Table ================= */}

      <div className="cbs-table-card">

        <div className="cbs-table-header">

          <div>

            <h3 className="cbs-table-title">
              Cutting Balance Stock
            </h3>

            <p className="cbs-table-subtitle">
              Remaining parent plate stock available after cutting operations.
            </p>

          </div>

          <div className="cbs-table-record-count">
            {filtered.length} Records
          </div>

        </div>

        <div className="cbs-table-wrapper">

          <table className="cbs-balance-table">

            <thead>

              <tr>
                <th>Job Number</th>
                <th>Parent Plate</th>
                <th>Material</th>
                <th>Grade</th>
                <th>Remaining Length</th>
                <th>Remaining Width</th>
                <th>Remaining Weight</th>
                <th>Warehouse</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="cbs-empty-state"
                  >
                    No cutting balance records match your filters.
                  </td>
                </tr>
              )}

              {filtered.map((r) => (

                <tr key={r.id}>

                  <td className="cbs-job-number">
                    {r.jobNumber}
                  </td>

                  <td>
                    {r.parentPlate}
                  </td>

                  <td>
                    <span className="cbs-material-chip">
                      {r.material}
                    </span>
                  </td>

                  <td>
                    {r.grade}
                  </td>

                  <td>
                    {r.remainingLength}
                  </td>

                  <td>
                    {r.remainingWidth}
                  </td>

                  <td className="cbs-weight-cell">
                    {r.remainingWeight} kg
                  </td>

                  <td>
                    {r.warehouse}
                  </td>

                  <td>

                    <span
                      className={`cbs-status-badge ${badgeClass(r.status)}`}
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

      {/* ================= End Table ================= */}

    </div>

  </div>

</>
  );
}