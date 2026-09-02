import { useState, useMemo } from "react";
import { useMaterialStore, receiveFromCutting } from "../../data/materialStore";
import "./Receivefromcutting.css";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import "../../styles/BackButton.css";
import {
  ArrowLeft,
  // keep all your existing icons here
} from "lucide-react";
const badgeClass = (status) => {
  switch (status) {
    case "Open":
      return "rfc-status-open";

    case "Received":
      return "rfc-status-received";

    default:
      return "rfc-status-default";
  }
};

// Small "In House" / "Outsourcing" source badge — this is the ONLY visible
// difference between the two job types on this page, exactly as specced.
const sourceBadgeClass = (source) =>
  source === "Outsourcing"
    ? "bg-purple-50 text-purple-700 ring-1 ring-purple-200"
    : "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

// ---------------------------------------------------------------------------
// Row / plate factories
// ---------------------------------------------------------------------------
let pieceRowId = 1;
const newPieceRow = (withDimensions = false) => ({
  rowId: pieceRowId++,
  pieceCode: "",
  drawingNumber: "",
  ...(withDimensions ? { length: "", width: "" } : {}),
  quantity: "",
  weight: "",
});

let plateRowId = 1;
const newRemainingPlate = () => ({
  id: plateRowId++,
  plateNumber: "",
  pieces: [newPieceRow(true)],
  remainingLength: "",
  remainingWidth: "",
  remainingWeight: "",
  scrapWeight: "",
  rejectedQty: "",
  remarks: "",
});

const emptyForm = () => ({
  fullyConsumedCount: "",
  fullyConsumedPieces: [newPieceRow(false)],
  remainingPlates: [],
  receivedBy: "",
});

// Keep existing plate rows when the remaining count changes; add/trim as needed.
const reconcileRemainingPlates = (existing, targetCount) => {
  const count = Math.max(0, targetCount);
  if (count === existing.length) return existing;
  if (count < existing.length) return existing.slice(0, count);
  const extra = Array.from({ length: count - existing.length }, () =>
    newRemainingPlate(),
  );
  return [...existing, ...extra];
};

export default function ReceiveFromCutting() {
  const { cuttingJobs, outsourcingJobs } = useMaterialStore();

  // Show BOTH In House and Outsourcing jobs in the same table/queue. The
  // user can't tell the two apart except via the Source badge below —
  // everything else (opening the modal, validating, saving) is identical
  // and goes through the same receiveFromCutting() call either way.
  const allJobs = [
    ...cuttingJobs.map((j) => ({ ...j, source: j.source || "In House" })),
    ...outsourcingJobs.map((j) => ({ ...j, source: j.source || "Outsourcing" })),
  ];
  const openJobs = allJobs.filter((j) => j.status === "Open");

  const [activeJob, setActiveJob] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");

  const issuedQty = activeJob ? Number(activeJob.issuedQty) || 0 : 0;
  const fullyConsumedCount = Math.min(
    Number(form.fullyConsumedCount) || 0,
    issuedQty,
  );
  const remainingCount = Math.max(issuedQty - fullyConsumedCount, 0);

  const openModal = (job) => {
    setActiveJob(job);
    setForm(emptyForm());
    setError("");
  };
  const closeModal = () => {
    setActiveJob(null);
    setError("");
  };

  // -------------------------------------------------------------------------
  // Step 1: completely consumed plate count
  // -------------------------------------------------------------------------
  const handleFullyConsumedChange = (raw) => {
    const value = raw === "" ? "" : Math.max(0, Math.min(Number(raw), issuedQty));
    const newRemainingCount = issuedQty - (Number(value) || 0);
    setForm((f) => ({
      ...f,
      fullyConsumedCount: value,
      remainingPlates: reconcileRemainingPlates(f.remainingPlates, newRemainingCount),
    }));
  };

  // -------------------------------------------------------------------------
  // Fully consumed plates — aggregated finished-piece output
  // -------------------------------------------------------------------------
  const updateFullyConsumedPiece = (rowId, field, value) => {
    setForm((f) => ({
      ...f,
      fullyConsumedPieces: f.fullyConsumedPieces.map((p) =>
        p.rowId === rowId ? { ...p, [field]: value } : p,
      ),
    }));
  };
  const addFullyConsumedPiece = () =>
    setForm((f) => ({
      ...f,
      fullyConsumedPieces: [...f.fullyConsumedPieces, newPieceRow(false)],
    }));
  const removeFullyConsumedPiece = (rowId) =>
    setForm((f) => ({
      ...f,
      fullyConsumedPieces:
        f.fullyConsumedPieces.length > 1
          ? f.fullyConsumedPieces.filter((p) => p.rowId !== rowId)
          : f.fullyConsumedPieces,
    }));

  // -------------------------------------------------------------------------
  // Remaining plates — full detail per plate
  // -------------------------------------------------------------------------
  const updateRemainingPlateField = (plateId, field, value) =>
    setForm((f) => ({
      ...f,
      remainingPlates: f.remainingPlates.map((pl) =>
        pl.id === plateId ? { ...pl, [field]: value } : pl,
      ),
    }));

  const updateRemainingPiece = (plateId, rowId, field, value) =>
    setForm((f) => ({
      ...f,
      remainingPlates: f.remainingPlates.map((pl) =>
        pl.id === plateId
          ? {
              ...pl,
              pieces: pl.pieces.map((p) =>
                p.rowId === rowId ? { ...p, [field]: value } : p,
              ),
            }
          : pl,
      ),
    }));

  const addRemainingPiece = (plateId) =>
    setForm((f) => ({
      ...f,
      remainingPlates: f.remainingPlates.map((pl) =>
        pl.id === plateId
          ? { ...pl, pieces: [...pl.pieces, newPieceRow(true)] }
          : pl,
      ),
    }));

  const removeRemainingPiece = (plateId, rowId) =>
    setForm((f) => ({
      ...f,
      remainingPlates: f.remainingPlates.map((pl) =>
        pl.id === plateId
          ? {
              ...pl,
              pieces:
                pl.pieces.length > 1
                  ? pl.pieces.filter((p) => p.rowId !== rowId)
                  : pl.pieces,
            }
          : pl,
      ),
    }));

  // -------------------------------------------------------------------------
  // Validation + save
  // -------------------------------------------------------------------------
  const validate = () => {
    if (form.fullyConsumedCount === "" ) {
      return "Please enter the number of completely consumed plates.";
    }
    if (fullyConsumedCount < 0 || fullyConsumedCount > issuedQty) {
      return `Completely Consumed Plates must be between 0 and ${issuedQty}.`;
    }

    const validFullyConsumedPieces = form.fullyConsumedPieces.filter(
      (p) => p.pieceCode.trim() && Number(p.quantity) > 0,
    );
    if (fullyConsumedCount > 0 && validFullyConsumedPieces.length === 0) {
      return "Add at least one finished piece for the fully consumed plates.";
    }

    if (form.remainingPlates.length !== remainingCount) {
      return "Remaining plate sections don't match the remaining plate count.";
    }

    for (const plate of form.remainingPlates) {
      if (!plate.plateNumber.trim()) {
        return "Enter a Plate Number for every remaining plate.";
      }
      const validPieces = plate.pieces.filter(
        (p) => p.pieceCode.trim() && Number(p.quantity) > 0,
      );
      if (validPieces.length === 0) {
        return `Add at least one finished piece for plate ${plate.plateNumber}.`;
      }
    }

    if (!form.receivedBy.trim()) {
      return "Please enter Received By.";
    }
    return "";
  };

  const handleSave = () => {
    if (!activeJob) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    receiveFromCutting({
      jobNumber: activeJob.jobNumber,
      fullyConsumedCount,
      fullyConsumedPieces: form.fullyConsumedPieces.filter(
        (p) => p.pieceCode.trim() && Number(p.quantity) > 0,
      ),
      remainingPlates: form.remainingPlates.map((plate) => ({
        plateNumber: plate.plateNumber,
        pieces: plate.pieces.filter(
          (p) => p.pieceCode.trim() && Number(p.quantity) > 0,
        ),
        remainingLength: plate.remainingLength,
        remainingWidth: plate.remainingWidth,
        remainingWeight: plate.remainingWeight,
        scrapWeight: plate.scrapWeight,
        rejectedQty: plate.rejectedQty,
        remarks: plate.remarks,
      })),
      receivedBy: form.receivedBy,
    });

    closeModal();
  };


  return (
<>
  <Header />

  <div className="receive-cutting-page">

    {/* =====================================
        PAGE HEADER
    ====================================== */}

    <div className="rfc-page-header">

      <div className="rfc-header-left">

        <div className="rfc-breadcrumb">

  <Link to="/inventory" className="rfc-breadcrumb-link">
    Inventory
  </Link>

  <span>/</span>

  <Link to="/inventory/material" className="rfc-breadcrumb-link">
    Material
  </Link>

  <span>/</span>

  <span className="rfc-current">
    Receive From Cutting
  </span>

</div>

<Link to="/inventory/material" className="erp-back-button">
  <ArrowLeft size={16} />
  Back
</Link>

        <h1 className="rfc-page-title">
          Receive From Cutting
        </h1>

        <p className="rfc-page-subtitle">
          Close open cutting jobs and record finished pieces,
          leftover balance, scrap and rejection plate by plate.
        </p>

      </div>

      

    </div>

    {/* =====================================
        JOB LIST
    ====================================== */}

    <div className="rfc-table-card">

      <div className="rfc-table-header">

        <div>

          <h3 className="rfc-section-title">
            Open Cutting Jobs
          </h3>

          <p className="rfc-section-subtitle">
            {openJobs.length} Open Job{openJobs.length !== 1 ? "s" : ""}
          </p>

        </div>

      </div>

      <div className="rfc-table-responsive">

        <table className="rfc-table">

          <thead>

            <tr>

              <th>Job Number</th>
              <th>PO Number</th>
              <th>Plate Number</th>
              <th>Heat Number</th>
              <th>Material</th>
              <th>Grade</th>
              <th>Original Plate Size</th>
              <th>Issued Qty</th>
              <th>Issue Date</th>
              <th>Status</th>
              <th className="rfc-text-center">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {openJobs.length === 0 && (

              <tr>

                <td
                  colSpan={11}
                  className="rfc-empty-table"
                >

                  <div className="rfc-empty-state">

                    <div className="rfc-empty-icon">
                      📋
                    </div>

                    <h4>
                      No Open Cutting Jobs
                    </h4>

                    <p>
                      Every cutting job has already been received.
                    </p>

                  </div>

                </td>

              </tr>

            )}

            {openJobs.map((job) => (

              <tr key={job.jobNumber}>

                <td className="rfc-job-number">
                  {job.jobNumber}
                </td>

                <td>{job.poNumber}</td>

                <td>{job.plateNumber}</td>

                <td>{job.heatNumber}</td>

                <td>

                  <span className="rfc-material-chip">
                    {job.material}
                  </span>

                </td>

                <td>{job.grade}</td>

                <td>
                  {job.originalLength || "-"} × {job.originalWidth || "-"}
                </td>

                <td className="rfc-issued-cell">
                  {job.issuedQty}
                </td>

                <td>{job.issueDate}</td>

                <td>

                  <span
                    className={`rfc-status ${badgeClass(job.status)}`}
                  >
                    {job.status}
                  </span>

                </td>

                <td>

                  <div className="rfc-action">

                    <button
                      type="button"
                      onClick={() => openModal(job)}
                      className="rfc-btn rfc-btn-primary"
                    >
                      Receive
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

 {activeJob && (
  <div className="rfc-overlay">
    <div className="rfc-modal">

      {/* Modal Header */}

      <div className="rfc-modal-header">

        <div>

          <h2 className="rfc-modal-title">
            Receive From Cutting
          </h2>

          <p className="rfc-modal-subtitle">
            Job Number : <strong>{activeJob.jobNumber}</strong>
          </p>

        </div>

        <button
          type="button"
          onClick={closeModal}
          className="rfc-close-btn"
        >
          ✕
        </button>

      </div>

      {/* Modal Content */}

      <div className="rfc-modal-content">

        <div className="rfc-modal-container">

          {/* ===========================
              Job Information
          =========================== */}

          <div className="rfc-readonly-card">

            <div className="rfc-section-header">

              <div>

                <h3 className="rfc-section-title">
                  Job Information
                </h3>

                <p className="rfc-section-subtitle">
                  Issued plate details from the cutting department.
                </p>

              </div>

            </div>

            <div className="rfc-readonly-grid">

              <ReadonlyField
                label="Job Number"
                value={activeJob.jobNumber}
              />

              <ReadonlyField
                label="PO Number"
                value={activeJob.poNumber}
              />

              <ReadonlyField
                label="Plate Number"
                value={activeJob.plateNumber}
              />

              <ReadonlyField
                label="Material"
                value={activeJob.material}
              />

              <ReadonlyField
                label="Grade"
                value={activeJob.grade}
              />

              <ReadonlyField
                label="Thickness"
                value={
                  activeJob.thickness
                    ? `${activeJob.thickness} mm`
                    : "-"
                }
              />

              <ReadonlyField
                label="Original Length"
                value={activeJob.originalLength || "-"}
              />

              <ReadonlyField
                label="Original Width"
                value={activeJob.originalWidth || "-"}
              />

              <ReadonlyField
                label="Issued Plate Quantity"
                value={activeJob.issuedQty}
              />

            </div>

          </div>

          {/* ===========================
              Summary Cards
          =========================== */}

          <div className="rfc-summary-grid">

            <SummaryCard
              label="Total Issued Plates"
              value={issuedQty}
              tone="slate"
            />

            <SummaryCard
              label="Fully Consumed Plates"
              value={fullyConsumedCount}
              tone="emerald"
            />

            <SummaryCard
              label="Remaining Plates"
              value={remainingCount}
              tone="amber"
            />

          </div>

          {/* ===========================
              Step 1
          =========================== */}

          <div className="rfc-step-card">

            <div className="rfc-section-header">

              <div>

                <h3 className="rfc-section-title">
                  Step 1 — Completely Consumed Plates
                </h3>

                <p className="rfc-section-subtitle">
                  Out of the <strong>{issuedQty}</strong> issued plates,
                  how many were completely consumed?
                </p>

              </div>

            </div>

            <div className="rfc-step-input">

              <FormField
                label="Completely Consumed Plates"
                type="number"
                value={form.fullyConsumedCount}
                onChange={handleFullyConsumedChange}
              />

            </div>

          </div>

          {/* ===========================
              Fully Consumed Output
          =========================== */}

          {fullyConsumedCount > 0 && (

            <div className="rfc-piece-section">

              <div className="rfc-section-header">

                <div>

                  <h3 className="rfc-section-title">
                    Finished Piece Output
                  </h3>

                  <p className="rfc-section-subtitle">
                    Total output from the{" "}
                    <strong>
                      {fullyConsumedCount}
                    </strong>{" "}
                    fully consumed plate(s).
                  </p>

                </div>

                <button
                  type="button"
                  onClick={addFullyConsumedPiece}
                  className="rfc-btn-link"
                >
                  + Add Piece
                </button>

              </div>

              <div className="rfc-piece-list">

                {form.fullyConsumedPieces.map((piece, idx) => (

                  <div
                    key={piece.rowId}
                    className="rfc-piece-card"
                  >

                    <div className="rfc-piece-title">
                      Piece {idx + 1}
                    </div>

                    <div className="rfc-piece-grid">

                      <FormField
                        className="rfc-col-4"
                        label="Piece Code"
                        value={piece.pieceCode}
                        onChange={(v) =>
                          updateFullyConsumedPiece(
                            piece.rowId,
                            "pieceCode",
                            v
                          )
                        }
                      />

                      <FormField
                        className="rfc-col-3"
                        label="Drawing No"
                        value={piece.drawingNumber}
                        onChange={(v) =>
                          updateFullyConsumedPiece(
                            piece.rowId,
                            "drawingNumber",
                            v
                          )
                        }
                      />

                      <FormField
                        className="rfc-col-2"
                        label="Total Quantity"
                        type="number"
                        value={piece.quantity}
                        onChange={(v) =>
                          updateFullyConsumedPiece(
                            piece.rowId,
                            "quantity",
                            v
                          )
                        }
                      />

                      <FormField
                        className="rfc-col-2"
                        label="Weight (kg)"
                        type="number"
                        value={piece.weight}
                        onChange={(v) =>
                          updateFullyConsumedPiece(
                            piece.rowId,
                            "weight",
                            v
                          )
                        }
                      />

                      <div className="rfc-piece-action">

                        <button
                          type="button"
                          onClick={() =>
                            removeFullyConsumedPiece(piece.rowId)
                          }
                          disabled={
                            form.fullyConsumedPieces.length === 1
                          }
                          className="rfc-remove-btn"
                        >
                          ✕
                        </button>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          )}

{/* ===========================================
    Remaining Plates
=========================================== */}

{remainingCount > 0 && (

  <div className="rfc-remaining-section">

    <div className="rfc-section-header">

      <div>

        <h3 className="rfc-section-title">
          Remaining Plates — Detailed Entry ({remainingCount})
        </h3>

        <p className="rfc-section-subtitle">
          Enter complete details for every remaining plate individually.
        </p>

      </div>

    </div>

    {form.remainingPlates.map((plate, plateIdx) => (

      <div
        key={plate.id}
        className="rfc-remaining-card"
      >

        <div className="rfc-remaining-header">

          <span className="rfc-remaining-title">
            Remaining Plate {plateIdx + 1}
          </span>

        </div>

        <div className="rfc-plate-input">

          <FormField
            label="Plate Number"
            value={plate.plateNumber}
            onChange={(v) =>
              updateRemainingPlateField(
                plate.id,
                "plateNumber",
                v
              )
            }
          />

        </div>

        {/* Finished Pieces */}

        <div className="rfc-piece-section">

          <div className="rfc-section-header">

            <h4 className="rfc-subsection-title">
              Finished Pieces
            </h4>

            <button
              type="button"
              onClick={() => addRemainingPiece(plate.id)}
              className="rfc-btn-link"
            >
              + Add Piece
            </button>

          </div>

          <div className="rfc-piece-list">

            {plate.pieces.map((piece, idx) => (

              <div
                key={piece.rowId}
                className="rfc-piece-card"
              >

                <div className="rfc-piece-title">
                  Piece {idx + 1}
                </div>

                <div className="rfc-piece-grid">

                  <FormField
                    className="rfc-col-3"
                    label="Piece Code"
                    value={piece.pieceCode}
                    onChange={(v) =>
                      updateRemainingPiece(
                        plate.id,
                        piece.rowId,
                        "pieceCode",
                        v
                      )
                    }
                  />

                  <FormField
                    className="rfc-col-3"
                    label="Drawing Number"
                    value={piece.drawingNumber}
                    onChange={(v) =>
                      updateRemainingPiece(
                        plate.id,
                        piece.rowId,
                        "drawingNumber",
                        v
                      )
                    }
                  />

                  <FormField
                    className="rfc-col-1"
                    label="Length"
                    type="number"
                    value={piece.length}
                    onChange={(v) =>
                      updateRemainingPiece(
                        plate.id,
                        piece.rowId,
                        "length",
                        v
                      )
                    }
                  />

                  <FormField
                    className="rfc-col-1"
                    label="Width"
                    type="number"
                    value={piece.width}
                    onChange={(v) =>
                      updateRemainingPiece(
                        plate.id,
                        piece.rowId,
                        "width",
                        v
                      )
                    }
                  />

                  <FormField
                    className="rfc-col-1"
                    label="Qty"
                    type="number"
                    value={piece.quantity}
                    onChange={(v) =>
                      updateRemainingPiece(
                        plate.id,
                        piece.rowId,
                        "quantity",
                        v
                      )
                    }
                  />

                  <FormField
                    className="rfc-col-2"
                    label="Weight (kg)"
                    type="number"
                    value={piece.weight}
                    onChange={(v) =>
                      updateRemainingPiece(
                        plate.id,
                        piece.rowId,
                        "weight",
                        v
                      )
                    }
                  />

                  <div className="rfc-piece-action">

                    <button
                      type="button"
                      onClick={() =>
                        removeRemainingPiece(
                          plate.id,
                          piece.rowId
                        )
                      }
                      disabled={plate.pieces.length === 1}
                      className="rfc-remove-btn"
                      title="Remove Piece"
                    >
                      ✕
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

                  {/* ===========================================
                      Balance Plate
                  =========================================== */}

                  <div className="rfc-balance-section">

                    <h4 className="rfc-subsection-title">
                      Balance Plate
                    </h4>

                    <div className="rfc-balance-grid">

                      <FormField
                        label="Length"
                        type="number"
                        value={plate.remainingLength}
                        onChange={(v) =>
                          updateRemainingPlateField(
                            plate.id,
                            "remainingLength",
                            v
                          )
                        }
                      />

                      <FormField
                        label="Width"
                        type="number"
                        value={plate.remainingWidth}
                        onChange={(v) =>
                          updateRemainingPlateField(
                            plate.id,
                            "remainingWidth",
                            v
                          )
                        }
                      />

                      <FormField
                        label="Weight (kg)"
                        type="number"
                        value={plate.remainingWeight}
                        onChange={(v) =>
                          updateRemainingPlateField(
                            plate.id,
                            "remainingWeight",
                            v
                          )
                        }
                      />

                    </div>

                  </div>

                  {/* ===========================================
                      Scrap / Rejection
                  =========================================== */}

                  <div className="rfc-scrap-grid">

                    <FormField
                      className="rfc-col-4"
                      label="Scrap Weight (kg)"
                      type="number"
                      value={plate.scrapWeight}
                      onChange={(v) =>
                        updateRemainingPlateField(
                          plate.id,
                          "scrapWeight",
                          v
                        )
                      }
                    />

                    <FormField
                      className="rfc-col-4"
                      label="Rejected Quantity"
                      type="number"
                      value={plate.rejectedQty}
                      onChange={(v) =>
                        updateRemainingPlateField(
                          plate.id,
                          "rejectedQty",
                          v
                        )
                      }
                    />

                    <div className="rfc-col-12">

                      <label className="rfc-label">
                        Remarks
                      </label>

                      <textarea
                        rows={3}
                        value={plate.remarks}
                        onChange={(e) =>
                          updateRemainingPlateField(
                            plate.id,
                            "remarks",
                            e.target.value
                          )
                        }
                        className="rfc-textarea"
                      />

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

          {/* ===========================================
              Received By
          =========================================== */}

          <div className="rfc-received-section">

            <FormField
              className="rfc-received-input"
              label="Received By"
              value={form.receivedBy}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  receivedBy: v,
                }))
              }
            />

          </div>

          {/* ===========================================
              Error
          =========================================== */}

          {error && (

            <div className="rfc-error-box">

              {error}

            </div>

          )}

        </div>

      </div>

      {/* ===========================================
          Footer
      =========================================== */}

      <div className="rfc-modal-footer">

        <button
          type="button"
          onClick={closeModal}
          className="rfc-btn rfc-btn-secondary"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="rfc-btn rfc-btn-primary"
        >
          Save
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
    <div className="rfc-readonly-field">

      <label className="rfc-readonly-label">
        {label}
      </label>

      <div className="rfc-readonly-value">
        {value}
      </div>

    </div>
  );
}

function SummaryCard({ label, value, tone }) {

  const toneClass = {
    slate: "rfc-summary-slate",
    emerald: "rfc-summary-emerald",
    amber: "rfc-summary-amber",
  }[tone];

  return (
    <div className={`rfc-summary-card ${toneClass}`}>

      <div className="rfc-summary-label">
        {label}
      </div>

      <div className="rfc-summary-value">
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
    <div className={`rfc-form-group ${className}`}>

      <label className="rfc-label">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rfc-input"
      />

    </div>
  );
}