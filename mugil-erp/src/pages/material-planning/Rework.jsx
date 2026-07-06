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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Rework</h1>
        <p className="text-sm text-slate-500">
          Rejected material sent for repair — entries arrive only from the
          Rejection page.
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
        <Card label="Pending Rework" value={counts.pending} />
        <Card label="In Progress" value={counts.inProgress} />
        <Card label="Completed" value={counts.completed} />
        <Card label="Scrapped" value={counts.scrapped} />
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, reject ID, job, piece code…"
          className={`${inputClass} sm:w-64`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputClass} sm:w-44`}
        >
          <option value="All">All Statuses</option>
          {statusOptions.rework.map((s) => (
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
              <th className="px-4 py-3">Rework ID</th>
              <th className="px-4 py-3">Reject ID</th>
              <th className="px-4 py-3">Job Number</th>
              <th className="px-4 py-3">Piece Code</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => {
              const isPending = r.status === "Pending";
              const isInProgress = r.status === "In Progress";
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.id}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.rejectId}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.jobNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.pieceCode || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.material}</td>
                  <td className="px-4 py-3 text-slate-600">{r.grade}</td>
                  <td className="px-4 py-3 text-slate-900">{r.quantity}</td>
                  <td className="px-4 py-3 text-slate-600">{r.reason}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.assignedTo || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      text={r.status}
                      className={
                        STATUS_STYLES[r.status] || "bg-slate-100 text-slate-600"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {isPending && (
                        <button
                          onClick={() => openStart(r)}
                          className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          Start Rework
                        </button>
                      )}
                      {isInProgress && (
                        <>
                          <button
                            onClick={() => setCompleteTarget(r)}
                            className="rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Complete Rework
                          </button>
                          <button
                            onClick={() => setScrapTarget(r)}
                            className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            Scrap
                          </button>
                        </>
                      )}
                      {!isPending && !isInProgress && (
                        <span className="text-xs text-slate-400">
                          No actions
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
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  No rework records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Start Rework modal */}
      {startTarget && (
        <Modal title="Start Rework" onClose={() => setStartTarget(null)}>
          <p className="text-sm text-slate-600">
            Move{" "}
            <span className="font-medium text-slate-900">{startTarget.id}</span>{" "}
            ({startTarget.quantity} {startTarget.material}) into In Progress.
          </p>
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Assigned To
            </span>
            <input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="e.g. R. Kumar"
              className={inputClass}
            />
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setStartTarget(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Start Rework
            </button>
          </div>
        </Modal>
      )}

      {/* Complete Rework confirmation */}
      {completeTarget && (
        <Modal title="Complete Rework" onClose={() => setCompleteTarget(null)}>
          <p className="text-sm text-slate-600">
            Mark{" "}
            <span className="font-medium text-slate-900">
              {completeTarget.id}
            </span>{" "}
            as Completed and return {completeTarget.quantity}{" "}
            {completeTarget.material} piece(s) to Finished Pieces inventory?
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setCompleteTarget(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Complete Rework
            </button>
          </div>
        </Modal>
      )}

      {/* Scrap confirmation */}
      {scrapTarget && (
        <Modal title="Scrap Failed Rework" onClose={() => setScrapTarget(null)}>
          <p className="text-sm text-slate-600">
            Mark{" "}
            <span className="font-medium text-slate-900">{scrapTarget.id}</span>{" "}
            as Failed and move {scrapTarget.quantity} {scrapTarget.material}{" "}
            piece(s) to Scrap Inventory? This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setScrapTarget(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleScrap}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              Scrap
            </button>
          </div>
        </Modal>
      )}
    </div>
    </>
  );
}
