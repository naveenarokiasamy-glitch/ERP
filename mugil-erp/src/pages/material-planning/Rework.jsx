// Rework.jsx
// -----------------------------------------------------------------------------
// New page. Only rejection records can enter this page (via "Send For Rework"
// on the Rejection page) — there is no manual Add button here. Manages
// repair/rework of rejected material through to Finished Pieces, or to Scrap
// if the rework fails.
// -----------------------------------------------------------------------------

import { useMemo, useState } from "react";
import {
  useMaterialStore,
  startRework,
  completeRework,
  scrapFromRework,
  statusOptions,
} from "../../data/materialStore";
import "./Rework.css";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700",
  "In Progress": "bg-blue-50 text-blue-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Failed: "bg-rose-50 text-rose-700",
};

function Card({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Badge({ text, className }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {text}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function Rework() {
  const { reworkMaterials } = useMaterialStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [materialFilter, setMaterialFilter] = useState("All");

  const [startTarget, setStartTarget] = useState(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [completeTarget, setCompleteTarget] = useState(null);
  const [scrapTarget, setScrapTarget] = useState(null);

  const materialOptions = useMemo(
    () =>
      Array.from(
        new Set(reworkMaterials.map((r) => r.material).filter(Boolean)),
      ).sort(),
    [reworkMaterials],
  );

  const filtered = useMemo(() => {
    return reworkMaterials.filter((r) => {
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (materialFilter !== "All" && r.material !== materialFilter)
        return false;
      if (search.trim()) {
        const needle = search.trim().toLowerCase();
        const haystack = [
          r.id,
          r.rejectId,
          r.jobNumber,
          r.pieceCode,
          r.material,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [reworkMaterials, statusFilter, materialFilter, search]);

  const counts = useMemo(() => {
    const by = (status) =>
      reworkMaterials.filter((r) => r.status === status).length;
    return {
      pending: by("Pending"),
      inProgress: by("In Progress"),
      completed: by("Completed"),
      scrapped: by("Failed"),
    };
  }, [reworkMaterials]);

  function openStart(record) {
    setAssignedTo(record.assignedTo || "");
    setStartTarget(record);
  }

  function handleStart() {
    startRework(startTarget.id, assignedTo);
    setStartTarget(null);
    setAssignedTo("");
  }

  function handleComplete() {
    completeRework(completeTarget.id);
    setCompleteTarget(null);
  }

  function handleScrap() {
    scrapFromRework(scrapTarget.id);
    setScrapTarget(null);
  }
  const navigate = useNavigate();
  const handleBack = () => navigate("/inventory/material");
return (
  <>
    <Header />

    <div className="rework-page">
      <div className="page-container">

      {/* ================= HEADER ================= */}

      <div className="page-header">

        <div className="page-header-left">

          <div className="breadcrumb">
  <span
    className="breadcrumb-link"
    onClick={() => navigate("/inventory")}
  >
    Inventory
  </span>

  <span className="separator">/</span>

  <span
    className="breadcrumb-link"
    onClick={() => navigate("/inventory/material")}
  >
    Material
  </span>

  <span className="separator">/</span>

  <span className="active">Rework Materials</span>

  
</div>
<button
            onClick={handleBack}
            className="back-btn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
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

            Back to Materials
          </button>

          <p className="page-description">
            Manage rejected materials sent for rework, monitor repair progress,
            complete successful rework, or transfer failed items to scrap.
          </p>

        </div>

        <div className="page-header-right">

          

        </div>

      </div>

      {/* ================= KPI ================= */}

      <div className="kpi-grid">

        <div className="kpi-card pending-card">
          <div className="kpi-content">
            <span className="kpi-label">
              Pending Rework
            </span>

            <span className="kpi-value">
              {counts.pending}
            </span>
          </div>

          <div className="kpi-icon">
            ⏳
          </div>
        </div>

        <div className="kpi-card progress-card">
          <div className="kpi-content">
            <span className="kpi-label">
              In Progress
            </span>

            <span className="kpi-value">
              {counts.inProgress}
            </span>
          </div>

          <div className="kpi-icon">
            🔧
          </div>
        </div>

        <div className="kpi-card success-card">
          <div className="kpi-content">
            <span className="kpi-label">
              Completed
            </span>

            <span className="kpi-value">
              {counts.completed}
            </span>
          </div>

          <div className="kpi-icon">
            ✅
          </div>
        </div>

        <div className="kpi-card scrap-card">
          <div className="kpi-content">
            <span className="kpi-label">
              Scrapped
            </span>

            <span className="kpi-value">
              {counts.scrapped}
            </span>
          </div>

          <div className="kpi-icon">
            ♻️
          </div>
        </div>

      </div>

      {/* ================= FILTERS ================= */}

<div className="filter-card">

  <div className="filter-header">
    <div>
      <h3 className="filter-title">
        Filter Rework Materials
      </h3>

      <p className="filter-subtitle">
        Search and filter rework records by material and status.
      </p>
    </div>
  </div>

  <div className="filter-grid">

    <div className="filter-group">

      <label className="filter-label">
        Search
      </label>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search Rework ID, Reject ID, Job No, Piece Code..."
        className={inputClass}
      />

    </div>

    <div className="filter-group">

      <label className="filter-label">
        Status
      </label>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className={inputClass}
      >
        <option value="All">All Statuses</option>

        {statusOptions.rework.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

    </div>

    <div className="filter-group">

      <label className="filter-label">
        Material
      </label>

      <select
        value={materialFilter}
        onChange={(e) => setMaterialFilter(e.target.value)}
        className={inputClass}
      >
        <option value="All">All Materials</option>

        {materialOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

    </div>

  </div>

</div>

{/* ================= TABLE ================= */}


{/* ================= TABLE ================= */}

<div className="table-card">

      <div className="table-header">

  <div>
    <h3 className="table-title">
      Rework Material Records
    </h3>

    <p className="table-subtitle">
      Total Records : <strong>{filtered.length}</strong>
    </p>
  </div>

</div>

<div className="table-responsive">

  <table className="rework-table">

    <thead>

      <tr>
        <th>Rework ID</th>
        <th>Reject ID</th>
        <th>Job No</th>
        <th>Piece Code</th>
        <th>Material</th>
        <th>Grade</th>
        <th>Qty</th>
        <th>Reason</th>
        <th>Assigned To</th>
        <th>Status</th>
        <th className="text-end">Actions</th>
      </tr>

    </thead>

    <tbody>

      {filtered.map((r) => {

        const isPending = r.status === "Pending";
        const isInProgress = r.status === "In Progress";

        return (

          <tr key={r.id}>

            <td>
              <span className="primary-id">
                {r.id}
              </span>
            </td>

            <td>{r.rejectId}</td>

            <td>{r.jobNumber || "—"}</td>

            <td>{r.pieceCode || "—"}</td>

            <td>
              <span className="material-chip">
                {r.material}
              </span>
            </td>

            <td>{r.grade}</td>

            <td>
              <span className="qty-chip">
                {r.quantity}
              </span>
            </td>

            <td className="reason-column">
              {r.reason}
            </td>

            <td>

              {r.assignedTo ? (
                <span className="user-chip">
                  {r.assignedTo}
                </span>
              ) : (
                <span className="empty-text">
                  —
                </span>
              )}

            </td>

            <td>

              <Badge
                text={r.status}
                className={
                  STATUS_STYLES[r.status] ||
                  "bg-slate-100 text-slate-600"
                }
              />

            </td>

            <td>

              <div className="table-actions">

                {isPending && (

                  <button
                    onClick={() => openStart(r)}
                    className="action-btn start-btn"
                  >
                    Start Rework
                  </button>

                )}

                {isInProgress && (

                  <>

                    <button
                      onClick={() => setCompleteTarget(r)}
                      className="action-btn complete-btn"
                    >
                      Complete
                    </button>

                    <button
                      onClick={() => setScrapTarget(r)}
                      className="action-btn scrap-btn"
                    >
                      Scrap
                    </button>

                  </>

                )}

                {!isPending && !isInProgress && (

                  <span className="completed-text">
                    No Actions
                  </span>

                )}

              </div>

            </td>

          </tr>

        );

      })}

      {filtered.length === 0 && (

        <tr>

          <td
            colSpan={11}
            className="table-empty"
          >
            <div className="empty-state">

              <div className="empty-icon">
                📦
              </div>

              <h4>
                No Rework Materials Found
              </h4>

              <p>
                No rework records match your current search or filter
                criteria.
              </p>

            </div>
          </td>

        </tr>

      )}

    </tbody>

  </table>

</div>

</div>

{/* ================= START REWORK ================= */}

{startTarget && (
  <Modal
    title="Start Rework"
    onClose={() => setStartTarget(null)}
  >

    <div className="modal-grid">

      <div className="modal-section">

        <h4 className="section-title">
          Rework Information
        </h4>

        <div className="details-grid">

          <div>
            <label>Rework ID</label>
            <span>{startTarget.id}</span>
          </div>

          <div>
            <label>Reject ID</label>
            <span>{startTarget.rejectId}</span>
          </div>

          <div>
            <label>Material</label>
            <span>{startTarget.material}</span>
          </div>

          <div>
            <label>Quantity</label>
            <span>{startTarget.quantity}</span>
          </div>

        </div>

      </div>

      <div className="modal-section">

        <h4 className="section-title">
          Assignment
        </h4>

        <div className="form-group">

          <label>
            Assigned To
          </label>

          <input
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Enter employee name"
            className={inputClass}
          />

        </div>

      </div>

    </div>

    <div className="modal-footer">

      <button
        onClick={() => setStartTarget(null)}
        className="secondary-btn"
      >
        Cancel
      </button>

      <button
        onClick={handleStart}
        className="primary-btn"
      >
        Start Rework
      </button>

    </div>

  </Modal>
)}

{/* ================= COMPLETE ================= */}

{completeTarget && (
  <Modal
    title="Complete Rework"
    onClose={() => setCompleteTarget(null)}
  >

    <div className="modal-grid">

      <div className="modal-section">

        <h4 className="section-title">
          Rework Details
        </h4>

        <div className="details-grid">

          <div>
            <label>Rework ID</label>
            <span>{completeTarget.id}</span>
          </div>

          <div>
            <label>Material</label>
            <span>{completeTarget.material}</span>
          </div>

          <div>
            <label>Quantity</label>
            <span>{completeTarget.quantity}</span>
          </div>

          <div>
            <label>Status</label>
            <span>Ready for Completion</span>
          </div>

        </div>

      </div>

      <div className="modal-section">

        <div className="success-box">

          <h4>
            Finished Pieces
          </h4>

          <p>
            Completing this rework will transfer the repaired material
            back to Finished Pieces inventory.
          </p>

        </div>

      </div>

    </div>

    <div className="modal-footer">

      <button
        onClick={() => setCompleteTarget(null)}
        className="secondary-btn"
      >
        Cancel
      </button>

      <button
        onClick={handleComplete}
        className="success-btn"
      >
        Complete Rework
      </button>

    </div>

  </Modal>
)}

{/* ================= SCRAP ================= */}

{scrapTarget && (
  <Modal
    title="Scrap Failed Rework"
    onClose={() => setScrapTarget(null)}
  >

    <div className="modal-grid">

      <div className="modal-section">

        <h4 className="section-title">
          Failed Rework
        </h4>

        <div className="details-grid">

          <div>
            <label>Rework ID</label>
            <span>{scrapTarget.id}</span>
          </div>

          <div>
            <label>Material</label>
            <span>{scrapTarget.material}</span>
          </div>

          <div>
            <label>Quantity</label>
            <span>{scrapTarget.quantity}</span>
          </div>

          <div>
            <label>Destination</label>
            <span>Scrap Inventory</span>
          </div>

        </div>

      </div>

      <div className="modal-section">

        <div className="danger-box">

          <h4>
            Warning
          </h4>

          <p>
            This action will permanently move this material to Scrap
            Inventory and cannot be undone.
          </p>

        </div>

      </div>

    </div>

    <div className="modal-footer">

      <button
        onClick={() => setScrapTarget(null)}
        className="secondary-btn"
      >
        Cancel
      </button>

      <button
        onClick={handleScrap}
        className="danger-btn"
      >
        Move To Scrap
      </button>

    </div>

  </Modal>
)}

    </div>
  </div>
</>
);
}
