import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMaterialStore } from "../../data/materialStore";
import "./Materialstock.css";  
import "../../styles/BackButton.css";
import Header from "../../components/Header";
export default function MaterialStock() {
  const { materialStock } = useMaterialStore();
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const warehouses = [...new Set(materialStock.map((r) => r.warehouse))];
  const statuses = [...new Set(materialStock.map((r) => r.status))];

 const rows = availableStock.filter((r) => {
    const searchValue = search.trim().toLowerCase();
 
    const matchesWarehouse =
      !warehouseFilter || r.warehouse === warehouseFilter;
 
    const matchesMaterial = !materialFilter || r.material === materialFilter;
 
    if (!searchValue) {
      return matchesWarehouse && matchesMaterial;
    }
 
    // If searching a number, prioritize thickness
    const isNumericSearch = /^\d+(\.\d+)?$/.test(searchValue);
 
    if (isNumericSearch) {
      const thicknessMatches = String(r.thickness ?? "")
        .toLowerCase()
        .includes(searchValue);
 
      return thicknessMatches && matchesWarehouse && matchesMaterial;
    }
 
    // Otherwise search text fields
    const matchesText = [
      r.material,
      r.grade,
      r.heatNumber,
      r.plateNumber,
      r.poNumber,
      r.batchNumber,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchValue);
 
    return matchesText && matchesWarehouse && matchesMaterial;
  });

  // Navigation function


  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      "In Stock": "ms-status-success",
      "Partially Issued": "ms-status-warning",
      "Fully Issued": "ms-status-danger",
      Available: "ms-status-success",
      "Issued to Production": "ms-status-info",
      Received: "ms-status-neutral",
    };
    return statusMap[status] || "ms-status-neutral";
  };

  return (
    <>
          <Header />
    <div className="ms-page">



    <div className="ms-breadcrumb">
  <Link to="/inventory" className="ms-breadcrumb-item">
    Inventory
  </Link>

  <span className="ms-breadcrumb-sep">/</span>

  <Link to="/inventory/material" className="ms-breadcrumb-item">
    Material
  </Link>

  <span className="ms-breadcrumb-sep">/</span>

  <span className="ms-breadcrumb-item">Material Stock</span>
</div>
<Link to="/inventory/material" className="erp-back-button">
  <ArrowLeft size={16} />
  Back
</Link>
      {/* Header */}
      <div className="ms-header">
        <h1 className="ms-title">Material Stock</h1>
        <p className="ms-subtitle">
          Live on-hand quantities from completed GRN receipts. Materials shown
          with "Partially Issued" or "Fully Issued" status have been issued to
          cutting.
        </p>
      </div>

      {/* Toolbar */}
      <div className="ms-toolbar">
        <div className="ms-search">
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
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by material, grade, heat no., plate no., or batch no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ms-filters">
          <select
            className="ms-filter-select"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          <select
            className="ms-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="ms-stat-row">
        <div className="ms-stat-card">
          <div className="ms-stat-value">{materialStock.length}</div>
          <div className="ms-stat-label">Stock Lots</div>
        </div>
        <div className="ms-stat-card">
          <div className="ms-stat-value">{totalAvailable}</div>
          <div className="ms-stat-label">Available Qty</div>
        </div>
        <div className="ms-stat-card">
          <div className="ms-stat-value">{totalIssuedToCutting}</div>
          <div className="ms-stat-label">Issued to Cutting</div>
        </div>
        <div className="ms-stat-card">
          <div className="ms-stat-value">{totalReserved}</div>
          <div className="ms-stat-label">Reserved Qty</div>
        </div>
        <div className="ms-stat-card">
          <div className="ms-stat-value">{totalWeight.toFixed(1)}</div>
          <div className="ms-stat-label">Total Weight (kg)</div>
        </div>
      </div>

      {/* Table */}
      <div className="ms-table-wrap">
        <div className="ms-table-scroll">
          <table className="ms-table">
            <thead>
              <tr>
                <th className="ms-col-po">PO Number</th>
                <th className="ms-col-material">Material</th>
                <th className="ms-col-grade">Grade</th>
                <th className="ms-col-spec">Specification</th>
                <th className="ms-col-thk">Thk (mm)</th>
                <th className="ms-col-width">Width (mm)</th>
                <th className="ms-col-length">Length (mm)</th>
                <th className="ms-col-heat">Heat No.</th>
                <th className="ms-col-plate">Plate No.</th>
                <th className="ms-col-batch">Batch No.</th>
                <th className="ms-col-qty">Available Qty</th>
                <th className="ms-col-qty">Issued to Cutting</th>
                <th className="ms-col-warehouse">Warehouse</th>
                <th className="ms-col-rack">Rack Location</th>
                <th className="ms-col-weight">Weight (kg)</th>
                <th className="ms-col-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="ms-col-po">
                    <strong>{r.poNumber}</strong>
                  </td>
                  <td className="ms-col-material">{r.material}</td>
                  <td className="ms-col-grade">{r.grade}</td>
                  <td className="ms-col-spec">{r.specification || "-"}</td>
                  <td className="ms-col-thk">{r.thickness}</td>
                  <td className="ms-col-width">{r.width}</td>
                  <td className="ms-col-length">{r.length}</td>
                  <td className="ms-col-heat">
                    <span className="ms-text-mono">{r.heatNumber}</span>
                  </td>
                  <td className="ms-col-plate">
                    <span className="ms-text-mono">{r.plateNumber}</span>
                  </td>
                  <td className="ms-col-batch">{r.batchNumber || "-"}</td>
                  <td className="ms-col-qty">
                    <strong className="ms-available-qty">
                      {r.availableQty}
                    </strong>
                  </td>
                  <td className="ms-col-qty">{r.issuedToCutting || 0}</td>
                  <td className="ms-col-warehouse">{r.warehouse}</td>
                  <td className="ms-col-rack">{r.rackLocation || "-"}</td>
                  <td className="ms-col-weight">
                    {r.weight ? (r.weight * r.availableQty).toFixed(1) : "-"}
                  </td>
                  <td className="ms-col-status">
                    <span
                      className={`ms-status-badge ${getStatusBadgeClass(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={16} className="ms-table-empty">
                    No stock matches your search. Ensure materials have been
                    received via GRN.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      
    </div>
    </>
  );
}
