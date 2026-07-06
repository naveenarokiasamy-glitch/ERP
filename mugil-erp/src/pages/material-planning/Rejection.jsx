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
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700",
  "Sent for Rework": "bg-purple-50 text-purple-700",
  "Converted to Scrap": "bg-slate-100 text-slate-600",
  Closed: "bg-emerald-50 text-emerald-700",
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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Rejection</h1>
        <p className="text-sm text-slate-500">
          Rejected pieces are created automatically from Receive From Cutting —
          process them below.
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Pending" value={counts.pending} />
        <Card label="Sent for Rework" value={counts.sentForRework} />
        <Card label="Converted to Scrap" value={counts.convertedToScrap} />
        <Card label="Closed" value={counts.closed} />
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, job, PO, piece code…"
          className={`${inputClass} sm:w-64`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputClass} sm:w-48`}
        >
          <option value="All">All Statuses</option>
          {statusOptions.rejectionStatus.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={materialFilter}
          onChange={(e) => setMaterialFilter(e.target.value)}
          className={`${inputClass} sm:w-44`}
        >
          <option value="All">All Materials</option>
          {materialOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Reject ID</th>
              <th className="px-4 py-3">Job Number</th>
              <th className="px-4 py-3">PO Number</th>
              <th className="px-4 py-3">Piece Code</th>
              <th className="px-4 py-3">Drawing Number</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => {
              const isPending = r.status === "Pending";
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.id}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.jobNumber || r.sourceJob || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.poNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.pieceCode || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.drawingNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.material}</td>
                  <td className="px-4 py-3 text-slate-600">{r.grade}</td>
                  <td className="px-4 py-3 text-slate-900">{r.quantity}</td>
                  <td className="px-4 py-3 text-slate-600">{r.reason}</td>
                  <td className="px-4 py-3">
                    <Badge
                      text={r.status}
                      className={
                        STATUS_STYLES[r.status] || "bg-slate-100 text-slate-600"
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.date || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setViewRecord(r)}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                      <button
                        disabled={!isPending}
                        onClick={() => setReworkTarget(r)}
                        className="rounded-md border border-purple-200 px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent"
                      >
                        Send For Rework
                      </button>
                      <button
                        disabled={!isPending}
                        onClick={() => setScrapTarget(r)}
                        className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent"
                      >
                        Convert To Scrap
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
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  No rejection records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      {viewRecord && (
        <Modal
          title={`Rejection ${viewRecord.id}`}
          onClose={() => setViewRecord(null)}
        >
          <div className="space-y-1 text-sm">
            {[
              ["Job Number", viewRecord.jobNumber || viewRecord.sourceJob],
              ["PO Number", viewRecord.poNumber],
              ["Piece Code", viewRecord.pieceCode],
              ["Drawing Number", viewRecord.drawingNumber],
              ["Material", viewRecord.material],
              ["Grade", viewRecord.grade],
              ["Plate Number", viewRecord.plateNumber],
              ["Qty", viewRecord.quantity],
              ["Reason", viewRecord.reason],
              ["Department", viewRecord.department],
              ["Status", viewRecord.status],
              ["Date", viewRecord.date],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between border-b border-slate-100 py-1.5 last:border-0"
              >
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-900">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Send For Rework confirmation */}
      {reworkTarget && (
        <Modal title="Send For Rework" onClose={() => setReworkTarget(null)}>
          <p className="text-sm text-slate-600">
            Move rejection{" "}
            <span className="font-medium text-slate-900">
              {reworkTarget.id}
            </span>{" "}
            ({reworkTarget.quantity} pcs, {reworkTarget.material}) into the
            Rework Inventory?
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setReworkTarget(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSendForRework}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Send For Rework
            </button>
          </div>
        </Modal>
      )}

      {/* Convert To Scrap confirmation */}
      {scrapTarget && (
        <Modal title="Convert To Scrap" onClose={() => setScrapTarget(null)}>
          <p className="text-sm text-slate-600">
            Convert rejection{" "}
            <span className="font-medium text-slate-900">{scrapTarget.id}</span>{" "}
            ({scrapTarget.quantity} pcs, {scrapTarget.material}) into a Scrap
            record? This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setScrapTarget(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConvertToScrap}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
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
