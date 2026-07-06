// MaterialMovementHistory.jsx
// -----------------------------------------------------------------------------
// Read-only traceability page for the Material module.
// Shows every movement ever logged to `movementHistory`, with search/filter
// controls, summary stat cards, and a per-PO lifecycle timeline (opened by
// clicking a PO Number in the table). No writes happen from this page.
// -----------------------------------------------------------------------------

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useMaterialStore,
  buildPOTimeline,
  getMovementStats,
} from "../../data/materialStore";
import "./MaterialMovementHistory.css";
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
const navigate = useNavigate();
const handleBack = () => navigate("/inventory/material");
  return (
    <>
          <Header />
    <div
      style={{
        padding: 20,
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#0f172a",
      }}
    >
      <h2 style={{ margin: "0 0 4px" }}>Material Movement History</h2>
      <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 13 }}>
        Complete, read-only traceability of every material movement across the
        module.
      </p>
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

      {/* ---- Stats ---- */}
      <div
        style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}
      >
        <div style={card}>
          <div style={label}>Total Movements</div>
          <div style={value}>{stats.totalMovements}</div>
        </div>
        <div style={card}>
          <div style={label}>Purchase Orders</div>
          <div style={value}>{stats.totalPurchaseOrders}</div>
        </div>
        <div style={card}>
          <div style={label}>Open Jobs</div>
          <div style={value}>{stats.openJobs}</div>
        </div>
        <div style={card}>
          <div style={label}>Completed Jobs</div>
          <div style={value}>{stats.completedJobs}</div>
        </div>
      </div>

      {/* ---- Filters ---- */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 16,
          background: "#f8fafc",
          padding: 14,
          borderRadius: 10,
          border: "1px solid #e2e8f0",
        }}
      >
        <input
          style={{ ...inputStyle, minWidth: 220 }}
          placeholder="Search movements..."
          value={filters.search}
          onChange={setFilter("search")}
        />
        <input
          style={inputStyle}
          placeholder="PO Number"
          value={filters.poNumber}
          onChange={setFilter("poNumber")}
        />
        <input
          style={inputStyle}
          placeholder="Job Number"
          value={filters.jobNumber}
          onChange={setFilter("jobNumber")}
        />
        <select
          style={inputStyle}
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
          style={inputStyle}
          placeholder="Plate Number"
          value={filters.plateNumber}
          onChange={setFilter("plateNumber")}
        />
        <input
          style={inputStyle}
          placeholder="Heat Number"
          value={filters.heatNumber}
          onChange={setFilter("heatNumber")}
        />
        <select
          style={inputStyle}
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
        <label style={{ fontSize: 12, color: "#64748b" }}>
          From{" "}
          <input
            type="date"
            style={inputStyle}
            value={filters.dateFrom}
            onChange={setFilter("dateFrom")}
          />
        </label>
        <label style={{ fontSize: 12, color: "#64748b" }}>
          To{" "}
          <input
            type="date"
            style={inputStyle}
            value={filters.dateTo}
            onChange={setFilter("dateTo")}
          />
        </label>
        <button
          onClick={resetFilters}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            background: "#fff",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Clear Filters
        </button>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>
          {filteredMovements.length} of {store.movementHistory.length} movements
        </span>
      </div>

      {/* ---- Table ---- */}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
          }}
        >
          <thead>
            <tr>
              <th style={th}>Date</th>
              <th style={th}>Time</th>
              <th style={th}>PO Number</th>
              <th style={th}>Job Number</th>
              <th style={th}>Plate Number</th>
              <th style={th}>Piece Code</th>
              <th style={th}>Material</th>
              <th style={th}>Movement Type</th>
              <th style={th}>From</th>
              <th style={th}>To</th>
              <th style={th}>Quantity</th>
              <th style={th}>User</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 && (
              <tr>
                <td style={td} colSpan={12}>
                  <div
                    style={{
                      padding: "24px 0",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No movements match the selected filters.
                  </div>
                </td>
              </tr>
            )}
            {filteredMovements.map((m) => (
              <tr key={m.id}>
                <td style={td}>{m.date}</td>
                <td style={td}>{m.time || "—"}</td>
                <td style={td}>
                  {m.poNumber ? (
                    <button
                      style={poLinkStyle}
                      onClick={() => openTimeline(m.poNumber)}
                    >
                      {m.poNumber}
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={td}>{m.jobNumber || "—"}</td>
                <td style={td}>{m.plateNumber || "—"}</td>
                <td style={td}>{m.pieceCode || "—"}</td>
                <td style={td}>{m.material || "—"}</td>
                <td style={td}>{m.movementType}</td>
                <td style={td}>{m.from || "—"}</td>
                <td style={td}>{m.to || "—"}</td>
                <td style={td}>{m.quantity}</td>
                <td style={td}>{m.user || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Timeline Modal ---- */}
      {timelinePO && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setTimelinePO(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "min(680px, 92vw)",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 4,
              }}
            >
              <h3 style={{ margin: 0 }}>PO Lifecycle — {timelinePO}</h3>
              <button
                onClick={() => setTimelinePO(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#64748b",
                  lineHeight: 1,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p style={{ margin: "0 0 18px", fontSize: 12, color: "#64748b" }}>
              Complete chronological trail generated dynamically from movement
              history.
            </p>

            {timelineEvents.length === 0 && (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>
                No movement records found for this PO.
              </div>
            )}

            <div style={{ position: "relative", paddingLeft: 22 }}>
              <div
                style={{
                  position: "absolute",
                  left: 6,
                  top: 4,
                  bottom: 4,
                  width: 2,
                  background: "#e2e8f0",
                }}
              />
              {timelineEvents.map((ev, idx) => (
                <div
                  key={ev.id ?? idx}
                  style={{ position: "relative", paddingBottom: 20 }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: -22,
                      top: 3,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "#2563eb",
                      border: "3px solid #dbeafe",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <strong style={{ fontSize: 14 }}>
                      {ev.stageLabel || ev.movementType}
                    </strong>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      {ev.date} {ev.time ? `• ${ev.time}` : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", marginTop: 2 }}>
                    {ev.from && ev.to ? `${ev.from} → ${ev.to}` : null}
                    {ev.quantity !== undefined
                      ? `  •  Qty: ${ev.quantity}`
                      : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    User: {ev.user || "—"}
                    {ev.status ? `  •  Status: ${ev.status}` : ""}
                  </div>
                  {ev.remarks ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#475569",
                        marginTop: 2,
                        fontStyle: "italic",
                      }}
                    >
                      “{ev.remarks}”
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
