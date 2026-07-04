// Scrap.jsx
// -----------------------------------------------------------------------------
// Scrap page = Scrap Inventory + Manual Scrap Entry, connected to the shared
// materialStore. Cutting Scrap and Rejection/Rework-sourced Scrap are
// auto-generated and locked (View only) to protect material traceability.
// Manual Scrap is entered here directly and is fully editable/deletable.
// -----------------------------------------------------------------------------

import { useMemo, useState } from "react";
import {
  useMaterialStore,
  createManualScrap,
  updateManualScrap,
  deleteManualScrap,
  statusOptions,
} from "../../data/materialStore";
import "./Scrap.css";
import { useNavigate } from "react-router-dom";
const emptyEntryForm = {
  poNumber: "",
  weight: "",
  department: "Production",
  reason: "",
  remarks: "",
};

const DEPARTMENTS = [
  "Production",
  "Fabrication",
  "Welding",
  "Machining",
  "Handling",
  "Other",
];

const SOURCE_STYLES = {
  Cutting: "bg-slate-100 text-slate-700 ring-1 ring-slate-300",
  Manual: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  Rejection: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Rework: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
};

const STATUS_STYLES = {
  Available: "bg-emerald-50 text-emerald-700",
  Sold: "bg-slate-100 text-slate-600",
  Disposed: "bg-rose-50 text-rose-700",
};

function fmtWeight(w) {
  const n = Number(w) || 0;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`;
}

function Card({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold ${accent || "text-slate-900"}`}
      >
        {value}
      </p>
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

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-xl bg-white shadow-xl`}
      >
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
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function Scrap() {
  const { scrapMaterials, purchaseOrders } = useMaterialStore();

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [materialFilter, setMaterialFilter] = useState("All");
  const [warehouseFilter, setWarehouseFilter] = useState("All");

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);

  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Only POs that have actually received material can be scrapped against.
  const eligiblePOs = useMemo(
    () => purchaseOrders.filter((po) => po.receivedQty > 0),
    [purchaseOrders],
  );
  const selectedPO = useMemo(
    () => eligiblePOs.find((po) => po.poNumber === entryForm.poNumber) || null,
    [eligiblePOs, entryForm.poNumber],
  );

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(scrapMaterials.map((r) => r.department).filter(Boolean)),
      ).sort(),
    [scrapMaterials],
  );
  const materialOptions = useMemo(
    () =>
      Array.from(
        new Set(scrapMaterials.map((r) => r.material).filter(Boolean)),
      ).sort(),
    [scrapMaterials],
  );
  const warehouseOptions = useMemo(
    () =>
      Array.from(
        new Set(scrapMaterials.map((r) => r.warehouse).filter(Boolean)),
      ).sort(),
    [scrapMaterials],
  );

  const filtered = useMemo(() => {
    return scrapMaterials.filter((r) => {
      if (sourceFilter !== "All" && r.source !== sourceFilter) return false;
      if (departmentFilter !== "All" && r.department !== departmentFilter)
        return false;
      if (materialFilter !== "All" && r.material !== materialFilter)
        return false;
      if (warehouseFilter !== "All" && r.warehouse !== warehouseFilter)
        return false;
      if (search.trim()) {
        const needle = search.trim().toLowerCase();
        const haystack = [
          r.id,
          r.poNumber,
          r.jobNumber,
          r.material,
          r.grade,
          r.plateNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [
    scrapMaterials,
    sourceFilter,
    departmentFilter,
    materialFilter,
    warehouseFilter,
    search,
  ]);

  const totals = useMemo(() => {
    const sumBy = (pred) =>
      scrapMaterials
        .filter(pred)
        .reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
    return {
      total: sumBy(() => true),
      cutting: sumBy((r) => r.source === "Cutting"),
      manual: sumBy((r) => r.source === "Manual"),
      count: scrapMaterials.length,
    };
  }, [scrapMaterials]);

  function openEntryModal() {
    setEntryForm(emptyEntryForm);
    setShowEntryModal(true);
  }

  function submitEntry(e) {
    e.preventDefault();
    if (!entryForm.poNumber || !entryForm.weight) return;
    createManualScrap({
      poNumber: entryForm.poNumber,
      weight: entryForm.weight,
      department: entryForm.department,
      reason: entryForm.reason,
      remarks: entryForm.remarks,
    });
    setShowEntryModal(false);
    setEntryForm(emptyEntryForm);
  }

  function openEdit(record) {
    setEditRecord(record);
    setEditForm({
      weight: record.weight,
      department: record.department || "",
      reason: record.reason || "",
      remarks: record.remarks || "",
      status: record.status || "Available",
    });
  }

  function submitEdit(e) {
    e.preventDefault();
    updateManualScrap(editRecord.id, editForm);
    setEditRecord(null);
    setEditForm(null);
  }

  function confirmDelete() {
    deleteManualScrap(deleteTarget.id);
    setDeleteTarget(null);
  }
const navigate = useNavigate();
const handleBack = () => navigate("/inventory/material");
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Scrap</h1>
          <p className="text-sm text-slate-500">
            Scrap inventory and manual scrap entry
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
        <button
          onClick={openEntryModal}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + New Scrap Entry
        </button>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Total Scrap Weight" value={fmtWeight(totals.total)} />
        <Card
          label="Cutting Scrap Weight"
          value={fmtWeight(totals.cutting)}
          accent="text-slate-700"
        />
        <Card
          label="Manual Scrap Weight"
          value={fmtWeight(totals.manual)}
          accent="text-blue-700"
        />
        <Card label="Total Scrap Records" value={totals.count} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, PO, job, material, plate…"
          className={`${inputClass} sm:w-64`}
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className={`${inputClass} sm:w-40`}
        >
          <option value="All">All Sources</option>
          {statusOptions.scrapSource.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className={`${inputClass} sm:w-44`}
        >
          <option value="All">All Departments</option>
          {departmentOptions.map((d) => (
            <option key={d} value={d}>
              {d}
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
        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className={`${inputClass} sm:w-52`}
        >
          <option value="All">All Warehouses</option>
          {warehouseOptions.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Scrap ID</th>
              <th className="px-4 py-3">PO Number</th>
              <th className="px-4 py-3">Job Number</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Plate Number</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{r.id}</td>
                <td className="px-4 py-3 text-slate-600">
                  {r.poNumber || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {r.jobNumber || r.sourceJob || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.material}</td>
                <td className="px-4 py-3 text-slate-600">{r.grade}</td>
                <td className="px-4 py-3 text-slate-600">
                  {r.plateNumber || "—"}
                </td>
                <td className="px-4 py-3 text-slate-900">
                  {fmtWeight(r.weight)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    text={r.source}
                    className={
                      SOURCE_STYLES[r.source] || "bg-slate-100 text-slate-600"
                    }
                  />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {r.department || "—"}
                </td>
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
                    {r.source === "Manual" ? (
                      <>
                        <button
                          onClick={() => openEdit(r)}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setViewRecord(r)}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  No scrap records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Scrap Entry modal */}
      {showEntryModal && (
        <Modal title="New Scrap Entry" onClose={() => setShowEntryModal(false)}>
          <form className="space-y-4" onSubmit={submitEntry}>
            <Field label="PO Number">
              <select
                required
                value={entryForm.poNumber}
                onChange={(e) =>
                  setEntryForm((f) => ({ ...f, poNumber: e.target.value }))
                }
                className={inputClass}
              >
                <option value="">Select a PO Number…</option>
                {eligiblePOs.map((po) => (
                  <option key={po.poNumber} value={po.poNumber}>
                    {po.poNumber}
                  </option>
                ))}
              </select>
            </Field>

            {selectedPO && (
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <div>
                  <span className="text-slate-500">Material: </span>
                  {selectedPO.material}
                </div>
                <div>
                  <span className="text-slate-500">Grade: </span>
                  {selectedPO.grade}
                </div>
                <div>
                  <span className="text-slate-500">Plate Number: </span>
                  {selectedPO.plateNumber}
                </div>
                <div>
                  <span className="text-slate-500">Heat Number: </span>
                  {selectedPO.heatNumber}
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Warehouse: </span>
                  {selectedPO.warehouse}
                </div>
              </div>
            )}

            <Field label="Scrap Weight (kg)">
              <input
                required
                type="number"
                min="0"
                step="0.1"
                value={entryForm.weight}
                onChange={(e) =>
                  setEntryForm((f) => ({ ...f, weight: e.target.value }))
                }
                className={inputClass}
              />
            </Field>

            <Field label="Department">
              <select
                value={entryForm.department}
                onChange={(e) =>
                  setEntryForm((f) => ({ ...f, department: e.target.value }))
                }
                className={inputClass}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Reason">
              <input
                value={entryForm.reason}
                onChange={(e) =>
                  setEntryForm((f) => ({ ...f, reason: e.target.value }))
                }
                placeholder="e.g. Handling Damage"
                className={inputClass}
              />
            </Field>

            <Field label="Remarks">
              <textarea
                rows={3}
                value={entryForm.remarks}
                onChange={(e) =>
                  setEntryForm((f) => ({ ...f, remarks: e.target.value }))
                }
                className={inputClass}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEntryModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!entryForm.poNumber || !entryForm.weight}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View modal (Cutting / Rejection / Rework — locked) */}
      {viewRecord && (
        <Modal
          title={`Scrap ${viewRecord.id}`}
          onClose={() => setViewRecord(null)}
        >
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
              This record was generated automatically ({viewRecord.source}) and
              is locked to preserve material traceability. It cannot be edited.
            </div>
            {[
              ["PO Number", viewRecord.poNumber],
              ["Job Number", viewRecord.jobNumber || viewRecord.sourceJob],
              ["Material", viewRecord.material],
              ["Grade", viewRecord.grade],
              ["Plate Number", viewRecord.plateNumber],
              ["Heat Number", viewRecord.heatNumber],
              ["Weight", fmtWeight(viewRecord.weight)],
              ["Source", viewRecord.source],
              ["Department", viewRecord.department],
              ["Reason", viewRecord.reason],
              ["Remarks", viewRecord.remarks],
              ["Warehouse", viewRecord.warehouse],
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

      {/* Edit modal (Manual only) */}
      {editRecord && editForm && (
        <Modal
          title={`Edit Scrap ${editRecord.id}`}
          onClose={() => {
            setEditRecord(null);
            setEditForm(null);
          }}
        >
          <form className="space-y-4" onSubmit={submitEdit}>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              <div>
                <span className="text-slate-500">PO Number: </span>
                {editRecord.poNumber}
              </div>
              <div>
                <span className="text-slate-500">Material: </span>
                {editRecord.material}
              </div>
              <div>
                <span className="text-slate-500">Grade: </span>
                {editRecord.grade}
              </div>
              <div>
                <span className="text-slate-500">Plate Number: </span>
                {editRecord.plateNumber || "—"}
              </div>
            </div>

            <Field label="Scrap Weight (kg)">
              <input
                required
                type="number"
                min="0"
                step="0.1"
                value={editForm.weight}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, weight: e.target.value }))
                }
                className={inputClass}
              />
            </Field>

            <Field label="Department">
              <select
                value={editForm.department}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, department: e.target.value }))
                }
                className={inputClass}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Reason">
              <input
                value={editForm.reason}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, reason: e.target.value }))
                }
                className={inputClass}
              />
            </Field>

            <Field label="Remarks">
              <textarea
                rows={3}
                value={editForm.remarks}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, remarks: e.target.value }))
                }
                className={inputClass}
              />
            </Field>

            <Field label="Status">
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, status: e.target.value }))
                }
                className={inputClass}
              >
                {statusOptions.scrap.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditRecord(null);
                  setEditForm(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation (Manual only) */}
      {deleteTarget && (
        <Modal
          title="Delete Scrap Record"
          onClose={() => setDeleteTarget(null)}
        >
          <p className="text-sm text-slate-600">
            Delete manual scrap record{" "}
            <span className="font-medium text-slate-900">
              {deleteTarget.id}
            </span>{" "}
            ({fmtWeight(deleteTarget.weight)})? This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
