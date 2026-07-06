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

const th = {
  textAlign: "left",
  padding: "9px 12px",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.3,
  color: "#475569",
  borderBottom: "2px solid #e2e8f0",
  whiteSpace: "nowrap",
};
const td = {
  padding: "9px 12px",
  fontSize: 13,
  borderBottom: "1px solid #f1f5f9",
  color: "#1e293b",
  whiteSpace: "nowrap",
};

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
      <div
        style={{
          padding: 20,
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#0f172a",
        }}
      >
        <h2 style={{ margin: "0 0 4px" }}>Material Reports</h2>
        <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 13 }}>
          Live dashboard and exportable reports generated from current material
          data.
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

        {/* ---- Dashboard Summary ---- */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <div style={card}>
            <div style={label}>Total Purchase Orders</div>
            <div style={value}>{totals.totalPurchaseOrders}</div>
          </div>
          <div style={card}>
            <div style={label}>Total Material Stock</div>
            <div style={value}>{totals.totalMaterialStock}</div>
          </div>
          <div style={card}>
            <div style={label}>Total Finished Pieces</div>
            <div style={value}>{totals.totalFinishedPieces}</div>
          </div>
          <div style={card}>
            <div style={label}>Total Cutting Balance</div>
            <div style={value}>{totals.totalCuttingBalance}</div>
          </div>
          <div style={card}>
            <div style={label}>Total Scrap Weight</div>
            <div style={value}>{totals.totalScrapWeight.toFixed(1)}</div>
          </div>
          <div style={card}>
            <div style={label}>Total Rejections</div>
            <div style={value}>{totals.totalRejections}</div>
          </div>
          <div style={card}>
            <div style={label}>Total Rework</div>
            <div style={value}>{totals.totalRework}</div>
          </div>
          <div style={card}>
            <div style={label}>Total Production Issues</div>
            <div style={value}>{totals.totalProductionIssues}</div>
          </div>
        </div>

        {/* ---- Report View Tabs ---- */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {REPORT_VIEWS.map((v) => (
            <button
              key={v.key}
              style={tabBtn(v.key === activeView)}
              onClick={() => setActiveView(v.key)}
            >
              {v.label}
            </button>
          ))}
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
            placeholder="Search..."
            value={filters.search}
            onChange={setFilter("search")}
          />
          <label style={{ fontSize: 12, color: "#64748b" }}>
            From{" "}
            <input
              type="date"
              style={inputStyle}
              value={filters.dateFrom}
              onChange={setFilter("dateFrom")}
              disabled={!view.dateField}
            />
          </label>
          <label style={{ fontSize: 12, color: "#64748b" }}>
            To{" "}
            <input
              type="date"
              style={inputStyle}
              value={filters.dateTo}
              onChange={setFilter("dateTo")}
              disabled={!view.dateField}
            />
          </label>
          <select
            style={inputStyle}
            value={filters.material}
            onChange={setFilter("material")}
          >
            <option value="">All Materials</option>
            {materialOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            style={inputStyle}
            placeholder="PO Number"
            value={filters.poNumber}
            onChange={setFilter("poNumber")}
          />
          <select
            style={inputStyle}
            value={filters.status}
            onChange={setFilter("status")}
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button onClick={resetFilters} style={{ ...exportBtn }}>
            Clear Filters
          </button>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>
            {filteredRows.length} of {rawRows.length} records
          </span>
        </div>

        {/* ---- Export Bar ---- */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button style={exportBtn} onClick={() => handleExport("pdf")}>
            Export PDF
          </button>
          <button style={exportBtn} onClick={() => handleExport("excel")}>
            Export Excel
          </button>
          <button style={exportBtn} onClick={() => handleExport("csv")}>
            Export CSV
          </button>
          <button style={exportBtn} onClick={() => handleExport("print")}>
            Print
          </button>
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
                {columns.map((c) => (
                  <th key={c} style={th}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td style={td} colSpan={Math.max(columns.length, 1)}>
                    <div
                      style={{
                        padding: "24px 0",
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      No records match the selected filters.
                    </div>
                  </td>
                </tr>
              )}
              {filteredRows.map((r, i) => (
                <tr key={r.id ?? i}>
                  {columns.map((c) => (
                    <td key={c} style={td}>
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
