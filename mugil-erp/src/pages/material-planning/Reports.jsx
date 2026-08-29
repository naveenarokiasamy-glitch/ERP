// Reports.jsx
// -----------------------------------------------------------------------------
// Reporting dashboard for the Material module. Reads exclusively from
// useMaterialStore() — no backend calls, no dummy data. Every report view is
// a filtered, exportable view over an existing store collection.
// -----------------------------------------------------------------------------

import { useMemo, useState } from "react";
import { useMaterialStore, getReportTotals } from "../../data/materialStore";
import "./Reports.css";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

const REPORT_VIEWS = [
  {
    key: "grn",
    label: "GRN",
    collection: "materialStock",
    dateField: "expectedDeliveryDate",
  },
  {
    key: "materialStock",
    label: "Material Stock",
    collection: "materialStock",
    dateField: null,
  },
  {
    key: "cutting",
    label: "Cutting",
    collection: "cuttingJobs",
    dateField: "issueDate",
  },
  {
    key: "finishedPieces",
    label: "Finished Pieces",
    collection: "finishedPieces",
    dateField: null,
  },
  {
    key: "cuttingBalance",
    label: "Cutting Balance",
    collection: "cuttingBalanceStock",
    dateField: null,
  },
  {
    key: "scrap",
    label: "Scrap",
    collection: "scrapMaterials",
    dateField: "date",
  },
  {
    key: "rejection",
    label: "Rejection",
    collection: "rejectionMaterials",
    dateField: "date",
  },
  {
    key: "rework",
    label: "Rework",
    collection: "reworkMaterials",
    dateField: "date",
  },
  {
    key: "productionIssue",
    label: "Production Issue",
    collection: "productionIssues",
    dateField: "issueDate",
  },
  {
    key: "movementHistory",
    label: "Material Movement History",
    collection: "movementHistory",
    dateField: "date",
  },
];

const card = {
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "14px 16px",
  background: "#fff",
  flex: "1 1 190px",
  minWidth: 170,
};
const label = {
  fontSize: 11,
  color: "#64748b",
  marginBottom: 6,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.3,
};
const value = { fontSize: 22, fontWeight: 700, color: "#0f172a" };

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  fontSize: 13,
  minWidth: 140,
};

const tabBtn = (active) => ({
  padding: "8px 14px",
  borderRadius: 8,
  border: active ? "1px solid #2563eb" : "1px solid #cbd5e1",
  background: active ? "#2563eb" : "#fff",
  color: active ? "#fff" : "#334155",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
});


const exportBtn = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  color: "#334155",
};

function matchesText(haystack, needle) {
  if (!needle) return true;
  return String(haystack ?? "")
    .toLowerCase()
    .includes(needle.toLowerCase());
}

function inDateRange(dateStr, from, to) {
  if (!from && !to) return true;
  if (!dateStr) return false;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

function formatCell(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCSV(columns, rows) {
  const escape = (v) => {
    const s = formatCell(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.join(",");
  const lines = rows.map((r) => columns.map((c) => escape(r[c])).join(","));
  return [header, ...lines].join("\n");
}

function toHTMLTable(columns, rows, title) {
  const head = columns
    .map(
      (c) =>
        `<th style="border:1px solid #ccc;padding:6px;background:#f1f5f9;text-align:left;">${c}</th>`,
    )
    .join("");
  const body = rows
    .map(
      (r) =>
        `<tr>${columns.map((c) => `<td style="border:1px solid #ccc;padding:6px;">${formatCell(r[c])}</td>`).join("")}</tr>`,
    )
    .join("");
  return `
    <html>
      <head><meta charset="utf-8"><title>${title}</title></head>
      <body>
        <h2 style="font-family:sans-serif;">${title}</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:12px;width:100%;">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </body>
    </html>`;
}

function exportExcel(columns, rows, title) {
  downloadBlob(
    toHTMLTable(columns, rows, title),
    `${title.replace(/\s+/g, "_")}.xls`,
    "application/vnd.ms-excel",
  );
}

function exportCSV(columns, rows, title) {
  downloadBlob(
    toCSV(columns, rows),
    `${title.replace(/\s+/g, "_")}.csv`,
    "text/csv",
  );
}

function exportPDFOrPrint(columns, rows, title) {
  const html = toHTMLTable(columns, rows, title);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

export default function Reports() {
  const store = useMaterialStore();
  const totals = getReportTotals(store);

  const [activeView, setActiveView] = useState(REPORT_VIEWS[0].key);
  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
    material: "",
    poNumber: "",
    status: "",
  });

  const setFilter = (key) => (e) =>
    setFilters((f) => ({ ...f, [key]: e.target.value }));
  const resetFilters = () =>
    setFilters({
      search: "",
      dateFrom: "",
      dateTo: "",
      material: "",
      poNumber: "",
      status: "",
    });

  const view = REPORT_VIEWS.find((v) => v.key === activeView);
  const rawRows = store[view.collection] || [];

  const materialOptions = useMemo(() => {
    const set = new Set(rawRows.map((r) => r.material).filter(Boolean));
    return Array.from(set).sort();
  }, [rawRows]);

  const statusOptions = useMemo(() => {
    const set = new Set(rawRows.map((r) => r.status).filter(Boolean));
    return Array.from(set).sort();
  }, [rawRows]);

  const filteredRows = useMemo(() => {
    return rawRows.filter((r) => {
      if (filters.material && r.material !== filters.material) return false;
      if (filters.poNumber && !matchesText(r.poNumber, filters.poNumber))
        return false;
      if (filters.status && r.status !== filters.status) return false;
      if (
        view.dateField &&
        !inDateRange(r[view.dateField], filters.dateFrom, filters.dateTo)
      )
        return false;
      if (filters.search) {
        const blob = Object.values(r).join(" ");
        if (!matchesText(blob, filters.search)) return false;
      }
      return true;
    });
  }, [rawRows, filters, view]);

  const columns = useMemo(() => {
    const first = filteredRows[0] || rawRows[0];
    if (!first) return [];
    return Object.keys(first).filter((k) => k !== "id");
  }, [filteredRows, rawRows]);

  const handleExport = (type) => {
    const title = view.label;
    if (type === "csv") exportCSV(columns, filteredRows, title);
    else if (type === "excel") exportExcel(columns, filteredRows, title);
    else if (type === "pdf" || type === "print")
      exportPDFOrPrint(columns, filteredRows, title);
  };
  const navigate = useNavigate();
  const handleBack = () => navigate("/inventory/material");
  return (
    <>
<Header />

<div className="rpt-page">

  <div className="rpt-header">

    <div className="rpt-header-content">

      <div className="rpt-title-section">
        <h1 className="rpt-title">
          Material Reports
        </h1>

        <p className="rpt-subtitle">
          Live dashboard and exportable reports generated from current material
          data.
        </p>
      </div>

      <button
        onClick={handleBack}
        className="rpt-back-btn"
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

        <span>Back</span>
      </button>

    </div>

  </div>

{/* ================= KPI Summary ================= */}

<div className="rpt-summary-grid">

  <div className="rpt-summary-card rpt-po-card">
    <div className="rpt-summary-label">
      Total Purchase Orders
    </div>
    <div className="rpt-summary-value">
      {totals.totalPurchaseOrders}
    </div>
  </div>

  <div className="rpt-summary-card rpt-stock-card">
    <div className="rpt-summary-label">
      Total Material Stock
    </div>
    <div className="rpt-summary-value">
      {totals.totalMaterialStock}
    </div>
  </div>

  <div className="rpt-summary-card rpt-finished-card">
    <div className="rpt-summary-label">
      Total Finished Pieces
    </div>
    <div className="rpt-summary-value">
      {totals.totalFinishedPieces}
    </div>
  </div>

  <div className="rpt-summary-card rpt-balance-card">
    <div className="rpt-summary-label">
      Total Cutting Balance
    </div>
    <div className="rpt-summary-value">
      {totals.totalCuttingBalance}
    </div>
  </div>

  <div className="rpt-summary-card rpt-scrap-card">
    <div className="rpt-summary-label">
      Total Scrap Weight
    </div>
    <div className="rpt-summary-value">
      {totals.totalScrapWeight.toFixed(1)}
    </div>
  </div>

  <div className="rpt-summary-card rpt-rejection-card">
    <div className="rpt-summary-label">
      Total Rejections
    </div>
    <div className="rpt-summary-value">
      {totals.totalRejections}
    </div>
  </div>

  <div className="rpt-summary-card rpt-rework-card">
    <div className="rpt-summary-label">
      Total Rework
    </div>
    <div className="rpt-summary-value">
      {totals.totalRework}
    </div>
  </div>

  <div className="rpt-summary-card rpt-production-card">
    <div className="rpt-summary-label">
      Total Production Issues
    </div>
    <div className="rpt-summary-value">
      {totals.totalProductionIssues}
    </div>
  </div>

</div>

{/* ================= Report Views ================= */}

<div className="rpt-tabs">

  {REPORT_VIEWS.map((v) => (

    <button
      key={v.key}
      onClick={() => setActiveView(v.key)}
      className={
        v.key === activeView
          ? "rpt-tab rpt-tab-active"
          : "rpt-tab"
      }
    >
      {v.label}
    </button>

  ))}

</div>

{/* ================= Filters ================= */}

<div className="rpt-filter-panel">

  <input
    className="rpt-filter-input rpt-filter-search"
    placeholder="Search..."
    value={filters.search}
    onChange={setFilter("search")}
  />

  <label className="rpt-filter-date">

    <span>From</span>

    <input
      type="date"
      className="rpt-filter-input"
      value={filters.dateFrom}
      onChange={setFilter("dateFrom")}
      disabled={!view.dateField}
    />

  </label>

  <label className="rpt-filter-date">

    <span>To</span>

    <input
      type="date"
      className="rpt-filter-input"
      value={filters.dateTo}
      onChange={setFilter("dateTo")}
      disabled={!view.dateField}
    />

  </label>

  <select
    className="rpt-filter-select"
    value={filters.material}
    onChange={setFilter("material")}
  >
    <option value="">All Materials</option>

    {materialOptions.map((m) => (
      <option
        key={m}
        value={m}
      >
        {m}
      </option>
    ))}

  </select>

  <input
    className="rpt-filter-input"
    placeholder="PO Number"
    value={filters.poNumber}
    onChange={setFilter("poNumber")}
  />

  <select
    className="rpt-filter-select"
    value={filters.status}
    onChange={setFilter("status")}
  >
    <option value="">All Statuses</option>

    {statusOptions.map((s) => (
      <option
        key={s}
        value={s}
      >
        {s}
      </option>
    ))}

  </select>

  <button
    onClick={resetFilters}
    className="rpt-filter-clear-btn"
  >
    Clear Filters
  </button>

  <div className="rpt-filter-count">
    {filteredRows.length} of {rawRows.length} records
  </div>

</div>
{/* ================= Export Toolbar ================= */}

<div className="rpt-export-bar">

  <button
    className="rpt-export-btn"
    onClick={() => handleExport("pdf")}
  >
    Export PDF
  </button>

  <button
    className="rpt-export-btn"
    onClick={() => handleExport("excel")}
  >
    Export Excel
  </button>

  <button
    className="rpt-export-btn"
    onClick={() => handleExport("csv")}
  >
    Export CSV
  </button>

  <button
    className="rpt-export-btn"
    onClick={() => handleExport("print")}
  >
    Print
  </button>

</div>

{/* ================= Reports Table ================= */}

<div className="rpt-table-wrapper">

  <table className="rpt-table">

    <thead>
      <tr>
        {columns.map((c) => (
          <th key={c}>
            {c}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>

      {filteredRows.length === 0 && (
        <tr>
          <td
            className="rpt-empty-cell"
            colSpan={Math.max(columns.length, 1)}
          >
            <div className="rpt-empty-state">
              No records match the selected filters.
            </div>
          </td>
        </tr>
      )}

      {filteredRows.map((r, i) => (
        <tr key={r.id ?? i}>

          {columns.map((c) => (
            <td key={c}>
              {formatCell(r[c])}
            </td>
          ))}

        </tr>
      ))}

    </tbody>

  </table>

</div>
      </div>
    </>
  );
}
