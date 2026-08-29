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
import Header from "../../components/Header";
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
    <div className="modal-overlay">
      <div
        className={`modal-content ${wide ? "modal-content-wide" : ""}`}
      >
        <div className="modal-header">

          <h2>{title}</h2>

          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close"
          >
            ✕
          </button>

        </div>

        <div className="modal-body">
          {children}
        </div>

      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="form-field">

      <span className="field-label">
        {label}
      </span>

      {children}

    </label>
  );
}



export default function Scrap() {

  const { scrapMaterials, purchaseOrders } = useMaterialStore();

  /* ---------------- Filters ---------------- */

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [materialFilter, setMaterialFilter] = useState("All");
  const [warehouseFilter, setWarehouseFilter] = useState("All");

  /* ---------------- Entry Modal ---------------- */

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);

  /* ---------------- View / Edit ---------------- */

  const [viewRecord, setViewRecord] = useState(null);

  const [editRecord, setEditRecord] = useState(null);

  const [editForm, setEditForm] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ---------------- Navigation ---------------- */

  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/inventory/material");
  };

  /* ---------------- Purchase Orders ---------------- */

  const eligiblePOs = useMemo(
    () =>
      purchaseOrders.filter(
        (po) => po.receivedQty > 0
      ),
    [purchaseOrders]
  );

  const selectedPO = useMemo(
    () =>
      eligiblePOs.find(
        (po) =>
          po.poNumber === entryForm.poNumber
      ) || null,
    [eligiblePOs, entryForm.poNumber]
  );

  /* ---------------- Dropdown Data ---------------- */

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(
          scrapMaterials
            .map((r) => r.department)
            .filter(Boolean)
        )
      ).sort(),
    [scrapMaterials]
  );

  const materialOptions = useMemo(
    () =>
      Array.from(
        new Set(
          scrapMaterials
            .map((r) => r.material)
            .filter(Boolean)
        )
      ).sort(),
    [scrapMaterials]
  );

  const warehouseOptions = useMemo(
    () =>
      Array.from(
        new Set(
          scrapMaterials
            .map((r) => r.warehouse)
            .filter(Boolean)
        )
      ).sort(),
    [scrapMaterials]
  );

  /* ---------------- Filtering ---------------- */

  const filtered = useMemo(() => {

    return scrapMaterials.filter((r) => {

      if (
        sourceFilter !== "All" &&
        r.source !== sourceFilter
      )
        return false;

      if (
        departmentFilter !== "All" &&
        r.department !== departmentFilter
      )
        return false;

      if (
        materialFilter !== "All" &&
        r.material !== materialFilter
      )
        return false;

      if (
        warehouseFilter !== "All" &&
        r.warehouse !== warehouseFilter
      )
        return false;

      if (search.trim()) {

        const needle =
          search.trim().toLowerCase();

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

        if (!haystack.includes(needle))
          return false;
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

  /* ---------------- KPI ---------------- */

  const totals = useMemo(() => {

    const sumBy = (predicate) =>
      scrapMaterials
        .filter(predicate)
        .reduce(
          (sum, item) =>
            sum +
            (Number(item.weight) || 0),
          0
        );

    return {

      total: sumBy(() => true),

      cutting: sumBy(
        (r) => r.source === "Cutting"
      ),

      manual: sumBy(
        (r) => r.source === "Manual"
      ),

      count: scrapMaterials.length,

    };

  }, [scrapMaterials]);

  /* ---------------- Handlers ---------------- */

  function openEntryModal() {

    setEntryForm(emptyEntryForm);

    setShowEntryModal(true);

  }

  function submitEntry(e) {

    e.preventDefault();

    if (
      !entryForm.poNumber ||
      !entryForm.weight
    )
      return;

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

      status:
        record.status || "Available",

    });

  }

  function submitEdit(e) {

    e.preventDefault();

    updateManualScrap(
      editRecord.id,
      editForm
    );

    setEditRecord(null);

    setEditForm(null);

  }

  function confirmDelete() {

    deleteManualScrap(deleteTarget.id);

    setDeleteTarget(null);

  }

  /* ================================================= */

return (
  <>
    <Header />

    <div className="scrap-page">

      {/* ==========================
          Header
      ========================== */}

      <div className="page-top">

        <div>

          <div className="page-breadcrumb">

            <span
              className="crumb-link"
              onClick={() => navigate("/inventory")}
            >
              Inventory
            </span>

            <span>/</span>

            <span
              className="crumb-link"
              onClick={() => navigate("/inventory/material")}
            >
              Material
            </span>

            <span>/</span>

            <span className="crumb-active">
              Scrap
            </span>

            

          </div>
<button
            className="back-btn"
            onClick={handleBack}
          >
            ← Back
          </button>
          <h1>
            Scrap Inventory
          </h1>

          <p>
            Manage all generated scrap and create manual scrap
            entries for production.
          </p>

        </div>

        <div className="page-actions">

          

          <button
            className="primary-btn"
            onClick={openEntryModal}
          >
            + New Scrap Entry
          </button>

        </div>

      </div>

      {/* ==========================
            KPI
      ========================== */}

      <div className="kpi-grid">

        <div className="kpi-card blue">

          <div className="kpi-title">
            Total Scrap
          </div>

          <div className="kpi-value">
            {fmtWeight(totals.total)}
          </div>

        </div>

        <div className="kpi-card green">

          <div className="kpi-title">
            Cutting Scrap
          </div>

          <div className="kpi-value">
            {fmtWeight(totals.cutting)}
          </div>

        </div>

        <div className="kpi-card purple">

          <div className="kpi-title">
            Manual Scrap
          </div>

          <div className="kpi-value">
            {fmtWeight(totals.manual)}
          </div>

        </div>

        <div className="kpi-card orange">

          <div className="kpi-title">
            Scrap Records
          </div>

          <div className="kpi-value">
            {totals.count}
          </div>

        </div>

      </div>

      {/* ==========================
            Filters
      ========================== */}

      <div className="filter-card">

        <div className="filter-header">

          <div>

            <h3>Filter Scrap Records</h3>

            <p>
              Quickly locate scrap entries using multiple filters.
            </p>

          </div>

          <div className="record-count">

            {filtered.length} Records

          </div>

        </div>

        <div className="filter-grid">

          <div className="filter-field">

            <label>Search</label>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, PO, Job, Material..."
            />

          </div>

          <div className="filter-field">

            <label>Source</label>

            <select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(e.target.value)
              }
            >
              <option value="All">
                All Sources
              </option>

              {statusOptions.scrapSource.map((s) => (

                <option
                  key={s}
                  value={s}
                >
                  {s}
                </option>

              ))}

            </select>

          </div>

          <div className="filter-field">

            <label>Department</label>

            <select
              value={departmentFilter}
              onChange={(e) =>
                setDepartmentFilter(e.target.value)
              }
            >

              <option value="All">
                All Departments
              </option>

              {departmentOptions.map((d) => (

                <option
                  key={d}
                  value={d}
                >
                  {d}
                </option>

              ))}

            </select>

          </div>

          <div className="filter-field">

            <label>Material</label>

            <select
              value={materialFilter}
              onChange={(e) =>
                setMaterialFilter(e.target.value)
              }
            >

              <option value="All">
                All Materials
              </option>

              {materialOptions.map((m) => (

                <option
                  key={m}
                  value={m}
                >
                  {m}
                </option>

              ))}

            </select>

          </div>

          <div className="filter-field">

            <label>Warehouse</label>

            <select
              value={warehouseFilter}
              onChange={(e) =>
                setWarehouseFilter(e.target.value)
              }
            >

              <option value="All">
                All Warehouses
              </option>

              {warehouseOptions.map((w) => (

                <option
                  key={w}
                  value={w}
                >
                  {w}
                </option>

              ))}

            </select>

          </div>

        </div>

      </div>

      {/* ==========================
            Scrap Table
      ========================== */}

      <div className="table-card">

        <div className="table-header">

          <div>

            <h3>Scrap Inventory</h3>

            <p>
              All cutting, manual, rejection and rework scrap records.
            </p>

          </div>

        </div>

        <div className="table-wrapper">

          <table className="scrap-table">

            <thead>

              <tr>

                <th>Scrap ID</th>
                <th>PO Number</th>
                <th>Job Number</th>
                <th>Material</th>
                <th>Grade</th>
                <th>Plate No.</th>
                <th>Weight</th>
                <th>Source</th>
                <th>Department</th>
                <th>Status</th>
                <th>Date</th>
                <th className="action-column">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.length > 0 ? (

                filtered.map((r) => (

                  <tr key={r.id}>

                    <td>

                      <span className="id-chip">

                        {r.id}

                      </span>

                    </td>

                    <td>{r.poNumber || "—"}</td>

                    <td>
                      {r.jobNumber || r.sourceJob || "—"}
                    </td>

                    <td>{r.material}</td>

                    <td>{r.grade}</td>

                    <td>{r.plateNumber || "—"}</td>

                    <td className="weight-cell">

                      {fmtWeight(r.weight)}

                    </td>

                    <td>

                      <Badge
                        text={r.source}
                        className={
                          SOURCE_STYLES[r.source] ||
                          "bg-slate-100 text-slate-600"
                        }
                      />

                    </td>

                    <td>

                      {r.department || "—"}

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

                      {r.date || "—"}

                    </td>

                    <td>

                      <div className="action-buttons">

                        {r.source === "Manual" ? (

                          <>

                            <button
                              className="edit-btn"
                              onClick={() => openEdit(r)}
                            >
                              Edit
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() =>
                                setDeleteTarget(r)
                              }
                            >
                              Delete
                            </button>

                          </>

                        ) : (

                          <button
                            className="view-btn"
                            onClick={() =>
                              setViewRecord(r)
                            }
                          >
                            View
                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={12}
                    className="empty-state"
                  >

                    <div className="empty-icon">

                      ♻️

                    </div>

                    <h4>
                      No Scrap Records Found
                    </h4>

                    <p>
                      No records match your current filters.
                    </p>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ==========================
            New Scrap Entry
      ========================== */}

      {showEntryModal && (

        <Modal
          title="New Scrap Entry"
          onClose={() => setShowEntryModal(false)}
          wide
        >

          <form
            className="scrap-form"
            onSubmit={submitEntry}
          >

            <div className="form-grid two-column">

              <Field label="PO Number">

                <select
                  required
                  value={entryForm.poNumber}
                  onChange={(e) =>
                    setEntryForm((f) => ({
                      ...f,
                      poNumber: e.target.value,
                    }))
                  }
                  
                >

                  <option value="">
                    Select PO Number
                  </option>

                  {eligiblePOs.map((po) => (

                    <option
                      key={po.poNumber}
                      value={po.poNumber}
                    >
                      {po.poNumber}
                    </option>

                  ))}

                </select>

              </Field>

              <Field label="Scrap Weight (kg)">

                <input
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  value={entryForm.weight}
                  onChange={(e) =>
                    setEntryForm((f) => ({
                      ...f,
                      weight: e.target.value,
                    }))
                  }
                  
                />

              </Field>

            </div>

            {selectedPO && (

              <div className="po-preview">

                <div className="info-card">
                  <span>Material</span>
                  <strong>{selectedPO.material}</strong>
                </div>

                <div className="info-card">
                  <span>Grade</span>
                  <strong>{selectedPO.grade}</strong>
                </div>

                <div className="info-card">
                  <span>Plate No.</span>
                  <strong>{selectedPO.plateNumber}</strong>
                </div>

                <div className="info-card">
                  <span>Heat No.</span>
                  <strong>{selectedPO.heatNumber}</strong>
                </div>

                <div className="info-card full-width">
                  <span>Warehouse</span>
                  <strong>{selectedPO.warehouse}</strong>
                </div>

              </div>

            )}

            <div className="form-grid two-column">

              <Field label="Department">

                <select
                  value={entryForm.department}
                  onChange={(e) =>
                    setEntryForm((f) => ({
                      ...f,
                      department: e.target.value,
                    }))
                  }
                  
                >

                  {DEPARTMENTS.map((d) => (

                    <option
                      key={d}
                      value={d}
                    >
                      {d}
                    </option>

                  ))}

                </select>

              </Field>

              <Field label="Reason">

                <input
                  value={entryForm.reason}
                  placeholder="Reason"
                  onChange={(e) =>
                    setEntryForm((f) => ({
                      ...f,
                      reason: e.target.value,
                    }))
                  }
                  
                />

              </Field>

            </div>

            <Field label="Remarks">

              <textarea
                rows={4}
                value={entryForm.remarks}
                onChange={(e) =>
                  setEntryForm((f) => ({
                    ...f,
                    remarks: e.target.value,
                  }))
                }
                
              />

            </Field>

            <div className="modal-footer">

              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  setShowEntryModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-btn"
                disabled={
                  !entryForm.poNumber ||
                  !entryForm.weight
                }
              >
                Save Scrap
              </button>

            </div>

          </form>

        </Modal>

      )}

      {/* ==========================================================
          View Scrap Record
      ========================================================== */}

      {viewRecord && (

        <Modal
          title={`Scrap Record • ${viewRecord.id}`}
          onClose={() => setViewRecord(null)}
          wide
        >

          <div className="locked-banner">

            <strong>Locked Record</strong>

            <span>
              This scrap was generated automatically from
              {` ${viewRecord.source}`} and cannot be modified.
            </span>

          </div>

          <div className="details-grid">

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
              ["Warehouse", viewRecord.warehouse],
              ["Reason", viewRecord.reason],
              ["Remarks", viewRecord.remarks],
              ["Status", viewRecord.status],
              ["Date", viewRecord.date],
            ].map(([label, value]) => (

              <div
                key={label}
                className="detail-card"
              >

                <span>{label}</span>

                <strong>
                  {value || "—"}
                </strong>

              </div>

            ))}

          </div>

        </Modal>

      )}

      {/* ==========================================================
          Edit Manual Scrap
      ========================================================== */}

      {editRecord && editForm && (

        <Modal
          title={`Edit Scrap • ${editRecord.id}`}
          onClose={() => {
            setEditRecord(null);
            setEditForm(null);
          }}
          wide
        >

          <form
            className="scrap-form"
            onSubmit={submitEdit}
          >

            <div className="po-preview">

              <div className="info-card">
                <span>PO Number</span>
                <strong>{editRecord.poNumber}</strong>
              </div>

              <div className="info-card">
                <span>Material</span>
                <strong>{editRecord.material}</strong>
              </div>

              <div className="info-card">
                <span>Grade</span>
                <strong>{editRecord.grade}</strong>
              </div>

              <div className="info-card">
                <span>Plate Number</span>
                <strong>
                  {editRecord.plateNumber || "—"}
                </strong>
              </div>

            </div>

            <div className="form-grid two-column">

              <Field label="Scrap Weight">

                <input
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  value={editForm.weight}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      weight: e.target.value,
                    }))
                  }
                  
                />

              </Field>

              <Field label="Department">

                <select
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      department: e.target.value,
                    }))
                  }
                  
                >

                  {DEPARTMENTS.map((d) => (

                    <option
                      key={d}
                      value={d}
                    >
                      {d}
                    </option>

                  ))}

                </select>

              </Field>

              <Field label="Reason">

                <input
                  value={editForm.reason}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      reason: e.target.value,
                    }))
                  }
                  
                />

              </Field>

              <Field label="Status">

                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      status: e.target.value,
                    }))
                  }
                  
                >

                  {statusOptions.scrap.map((s) => (

                    <option
                      key={s}
                      value={s}
                    >
                      {s}
                    </option>

                  ))}

                </select>

              </Field>

            </div>

            <Field label="Remarks">

              <textarea
                rows={4}
                value={editForm.remarks}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    remarks: e.target.value,
                  }))
                }
                
              />

            </Field>

            <div className="modal-footer">

              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setEditRecord(null);
                  setEditForm(null);
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-btn"
              >
                Save Changes
              </button>

            </div>

          </form>

        </Modal>

      )}

      {/* ==========================================================
          Delete Confirmation
      ========================================================== */}

      {deleteTarget && (

        <Modal
          title="Delete Scrap Record"
          onClose={() => setDeleteTarget(null)}
        >

          <div className="delete-dialog">

            <div className="delete-icon">

              🗑️

            </div>

            <h3>

              Delete this Scrap Record?

            </h3>

            <p>

              You are about to delete

              <strong> {deleteTarget.id} </strong>

              weighing

              <strong>
                {" "}
                {fmtWeight(deleteTarget.weight)}
              </strong>

              .

            </p>

            <p>

              This action cannot be undone.

            </p>

            <div className="modal-footer">

              <button
                className="cancel-btn"
                onClick={() =>
                  setDeleteTarget(null)
                }
              >
                Cancel
              </button>

              <button
                className="delete-btn-large"
                onClick={confirmDelete}
              >
                Delete

              </button>

            </div>

          </div>

        </Modal>

      )}

    </div>

  </>

);

}