// MaterialMovementHistory.jsx
// -----------------------------------------------------------------------------
// Read-only traceability page for the Material module.
// Shows every movement ever logged to `movementHistory`, with search/filter
// controls, summary stat cards, and a per-PO lifecycle timeline (opened by
// clicking a PO Number in the table). No writes happen from this page.
// -----------------------------------------------------------------------------

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  useMaterialStore,
  buildPOTimeline,
  getMovementStats,
} from "../../data/materialStore";
import "./Materialmovementhistory.css";
import Header from "../../components/Header";
const card = {
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "16px 18px",
  background: "#fff",
  flex: "1 1 200px",
  minWidth: 180,
};  

const label = {
  fontSize: 12,
  color: "#64748b",
  marginBottom: 6,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.3,
};
const value = { fontSize: 26, fontWeight: 700, color: "#0f172a" };

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  fontSize: 13,
  minWidth: 140,
};

const th = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.3,
  color: "#475569",
  borderBottom: "2px solid #e2e8f0",
  whiteSpace: "nowrap",
};

const td = {
  padding: "10px 12px",
  fontSize: 13,
  borderBottom: "1px solid #f1f5f9",
  color: "#1e293b",
  whiteSpace: "nowrap",
};

const poLinkStyle = {
  color: "#2563eb",
  fontWeight: 600,
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: 0,
  fontSize: 13,
  textDecoration: "underline",
};

function matchesText(haystack, needle) {
  if (!needle) return true;
  return String(haystack ?? "")
    .toLowerCase()
    .includes(needle.toLowerCase());
}

function inDateRange(dateStr, from, to) {
  if (!from && !to) return true;
  if (!dateStr || dateStr === "—") return false;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

export default function MaterialMovementHistory() {
  const store = useMaterialStore();
  const stats = getMovementStats(store);

  const [filters, setFilters] = useState({
    search: "",
    poNumber: "",
    jobNumber: "",
    material: "",
    plateNumber: "",
    heatNumber: "",
    movementType: "",
    dateFrom: "",
    dateTo: "",
  });

  const [timelinePO, setTimelinePO] = useState(null);

  const setFilter = (key) => (e) =>
    setFilters((f) => ({ ...f, [key]: e.target.value }));

  const resetFilters = () =>
    setFilters({
      search: "",
      poNumber: "",
      jobNumber: "",
      material: "",
      plateNumber: "",
      heatNumber: "",
      movementType: "",
      dateFrom: "",
      dateTo: "",
    });

  // Plate Number -> Heat Number lookup, since movementHistory rows only carry
  // plateNumber. Built from materialStock (authoritative) and purchaseOrders
  // (fallback for plates never issued into stock).
  const heatByPlate = useMemo(() => {
    const map = {};
    store.materialStock.forEach((r) => {
      if (r.plateNumber) map[r.plateNumber] = r.heatNumber;
    });
    store.purchaseOrders.forEach((po) => {
      if (po.plateNumber && !map[po.plateNumber])
        map[po.plateNumber] = po.heatNumber;
    });
    return map;
  }, [store.materialStock, store.purchaseOrders]);

  const movementTypes = useMemo(() => {
    const set = new Set(store.movementHistory.map((m) => m.movementType));
    return Array.from(set).sort();
  }, [store.movementHistory]);

  const materials = useMemo(() => {
    const set = new Set(
      store.movementHistory.map((m) => m.material).filter(Boolean),
    );
    return Array.from(set).sort();
  }, [store.movementHistory]);

  const filteredMovements = useMemo(() => {
    return store.movementHistory.filter((m) => {
      const heat = m.plateNumber ? heatByPlate[m.plateNumber] : null;

      if (!matchesText(m.poNumber, filters.poNumber)) return false;
      if (!matchesText(m.jobNumber, filters.jobNumber)) return false;
      if (!matchesText(m.plateNumber, filters.plateNumber)) return false;
      if (filters.material && m.material !== filters.material) return false;
      if (filters.movementType && m.movementType !== filters.movementType)
        return false;
      if (!matchesText(heat, filters.heatNumber)) return false;
      if (!inDateRange(m.date, filters.dateFrom, filters.dateTo)) return false;

      if (filters.search) {
        const blob = [
          m.poNumber,
          m.jobNumber,
          m.plateNumber,
          m.pieceCode,
          m.material,
          m.movementType,
          m.from,
          m.to,
          m.user,
          m.remarks,
          heat,
        ].join(" ");
        if (!matchesText(blob, filters.search)) return false;
      }

      return true;
    });
  }, [store.movementHistory, filters, heatByPlate]);

  const openTimeline = (poNumber) => {
    if (!poNumber) return;
    setTimelinePO(poNumber);
  };

  const timelineEvents = useMemo(
    () => (timelinePO ? buildPOTimeline(store, timelinePO) : []),
    [store, timelinePO],
  );

  return (
<>
  <Header />

  <div className="material-history-page">
    <div className="material-history-container">

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
  <Link to="/inventory" className="breadcrumb-link">
    Inventory
  </Link>

  <span className="breadcrumb-separator">/</span>

  <Link to="/inventory/material" className="breadcrumb-link">
    Material
  </Link>

  <span className="breadcrumb-separator">/</span>

  <span className="breadcrumb-current">
    Material Movement History
  </span>
</div>
<Link to="/inventory/material" className="erp-back-button">
  <ArrowLeft size={16} />
  Back
</Link>
          <p className="page-subtitle">
            Complete, read-only traceability of every material movement across the module.
          </p>
        </div>

        <div className="page-header-right">
          
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">

        <div className="kpi-card movements-card">
          <div className="kpi-label">
            Total Movements
          </div>

          <div className="kpi-value">
            {stats.totalMovements}
          </div>
        </div>

        <div className="kpi-card po-card">
          <div className="kpi-label">
            Purchase Orders
          </div>

          <div className="kpi-value">
            {stats.totalPurchaseOrders}
          </div>
        </div>

        <div className="kpi-card open-card">
          <div className="kpi-label">
            Open Jobs
          </div>

          <div className="kpi-value">
            {stats.openJobs}
          </div>
        </div>

        <div className="kpi-card completed-card">
          <div className="kpi-label">
            Completed Jobs
          </div>

          <div className="kpi-value">
            {stats.completedJobs}
          </div>
        </div>

      </div>
      {/* ================= Filters ================= */}

      <div className="filter-card">

        <div className="filter-card-header">
          <h3>Filters</h3>

          <div className="filter-count">
            {filteredMovements.length} of {store.movementHistory.length} movements
          </div>
        </div>

        <div className="filter-grid">

          <input
            className="filter-input filter-search"
            placeholder="Search movements..."
            value={filters.search}
            onChange={setFilter("search")}
          />

          <input
            className="filter-input"
            placeholder="PO Number"
            value={filters.poNumber}
            onChange={setFilter("poNumber")}
          />

          <input
            className="filter-input"
            placeholder="Job Number"
            value={filters.jobNumber}
            onChange={setFilter("jobNumber")}
          />

          <select
            className="filter-select"
            value={filters.material}
            onChange={setFilter("material")}
          >
            <option value="">All Materials</option>

            {materials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            className="filter-input"
            placeholder="Plate Number"
            value={filters.plateNumber}
            onChange={setFilter("plateNumber")}
          />

          <input
            className="filter-input"
            placeholder="Heat Number"
            value={filters.heatNumber}
            onChange={setFilter("heatNumber")}
          />

          <select
            className="filter-select"
            value={filters.movementType}
            onChange={setFilter("movementType")}
          >
            <option value="">All Movement Types</option>

            {movementTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <label className="date-filter">
            <span>From</span>

            <input
              type="date"
              className="filter-date"
              value={filters.dateFrom}
              onChange={setFilter("dateFrom")}
            />
          </label>

          <label className="date-filter">
            <span>To</span>

            <input
              type="date"
              className="filter-date"
              value={filters.dateTo}
              onChange={setFilter("dateTo")}
            />
          </label>

        </div>

        <div className="filter-footer">

          <button
            onClick={resetFilters}
            className="clear-filter-btn"
          >
            Clear Filters
          </button>

        </div>

      </div>

      {/* ================= End Filters ================= */}
       {/* ================= Table ================= */}

      <div className="table-card">

        <div className="table-header">

          <div>
            <h3 className="table-title">
              Material Movement Records
            </h3>

            <p className="table-subtitle">
              Complete chronological movement history across the material lifecycle.
            </p>
          </div>

          <div className="table-record-count">
            {filteredMovements.length} Records
          </div>

        </div>

        <div className="table-wrapper">

          <table className="movement-table">

            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>PO Number</th>
                <th>Job Number</th>
                <th>Plate Number</th>
                <th>Piece Code</th>
                <th>Material</th>
                <th>Movement Type</th>
                <th>From</th>
                <th>To</th>
                <th>Quantity</th>
                <th>User</th>
              </tr>
            </thead>

            <tbody>

              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={12}>
                    <div className="empty-state">
                      No movements match the selected filters.
                    </div>
                  </td>
                </tr>
              )}

              {filteredMovements.map((m) => (
                <tr key={m.id}>

                  <td>{m.date}</td>

                  <td>{m.time || "—"}</td>

                  <td>
                    {m.poNumber ? (
                      <button
                        className="po-link-button"
                        onClick={() => openTimeline(m.poNumber)}
                      >
                        {m.poNumber}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>{m.jobNumber || "—"}</td>

                  <td>{m.plateNumber || "—"}</td>

                  <td>{m.pieceCode || "—"}</td>

                  <td>
                    <span className="material-chip">
                      {m.material || "—"}
                    </span>
                  </td>

                  <td>
                    <span className="movement-badge">
                      {m.movementType}
                    </span>
                  </td>

                  <td>{m.from || "—"}</td>

                  <td>{m.to || "—"}</td>

                  <td className="quantity-cell">
                    {m.quantity}
                  </td>

                  <td>{m.user || "—"}</td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* ================= End Table ================= */}
      {/* ================= Timeline Modal ================= */}

      {timelinePO && (
        <div
          className="timeline-overlay"
          onClick={() => setTimelinePO(null)}
        >
          <div
            className="timeline-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="timeline-header">

              <div>
                <h3 className="timeline-title">
                  PO Lifecycle — {timelinePO}
                </h3>

                <p className="timeline-subtitle">
                  Complete chronological trail generated dynamically from movement history.
                </p>
              </div>

              <button
                className="timeline-close-button"
                onClick={() => setTimelinePO(null)}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {timelineEvents.length === 0 && (
              <div className="timeline-empty">
                No movement records found for this PO.
              </div>
            )}

            {timelineEvents.length > 0 && (
              <div className="timeline-container">

                <div className="timeline-line"></div>

                {timelineEvents.map((ev, idx) => (
                  <div
                    key={ev.id ?? idx}
                    className="timeline-event"
                  >
                    <div className="timeline-event-dot"></div>

                    <div className="timeline-event-content">

                      <div className="timeline-event-header">

                        <div className="timeline-event-title">
                          {ev.stageLabel || ev.movementType}
                        </div>

                        <div className="timeline-event-time">
                          {ev.date}
                          {ev.time ? ` • ${ev.time}` : ""}
                        </div>

                      </div>

                      <div className="timeline-event-details">
                        {ev.from && ev.to
                          ? `${ev.from} → ${ev.to}`
                          : ""}
                        {ev.quantity !== undefined
                          ? ` • Qty: ${ev.quantity}`
                          : ""}
                      </div>

                      <div className="timeline-event-user">
                        User: {ev.user || "—"}
                        {ev.status ? ` • Status: ${ev.status}` : ""}
                      </div>

                      {ev.remarks && (
                        <div className="timeline-event-remarks">
                          "{ev.remarks}"
                        </div>
                      )}

                    </div>
                  </div>
                ))}

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  </div>
</>
  );
}