import { useState, useMemo } from "react";
import { useMaterialStore, receiveFromCutting } from "../../data/materialStore";
import "./Receivefromcutting.css";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
const badgeClass = (status) => {
  switch (status) {
    case "Open":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "Received":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
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

const navigate = useNavigate();
const handleBack = () => navigate("/inventory/material");

  return (
    <>
          <Header />
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Receive From Cutting
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Close open cutting jobs and record finished pieces, leftover
            balance, scrap and rejection — plate by plate.
          </p>
        </div>
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
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-left">
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Job Number</th>
              <th className="px-4 py-3 font-medium">PO Number</th>
              <th className="px-4 py-3 font-medium">Plate Number</th>
              <th className="px-4 py-3 font-medium">Heat Number</th>
              <th className="px-4 py-3 font-medium">Material</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Original Plate Size</th>
              <th className="px-4 py-3 font-medium">Issued Plate Qty</th>
              <th className="px-4 py-3 font-medium">Issue Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {openJobs.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No open jobs. Every job has been received.
                </td>
              </tr>
            )}
            {openJobs.map((job) => (
              <tr key={job.jobNumber} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${sourceBadgeClass(job.source)}`}
                  >
                    {job.source}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {job.jobNumber}
                </td>
                <td className="px-4 py-3 text-slate-600">{job.poNumber}</td>
                <td className="px-4 py-3 text-slate-600">{job.plateNumber}</td>
                <td className="px-4 py-3 text-slate-600">{job.heatNumber}</td>
                <td className="px-4 py-3 text-slate-600">{job.material}</td>
                <td className="px-4 py-3 text-slate-600">{job.grade}</td>
                <td className="px-4 py-3 text-slate-600">
                  {job.originalLength || "-"} x {job.originalWidth || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">{job.issuedQty}</td>
                <td className="px-4 py-3 text-slate-600">{job.issueDate}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass(job.status)}`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openModal(job)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    Receive
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeJob && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Fixed header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                Receive From Cutting — {activeJob.jobNumber}
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${sourceBadgeClass(activeJob.source)}`}
                >
                  {activeJob.source}
                </span>
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Readonly job details */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 rounded-lg p-4">
                <ReadonlyField label="Job Number" value={activeJob.jobNumber} />
                <ReadonlyField label="PO Number" value={activeJob.poNumber} />
                <ReadonlyField
                  label="Plate Number"
                  value={activeJob.plateNumber}
                />
                <ReadonlyField label="Material" value={activeJob.material} />
                <ReadonlyField label="Grade" value={activeJob.grade} />
                <ReadonlyField
                  label="Thickness"
                  value={
                    activeJob.thickness ? `${activeJob.thickness} mm` : "-"
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

              {/* Summary strip */}
              <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Total Issued Plates" value={issuedQty} tone="slate" />
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

              {/* Step 1: completely consumed plates */}
              <div className="bg-white ring-1 ring-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-1">
                  Step 1 — Completely Consumed Plates
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Out of the {issuedQty} issued plates, how many were
                  completely consumed (100% used)?
                </p>
                <div className="max-w-xs">
                  <FormField
                    label="Completely Consumed Plates"
                    type="number"
                    value={form.fullyConsumedCount}
                    onChange={handleFullyConsumedChange}
                  />
                </div>
              </div>

              {/* Fully consumed plates — aggregated output */}
              {fullyConsumedCount > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700">
                        Finished Piece Output — Fully Consumed Plates
                      </h3>
                      <p className="text-xs text-slate-500">
                        Total output from the {fullyConsumedCount} fully
                        consumed plate(s). No plate-wise detail needed.
                      </p>
                    </div>
                    <button
                      onClick={addFullyConsumedPiece}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      + Add Piece
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.fullyConsumedPieces.map((piece, idx) => (
                      <div
                        key={piece.rowId}
                        className="grid grid-cols-12 gap-2 items-end bg-white ring-1 ring-slate-200 rounded-lg p-3"
                      >
                        <div className="col-span-12 text-xs font-medium text-slate-500">
                          Piece {idx + 1}
                        </div>
                        <FormField
                          className="col-span-4"
                          label="Piece Code"
                          value={piece.pieceCode}
                          onChange={(v) =>
                            updateFullyConsumedPiece(piece.rowId, "pieceCode", v)
                          }
                        />
                        <FormField
                          className="col-span-3"
                          label="Drawing No"
                          value={piece.drawingNumber}
                          onChange={(v) =>
                            updateFullyConsumedPiece(
                              piece.rowId,
                              "drawingNumber",
                              v,
                            )
                          }
                        />
                        <FormField
                          className="col-span-2"
                          label="Total Quantity"
                          type="number"
                          value={piece.quantity}
                          onChange={(v) =>
                            updateFullyConsumedPiece(piece.rowId, "quantity", v)
                          }
                        />
                        <FormField
                          className="col-span-2"
                          label="Weight (kg)"
                          type="number"
                          value={piece.weight}
                          onChange={(v) =>
                            updateFullyConsumedPiece(piece.rowId, "weight", v)
                          }
                        />
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => removeFullyConsumedPiece(piece.rowId)}
                            disabled={form.fullyConsumedPieces.length === 1}
                            className="text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                            title="Remove piece"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remaining plates — full detail, dynamically generated */}
              {remainingCount > 0 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700">
                      Remaining Plates — Detailed Entry ({remainingCount})
                    </h3>
                    <p className="text-xs text-slate-500">
                      These plates still hold balance material. Enter details
                      for each one individually.
                    </p>
                  </div>

                  {form.remainingPlates.map((plate, plateIdx) => (
                    <div
                      key={plate.id}
                      className="bg-slate-50/60 ring-1 ring-slate-200 rounded-xl p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Remaining Plate {plateIdx + 1}
                        </span>
                      </div>

                      <div className="max-w-xs">
                        <FormField
                          label="Plate Number"
                          value={plate.plateNumber}
                          onChange={(v) =>
                            updateRemainingPlateField(plate.id, "plateNumber", v)
                          }
                        />
                      </div>

                      {/* Finished pieces for this plate */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-slate-600">
                            Finished Pieces
                          </h4>
                          <button
                            onClick={() => addRemainingPiece(plate.id)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            + Add Piece
                          </button>
                        </div>
                        <div className="space-y-2">
                          {plate.pieces.map((piece, idx) => (
                            <div
                              key={piece.rowId}
                              className="grid grid-cols-12 gap-2 items-end bg-white ring-1 ring-slate-200 rounded-lg p-3"
                            >
                              <div className="col-span-12 text-xs font-medium text-slate-500">
                                Piece {idx + 1}
                              </div>
                              <FormField
                                className="col-span-3"
                                label="Piece Code"
                                value={piece.pieceCode}
                                onChange={(v) =>
                                  updateRemainingPiece(
                                    plate.id,
                                    piece.rowId,
                                    "pieceCode",
                                    v,
                                  )
                                }
                              />
                              <FormField
                                className="col-span-3"
                                label="Drawing Number"
                                value={piece.drawingNumber}
                                onChange={(v) =>
                                  updateRemainingPiece(
                                    plate.id,
                                    piece.rowId,
                                    "drawingNumber",
                                    v,
                                  )
                                }
                              />
                              <FormField
                                className="col-span-1"
                                label="Length"
                                type="number"
                                value={piece.length}
                                onChange={(v) =>
                                  updateRemainingPiece(
                                    plate.id,
                                    piece.rowId,
                                    "length",
                                    v,
                                  )
                                }
                              />
                              <FormField
                                className="col-span-1"
                                label="Width"
                                type="number"
                                value={piece.width}
                                onChange={(v) =>
                                  updateRemainingPiece(
                                    plate.id,
                                    piece.rowId,
                                    "width",
                                    v,
                                  )
                                }
                              />
                              <FormField
                                className="col-span-1"
                                label="Qty"
                                type="number"
                                value={piece.quantity}
                                onChange={(v) =>
                                  updateRemainingPiece(
                                    plate.id,
                                    piece.rowId,
                                    "quantity",
                                    v,
                                  )
                                }
                              />
                              <FormField
                                className="col-span-2"
                                label="Weight (kg)"
                                type="number"
                                value={piece.weight}
                                onChange={(v) =>
                                  updateRemainingPiece(
                                    plate.id,
                                    piece.rowId,
                                    "weight",
                                    v,
                                  )
                                }
                              />
                              <div className="col-span-1 flex justify-end">
                                <button
                                  onClick={() =>
                                    removeRemainingPiece(plate.id, piece.rowId)
                                  }
                                  disabled={plate.pieces.length === 1}
                                  className="text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                                  title="Remove piece"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Balance plate for this plate */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-600 mb-2">
                          Balance Plate
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <FormField
                            label="Length"
                            type="number"
                            value={plate.remainingLength}
                            onChange={(v) =>
                              updateRemainingPlateField(
                                plate.id,
                                "remainingLength",
                                v,
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
                                v,
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
                                v,
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Scrap / rejection / remarks for this plate */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          label="Scrap Weight (kg)"
                          type="number"
                          value={plate.scrapWeight}
                          onChange={(v) =>
                            updateRemainingPlateField(plate.id, "scrapWeight", v)
                          }
                        />
                        <FormField
                          label="Rejected Quantity"
                          type="number"
                          value={plate.rejectedQty}
                          onChange={(v) =>
                            updateRemainingPlateField(plate.id, "rejectedQty", v)
                          }
                        />
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-slate-500 mb-1 block">
                            Remarks
                          </label>
                          <textarea
                            value={plate.remarks}
                            onChange={(e) =>
                              updateRemainingPlateField(
                                plate.id,
                                "remarks",
                                e.target.value,
                              )
                            }
                            rows={2}
                            className="w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Received By */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  className="col-span-2"
                  label="Received By"
                  value={form.receivedBy}
                  onChange={(v) => setForm((f) => ({ ...f, receivedBy: v }))}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 ring-1 ring-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>

            {/* Fixed footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0 bg-white rounded-b-xl">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
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
    <div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="text-sm text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneClass = {
    slate: "bg-slate-50 ring-slate-200 text-slate-700",
    emerald: "bg-emerald-50 ring-emerald-200 text-emerald-700",
    amber: "bg-amber-50 ring-amber-200 text-amber-700",
  }[tone];
  return (
    <div className={`rounded-xl ring-1 p-4 ${toneClass}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", className = "" }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-slate-500 mb-1 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg ring-1 ring-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}