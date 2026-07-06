import { useState } from "react";
import { useMaterialStore, issueToProduction } from "../../data/materialStore";
import "./issuetoprod.css";
import { useNavigate } from "react-router-dom"; // If using React Router
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
  const issuablePieces = finishedPieces.filter((p) => p.availableQty > 0);

  const [activePiece, setActivePiece] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");

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
        `Issue Qty cannot exceed Available Qty (${activePiece.availableQty}).`,
      );
      return;
    }
    if (
      !form.productionOrder.trim() ||
      !form.jobCard.trim() ||
      !form.issuedBy.trim()
    ) {
      setError("Production Order, Job Card and Issued By are required.");
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
  const navigate = useNavigate();
  const handleBack = () => {
    // Navigate back - adjust the path according to your routing structure
    navigate("/inventory/material"); // or navigate(-1) for browser back
  };

  return (
    <>
      <Header />
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Issue Material To Production
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Issue finished cut pieces to production. Raw plates are never shown
          here.
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

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-left">
              <th className="px-4 py-3 font-medium">Piece Code</th>
              <th className="px-4 py-3 font-medium">Drawing Number</th>
              <th className="px-4 py-3 font-medium">Job Number</th>
              <th className="px-4 py-3 font-medium">Material</th>
              <th className="px-4 py-3 font-medium">Length</th>
              <th className="px-4 py-3 font-medium">Width</th>
              <th className="px-4 py-3 font-medium">Qty Available</th>
              <th className="px-4 py-3 font-medium">Weight</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {issuablePieces.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No finished pieces available. Receive a cutting job first.
                </td>
              </tr>
            )}
            {issuablePieces.map((piece) => (
              <tr key={piece.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {piece.pieceCode}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {piece.drawingNumber}
                </td>
                <td className="px-4 py-3 text-slate-600">{piece.jobNumber}</td>
                <td className="px-4 py-3 text-slate-600">{piece.material}</td>
                <td className="px-4 py-3 text-slate-600">{piece.length}</td>
                <td className="px-4 py-3 text-slate-600">{piece.width}</td>
                <td className="px-4 py-3 text-slate-600">
                  {piece.availableQty}
                </td>
                <td className="px-4 py-3 text-slate-600">{piece.weight} kg</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass(piece.status)}`}
                  >
                    {piece.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openModal(piece)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    Issue
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activePiece && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Issue To Production — {activePiece.pieceCode}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <ReadonlyField
                  label="Piece Code"
                  value={activePiece.pieceCode}
                />
                <ReadonlyField
                  label="Drawing"
                  value={activePiece.drawingNumber}
                />
                <ReadonlyField
                  label="Job Number"
                  value={activePiece.jobNumber}
                />
                <ReadonlyField
                  label="Available Qty"
                  value={activePiece.availableQty}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Production Order"
                  value={form.productionOrder}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, productionOrder: v }))
                  }
                />
                <FormField
                  label="Job Card"
                  value={form.jobCard}
                  onChange={(v) => setForm((f) => ({ ...f, jobCard: v }))}
                />
                <FormField
                  label="Department"
                  value={form.department}
                  onChange={(v) => setForm((f) => ({ ...f, department: v }))}
                />
                <FormField
                  label="Issue Qty"
                  type="number"
                  value={form.issueQty}
                  onChange={(v) => setForm((f) => ({ ...f, issueQty: v }))}
                />
                <FormField
                  className="col-span-2"
                  label="Issued By"
                  value={form.issuedBy}
                  onChange={(v) => setForm((f) => ({ ...f, issuedBy: v }))}
                />
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    Remarks
                  </label>
                  <textarea
                    value={form.remarks}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, remarks: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 ring-1 ring-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
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
