import { useState } from "react";
import { useMaterialStore, issueToProduction } from "../../data/materialStore";
import "./issuetoprod.css";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";

const badgeClass = (status) => {
  switch (status) {
    case "Ready":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "Partially Issued":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "Fully Issued":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
};

const emptyForm = () => ({
  productionOrder: "",
  jobCard: "",
  department: "",
  issueQty: "",
  issuedBy: "",
  remarks: "",
});

export default function IssueToProduction() {
  const { finishedPieces } = useMaterialStore();

  const issuablePieces = finishedPieces.filter(
    (p) => p.availableQty > 0
  );

  const [activePiece, setActivePiece] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const openModal = (piece) => {
    setActivePiece(piece);
    setForm(emptyForm());
    setError("");
  };

  const closeModal = () => {
    setActivePiece(null);
    setError("");
  };

  const handleSave = () => {
    if (!activePiece) return;

    const qty = Number(form.issueQty);

    if (!qty || qty <= 0) {
      setError("Enter a valid Issue Qty.");
      return;
    }

    if (qty > activePiece.availableQty) {
      setError(
        `Issue Qty cannot exceed Available Qty (${activePiece.availableQty}).`
      );
      return;
    }

    if (
      !form.productionOrder.trim() ||
      !form.jobCard.trim() ||
      !form.issuedBy.trim()
    ) {
      setError(
        "Production Order, Job Card and Issued By are required."
      );
      return;
    }

    issueToProduction({
      pieceId: activePiece.id,
      productionOrder: form.productionOrder,
      jobCard: form.jobCard,
      issuedQty: qty,
      department: form.department,
      issuedBy: form.issuedBy,
      remarks: form.remarks,
    });

    closeModal();
  };

  const handleBack = () => {
    navigate("/inventory/material");
  };

  const totalPieces = issuablePieces.length;

  const totalQty = issuablePieces.reduce(
    (sum, item) => sum + item.availableQty,
    0
  );

  const totalWeight = issuablePieces
    .reduce((sum, item) => sum + item.weight * item.availableQty, 0)
    .toFixed(2);

  const readyPieces = issuablePieces.filter(
    (item) => item.status === "Ready"
  ).length;

  return (
    <>
      <Header />

      <div className="prod-page">

        <div className="page-top">

          <div>

            <div className="page-breadcrumb">

              <span
                onClick={() => navigate("/inventory")}
                className="crumb-link"
              >
                Inventory
              </span>

              <span>/</span>

              <span
                onClick={() => navigate("/inventory/material")}
                className="crumb-link"
              >
                Material
              </span>

              <span>/</span>

              <span className="crumb-active">
                Issue Material To Production
              </span>

            </div>

            <h1>
              Issue Material To Production
            </h1>

            <p>
              Issue finished cut materials to the production floor.
            </p>

          </div>

          <button
            className="back-btn"
            onClick={handleBack}
          >
            ← Back
          </button>

        </div>

        <div className="kpi-grid">

          <div className="kpi-card">

            <div className="kpi-title">
              Available Pieces
            </div>

            <div className="kpi-value">
              {totalPieces}
            </div>

          </div>

          <div className="kpi-card">

            <div className="kpi-title">
              Available Qty
            </div>

            <div className="kpi-value">
              {totalQty}
            </div>

          </div>

          <div className="kpi-card">

            <div className="kpi-title">
              Total Weight
            </div>

            <div className="kpi-value">
              {totalWeight} kg
            </div>

          </div>

          <div className="kpi-card">

            <div className="kpi-title">
              Ready To Issue
            </div>

            <div className="kpi-value">
              {readyPieces}
            </div>

          </div>

        </div>


          <div className="table-card">

  <div className="table-header">

    <div>
      <h3>Available Finished Pieces</h3>
      <p>Select a finished material to issue for production.</p>
    </div>

    <div className="table-count">
      {issuablePieces.length} Records
    </div>

  </div>

  <div className="table-wrapper">

    <table className="production-table">

      <thead>

        <tr>

          <th>Piece Code</th>
          <th>Drawing No</th>
          <th>Job No</th>
          <th>Material</th>
          <th>Length</th>
          <th>Width</th>
          <th>Available</th>
          <th>Weight</th>
          <th>Status</th>
          <th className="action-col">Action</th>

        </tr>

      </thead>

      <tbody>

        {issuablePieces.length === 0 && (

          <tr>

            <td
              colSpan={10}
              className="empty-state"
            >

              <div className="empty-icon">

                📦

              </div>

              <h4>No Finished Pieces Available</h4>

              <p>
                Receive completed cutting jobs before issuing
                materials to production.
              </p>

            </td>

          </tr>

        )}

        {issuablePieces.map((piece) => (

          <tr key={piece.id}>

            <td>

              <div className="piece-code">

                {piece.pieceCode}

              </div>

            </td>

            <td>

              {piece.drawingNumber}

            </td>

            <td>

              {piece.jobNumber}

            </td>

            <td>

              {piece.material}

            </td>

            <td>

              {piece.length}

            </td>

            <td>

              {piece.width}

            </td>

            <td>

              <span className="qty-chip">

                {piece.availableQty}

              </span>

            </td>

            <td>

              {piece.weight} kg

            </td>

            <td>

              <span
                className={`status-pill ${badgeClass(piece.status)}`}
              >

                {piece.status}

              </span>

            </td>

            <td>

              <button
                className="issue-btn"
                onClick={() => openModal(piece)}
              >

                Issue Material

              </button>

            </td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

</div>
{activePiece && (

<div className="modal-overlay">

  <div className="issue-modal">

    <div className="modal-header">

      <div>

        <h2>Issue Material To Production</h2>

        <p>

          {activePiece.pieceCode}

        </p>

      </div>

      <button
        className="close-btn"
        onClick={closeModal}
      >
        ✕
      </button>

    </div>

    <div className="modal-body">

      <div className="info-grid">

        <ReadonlyField
          label="Piece Code"
          value={activePiece.pieceCode}
        />

        <ReadonlyField
          label="Drawing Number"
          value={activePiece.drawingNumber}
        />

        <ReadonlyField
          label="Job Number"
          value={activePiece.jobNumber}
        />

        <ReadonlyField
          label="Material"
          value={activePiece.material}
        />

        <ReadonlyField
          label="Available Qty"
          value={activePiece.availableQty}
        />

        <ReadonlyField
          label="Weight"
          value={`${activePiece.weight} kg`}
        />

      </div>

      <div className="form-card">

        <h3>
          Production Details
        </h3>

        <div className="form-grid two-column">
          <FormField
            label="Production Order"
            value={form.productionOrder}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                productionOrder: v,
              }))
            }
          />

          <FormField
            label="Job Card"
            value={form.jobCard}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                jobCard: v,
              }))
            }
          />

          <FormField
            label="Department"
            value={form.department}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                department: v,
              }))
            }
          />

          <FormField
            label="Issue Quantity"
            type="number"
            value={form.issueQty}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                issueQty: v,
              }))
            }
          />

          <FormField
            className="full-width"
            label="Issued By"
            value={form.issuedBy}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                issuedBy: v,
              }))
            }
          />

          <div className="form-field full-width">
            <label className="field-label">

              Remarks

            </label>

            <textarea

              rows={4}

              value={form.remarks}

              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  remarks: e.target.value,
                }))
              }

            />

          </div>

        </div>

      </div>

      {error && (

        <div className="error-box">

          {error}

        </div>

      )}

    </div>

    <div className="modal-footer">

      <button

        className="cancel-btn"

        onClick={closeModal}

      >

        Cancel

      </button>

      <button

        className="save-btn"

        onClick={handleSave}

      >

        Issue Material

      </button>

    </div>

  </div>

</div>

)}
  </div>
    </>
  );
}


function ReadonlyField({ label, value }) {
  
  return (
    <div className="readonly-card">

      <span className="readonly-label">
        {label}
      </span>

      <div className="readonly-value">
        {value}
      </div>

    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}) {
  return (
    <div className={`form-field ${className}`}>
      <label>{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}