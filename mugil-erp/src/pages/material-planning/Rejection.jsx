// Rejection.jsx
// -----------------------------------------------------------------------------
// Rejection page is NOT a data entry page — rejections are created only from
// Receive From Cutting. This page just manages what happens to a Pending
// rejection next: Send For Rework or Convert To Scrap. Both actions disable
// once a rejection has been processed.
// -----------------------------------------------------------------------------

import { useMemo, useState } from "react";
import {
  useMaterialStore,
  sendRejectionToRework,
  convertRejectionToScrap,
  statusOptions,
} from "../../data/materialStore";
import "./Rejection.css";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700",
  "Sent for Rework": "bg-purple-50 text-purple-700",
  "Converted to Scrap": "bg-slate-100 text-slate-600",
  Closed: "bg-emerald-50 text-emerald-700",
};

function Badge({ text, className = "" }) {
  return (
    <span className={`rej-badge ${className}`}>
      {text}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="rej-modal-overlay">
      <div className="rej-modal">

        <div className="rej-modal-header">

          <h3 className="rej-modal-title">
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="rej-modal-close"
            aria-label="Close"
          >
            ✕
          </button>

        </div>

        <div className="rej-modal-body">
          {children}
        </div>

      </div>
    </div>
  );
}
export default function Rejection() {
  const { rejectionMaterials } = useMaterialStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [materialFilter, setMaterialFilter] = useState("All");

  const [viewRecord, setViewRecord] = useState(null);
  const [reworkTarget, setReworkTarget] = useState(null);
  const [scrapTarget, setScrapTarget] = useState(null);

  const materialOptions = useMemo(
    () =>
      Array.from(
        new Set(rejectionMaterials.map((r) => r.material).filter(Boolean)),
      ).sort(),
    [rejectionMaterials],
  );

  const filtered = useMemo(() => {
    return rejectionMaterials.filter((r) => {
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (materialFilter !== "All" && r.material !== materialFilter)
        return false;
      if (search.trim()) {
        const needle = search.trim().toLowerCase();
        const haystack = [
          r.id,
          r.jobNumber,
          r.poNumber,
          r.pieceCode,
          r.drawingNumber,
          r.material,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [rejectionMaterials, statusFilter, materialFilter, search]);

  const counts = useMemo(() => {
    const by = (status) =>
      rejectionMaterials.filter((r) => r.status === status).length;
    return {
      pending: by("Pending"),
      sentForRework: by("Sent for Rework"),
      convertedToScrap: by("Converted to Scrap"),
      closed: by("Closed"),
    };
  }, [rejectionMaterials]);

  function handleSendForRework() {
    sendRejectionToRework(reworkTarget.id);
    setReworkTarget(null);
  }

  function handleConvertToScrap() {
    convertRejectionToScrap(scrapTarget.id);
    setScrapTarget(null);
  }
  const navigate = useNavigate();
  const handleBack = () => navigate("/inventory/material");
  return (
    <>
<Header />

<div className="rejection-page">

  {/* =========================
      PAGE HEADER
  ========================== */}

  <div className="rej-page-header">

    <div className="rej-header-left">

      <div className="rej-breadcrumb">

        <Link to="/inventory">
          Inventory
        </Link>

        <span>/</span>

        <Link to="/inventory/material">
          Material
        </Link>

        <span>/</span>

        <span className="rej-breadcrumb-current">
          Rejection
        </span>

      </div>

      <button
  type="button"
  onClick={handleBack}
  className="rej-back-btn"
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

  <span>
    Back
  </span>
</button>

      <h1 className="rej-page-title">
        Rejection Management
      </h1>

      <p className="rej-page-subtitle">
        Review rejected materials received from Cutting and process them
        either for Rework or Scrap.
      </p>

    </div>

    

  </div>

  {/* =========================
      KPI SECTION
  ========================== */}

  <div className="rej-kpi-grid">

    <div className="rej-kpi-card rej-warning">

      <div className="rej-kpi-content">

        <span className="rej-kpi-label">
          Pending Rejections
        </span>

        <h2 className="rej-kpi-value">
          {counts.pending}
        </h2>

      </div>

    </div>

    <div className="rej-kpi-card rej-purple">

      <div className="rej-kpi-content">

        <span className="rej-kpi-label">
          Sent For Rework
        </span>

        <h2 className="rej-kpi-value">
          {counts.sentForRework}
        </h2>

      </div>

    </div>

    <div className="rej-kpi-card rej-danger">

      <div className="rej-kpi-content">

        <span className="rej-kpi-label">
          Converted To Scrap
        </span>

        <h2 className="rej-kpi-value">
          {counts.convertedToScrap}
        </h2>

      </div>

    </div>

    <div className="rej-kpi-card rej-success">

      <div className="rej-kpi-content">

        <span className="rej-kpi-label">
          Closed Cases
        </span>

        <h2 className="rej-kpi-value">
          {counts.closed}
        </h2>

      </div>

    </div>

  </div>

      <div className="rej-filter-card">

  <div className="rej-filter-header">

    <div>

      <h3 className="rej-section-title">
        Filters
      </h3>

      <p className="rej-section-subtitle">
        Search and filter rejection records.
      </p>

    </div>

  </div>

  <div className="rej-filter-grid">

    {/* Search */}

    <div className="rej-form-group">

      <label className="rej-label">
        Search
      </label>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search Reject ID, Job No, PO No, Piece Code..."
        className="rej-input"
      />

    </div>

    {/* Status */}

    <div className="rej-form-group">

      <label className="rej-label">
        Status
      </label>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rej-select"
      >

        <option value="All">
          All Statuses
        </option>

        {statusOptions.rejectionStatus.map((status) => (

          <option
            key={status}
            value={status}
          >
            {status}
          </option>

        ))}

      </select>

    </div>

    {/* Material */}

    <div className="rej-form-group">

      <label className="rej-label">
        Material
      </label>

      <select
        value={materialFilter}
        onChange={(e) => setMaterialFilter(e.target.value)}
        className="rej-select"
      >

        <option value="All">
          All Materials
        </option>

        {materialOptions.map((material) => (

          <option
            key={material}
            value={material}
          >
            {material}
          </option>

        ))}

      </select>

    </div>

  </div>

</div>

<div className="rej-table-card">

  <div className="rej-table-header">

    <div>

      <h3 className="rej-section-title">
        Rejection Records
      </h3>

      <p className="rej-section-subtitle">
        {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
      </p>

    </div>

  </div>

  <div className="rej-table-responsive">

    <table className="rej-table">

      <thead>

        <tr>

          <th>Reject ID</th>
          <th>Job No</th>
          <th>PO No</th>
          <th>Piece Code</th>
          <th>Drawing No</th>
          <th>Material</th>
          <th>Grade</th>
          <th>Qty</th>
          <th>Reason</th>
          <th>Status</th>
          <th>Date</th>
          <th className="rej-text-center">Actions</th>

        </tr>

      </thead>

      <tbody>

        {filtered.map((r) => {

          const isPending = r.status === "Pending";

          return (

            <tr key={r.id}>

              <td className="rej-id-cell">
                {r.id}
              </td>

              <td>{r.jobNumber || r.sourceJob || "—"}</td>

              <td>{r.poNumber || "—"}</td>

              <td>{r.pieceCode || "—"}</td>

              <td>{r.drawingNumber || "—"}</td>

              <td>

                <span className="rej-material-chip">
                  {r.material}
                </span>

              </td>

              <td>{r.grade}</td>

              <td className="rej-qty-cell">
                {r.quantity}
              </td>

              <td>{r.reason}</td>

              <td>

                <Badge
                  text={r.status}
                  className={
                    STATUS_STYLES[r.status] ||
                    "rej-badge-secondary"
                  }
                />

              </td>

              <td>{r.date || "—"}</td>

              <td>

                <div className="rej-table-actions">

                  <button
                    type="button"
                    onClick={() => setViewRecord(r)}
                    className="rej-btn rej-btn-view"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    disabled={!isPending}
                    onClick={() => setReworkTarget(r)}
                    className="rej-btn rej-btn-rework"
                  >
                    Rework
                  </button>

                  <button
                    type="button"
                    disabled={!isPending}
                    onClick={() => setScrapTarget(r)}
                    className="rej-btn rej-btn-scrap"
                  >
                    Scrap
                  </button>

                </div>

              </td>

            </tr>

          );

        })}

        {filtered.length === 0 && (

          <tr>

            <td
              colSpan={12}
              className="rej-empty-table"
            >

              <div className="rej-empty-state">

                <div className="rej-empty-icon">
                  📋
                </div>

                <h4>
                  No Rejection Records Found
                </h4>

                <p>
                  No rejection records match the current search or filters.
                </p>

              </div>

            </td>

          </tr>

        )}

      </tbody>

    </table>

  </div>

</div>

{/* View Modal */}

{viewRecord && (
  <Modal
    title={`Rejection Details • ${viewRecord.id}`}
    onClose={() => setViewRecord(null)}
  >

    <div className="rej-details-grid">

      {[
        ["Job Number", viewRecord.jobNumber || viewRecord.sourceJob],
        ["PO Number", viewRecord.poNumber],
        ["Piece Code", viewRecord.pieceCode],
        ["Drawing Number", viewRecord.drawingNumber],
        ["Material", viewRecord.material],
        ["Grade", viewRecord.grade],
        ["Plate Number", viewRecord.plateNumber],
        ["Quantity", viewRecord.quantity],
        ["Reason", viewRecord.reason],
        ["Department", viewRecord.department],
        ["Status", viewRecord.status],
        ["Date", viewRecord.date],
      ].map(([label, value]) => (

        <div
          key={label}
          className="rej-detail-item"
        >

          <span className="rej-detail-label">
            {label}
          </span>

          <span className="rej-detail-value">
            {value || "—"}
          </span>

        </div>

      ))}

    </div>

    <div className="rej-modal-footer">

      <button
        type="button"
        onClick={() => setViewRecord(null)}
        className="rej-btn rej-btn-secondary"
      >
        Close
      </button>

    </div>

  </Modal>
)}

{/* Send For Rework */}

{reworkTarget && (
  <Modal
    title="Send For Rework"
    onClose={() => setReworkTarget(null)}
  >

    <div className="rej-confirm-box">

      <div className="rej-confirm-icon rej-warning">
        🔄
      </div>

      <h3>
        Send Material For Rework?
      </h3>

      <p>
        The rejection record
        <strong> {reworkTarget.id} </strong>
        containing
        <strong> {reworkTarget.quantity} pcs </strong>
        of
        <strong> {reworkTarget.material}</strong>
        will be transferred to the Rework Inventory.
      </p>

    </div>

    <div className="rej-modal-footer">

      <button
        type="button"
        onClick={() => setReworkTarget(null)}
        className="rej-btn rej-btn-secondary"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={handleSendForRework}
        className="rej-btn rej-btn-purple"
      >
        Send For Rework
      </button>

    </div>

  </Modal>
)}

{/* Convert To Scrap */}

{scrapTarget && (
  <Modal
    title="Convert To Scrap"
    onClose={() => setScrapTarget(null)}
  >

    <div className="rej-confirm-box">

      <div className="rej-confirm-icon rej-danger">
        ♻️
      </div>

      <h3>
        Convert To Scrap?
      </h3>

      <p>
        Rejection
        <strong> {scrapTarget.id} </strong>
        containing
        <strong> {scrapTarget.quantity} pcs </strong>
        of
        <strong> {scrapTarget.material}</strong>
        will be converted into a Scrap record.
        <br />
        <strong>This action cannot be undone.</strong>
      </p>

    </div>

    <div className="rej-modal-footer">

      <button
        type="button"
        onClick={() => setScrapTarget(null)}
        className="rej-btn rej-btn-secondary"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={handleConvertToScrap}
        className="rej-btn rej-btn-danger"
      >
        Convert To Scrap
      </button>

    </div>

  </Modal>
)}

</div>
</>
);
}