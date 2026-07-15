import { useEffect, useState } from "react";
import VendorDetails from "../../components/VendorDetails";
import OrderItemsTable, {
  createDefaultColumns,
} from "../../components/OrderItemsTable";
import AmountSummary from "../../components/AmountSummary";
import TermsEditor from "../../components/TermsEditor";
import PurchaseOrderPreview from "./PurchaseOrderPreview";
import { initialPOData } from "../../utils/initialData";
import { summarizePOItems } from "../../utils/calculations";
import "./PurchaseOrder.css";
import "../../styles/form.css";
import "../../styles/print.css";

const DRAFT_KEY = "mei-erp-po-draft";
const DRAFT_VERSION = 2;

const toCamelId = (label) => {
  const cleaned = label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();
  if (!cleaned) return "column";
  return cleaned
    .split(" ")
    .map((word, i) =>
      i === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
};

const makeUniqueColumnId = (label, existingColumns) => {
  const base = toCamelId(label);
  const ids = new Set(existingColumns.map((c) => c.id));
  if (!ids.has(base)) return base;
  let n = 2;
  while (ids.has(`${base}${n}`)) n += 1;
  return `${base}${n}`;
};

export default function PurchaseOrderForm() {
  const [view, setView] = useState("form");
  const [data, setData] = useState(initialPOData);
  const [errors, setErrors] = useState({});
  const [savedAt, setSavedAt] = useState(null);

  const [columns, setColumns] = useState(() => createDefaultColumns("po"));
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColLabel, setNewColLabel] = useState("");
  const [newColType, setNewColType] = useState("text");
  const [newColOptions, setNewColOptions] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.__version === DRAFT_VERSION && parsed.data) {
          setData(parsed.data);
          setColumns(
            parsed.columns && parsed.columns.length
              ? parsed.columns
              : createDefaultColumns("po"),
          );
        } else {
          setData(parsed);
        }
      } catch {
        // ignore corrupt draft
      }
    }
  }, []);

  const set = (key, value) => setData((d) => ({ ...d, [key]: value }));
  const setNested = (group, key, value) =>
    setData((d) => ({ ...d, [group]: { ...d[group], [key]: value } }));

  // Simple summary that just aggregates what user entered - no calculations
  const summary = {
    subtotal: data.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0),
    totalGst: data.gstAmount ? parseFloat(data.gstAmount) || 0 : 0,
    grandTotal: data.grandTotal ? parseFloat(data.grandTotal) || 0 : 0,
    interState: data.interState,
  };

  const validate = () => {
    const next = {};
    if (!data.poNumber.trim()) next.poNumber = "PO Number is required";
    if (!data.poDate) next.poDate = "PO Date is required";
    if (!data.vendor.companyName.trim())
      next.vendorCompany = "Vendor company name is required";
    const hasItem = data.items.some(
      (it) => it.description.trim() && Number(it.qty) > 0,
    );
    if (!hasItem)
      next.items = "Add at least one item with a description and quantity";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveDraft = () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ __version: DRAFT_VERSION, data, columns }),
    );
    setSavedAt(new Date());
  };

  const clearForm = () => {
    if (!window.confirm("Clear all fields and start a new Purchase Order?"))
      return;
    localStorage.removeItem(DRAFT_KEY);
    setData(initialPOData());
    setColumns(createDefaultColumns("po"));
    setErrors({});
    setSavedAt(null);
  };

  const goToPreview = () => {
    if (!validate()) return;
    saveDraft();
    setView("preview");
  };

  const handleAddColumn = () => {
    const label = newColLabel.trim();
    if (!label) return;
    const id = makeUniqueColumnId(label, columns);
    const options =
      newColType === "dropdown"
        ? newColOptions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newColumn = {
      id,
      label,
      type: newColType,
      visible: true,
      custom: true,
      removable: true,
      hideable: true,
      movable: true,
      system: false,
      ...(options ? { options } : {}),
    };

    setColumns((cols) => {
      const systemIdx = cols.findIndex((c) => c.system);
      const insertAt = systemIdx === -1 ? cols.length : systemIdx;
      const next = [...cols];
      next.splice(insertAt, 0, newColumn);
      return next;
    });

    setData((d) => ({
      ...d,
      items: d.items.map((it) => ({ ...it, [id]: "" })),
    }));

    setNewColLabel("");
    setNewColType("text");
    setNewColOptions("");
  };

  const handleRenameColumn = (column) => {
    const next = window.prompt(
      `Rename column "${column.label}" to:`,
      column.label,
    );
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) return;
    setColumns((cols) =>
      cols.map((c) => (c.id === column.id ? { ...c, label: trimmed } : c)),
    );
  };

  const handleDeleteColumn = (column) => {
    if (column.removable === false) return;
    if (
      !window.confirm(
        `Delete the "${column.label}" column? This removes its data from every row.`,
      )
    )
      return;
    setColumns((cols) => cols.filter((c) => c.id !== column.id));
    setData((d) => ({
      ...d,
      items: d.items.map((it) => {
        const { [column.id]: _removed, ...rest } = it;
        return rest;
      }),
    }));
  };

  const handleMoveColumn = (column, direction) => {
    if (column.movable === false) return;
    setColumns((cols) => {
      const idx = cols.findIndex((c) => c.id === column.id);
      if (idx === -1) return cols;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= cols.length) return cols;
      if (cols[target].movable === false) return cols;
      const next = [...cols];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleToggleColumnVisibility = (column) => {
    if (column.hideable === false) return;
    setColumns((cols) =>
      cols.map((c) => (c.id === column.id ? { ...c, visible: !c.visible } : c)),
    );
  };

  if (view === "preview") {
    return (
      <PurchaseOrderPreview
        data={data}
        summary={summary}
        onBack={() => setView("form")}
        columns={columns}
      />
    );
  }

  return (
    <div className="form-page">
      <div className="form-page__header">
        <div className="form-page__heading">
          <h1>Purchase Order</h1>
          <p>Fill in the details below, then preview the official document.</p>
        </div>
        <div className="form-page__actions">
          <button className="btn btn-ghost" onClick={clearForm}>
            Clear
          </button>
          <button className="btn btn-secondary" onClick={saveDraft}>
            Save Draft
          </button>
          <button className="btn btn-primary" onClick={goToPreview}>
            Preview →
          </button>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="validation-banner">
          Please fix the highlighted fields before previewing:{" "}
          {Object.values(errors).join(" · ")}
        </div>
      )}

      {/* 1. Purchase Details */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">1</span> Purchase Details
        </h3>
        <div className="field-grid">
          <label className="field">
            <span className="field__label">
              PO Number<span className="field__required">*</span>
            </span>
            <input
              className={`field__input ${errors.poNumber ? "has-error" : ""}`}
              value={data.poNumber}
              onChange={(e) => set("poNumber", e.target.value)}
              placeholder="e.g. PO/2026/0142"
            />
          </label>
          <label className="field">
            <span className="field__label">
              PO Date<span className="field__required">*</span>
            </span>
            <input
              type="date"
              className={`field__input ${errors.poDate ? "has-error" : ""}`}
              value={data.poDate}
              onChange={(e) => set("poDate", e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Reference Quotation Number</span>
            <input
              className="field__input"
              value={data.refQuoteNumber}
              onChange={(e) => set("refQuoteNumber", e.target.value)}
              placeholder="e.g. CS-QT/1544 R4/25-26"
            />
          </label>
          <label className="field">
            <span className="field__label">Reference Date</span>
            <input
              type="date"
              className="field__input"
              value={data.refDate}
              onChange={(e) => set("refDate", e.target.value)}
            />
          </label>
          <label className="field field--wide">
            <span className="field__label">Subject</span>
            <input
              className="field__input"
              value={data.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="e.g. Purchase Order for 5 Ton Single Girder EOT Crane"
            />
          </label>
          <label className="field">
            <span className="field__label">Prepared By</span>
            <input
              className="field__input"
              value={data.preparedBy}
              onChange={(e) => set("preparedBy", e.target.value)}
              placeholder="Employee name"
            />
          </label>
        </div>
      </section>

      {/* 2. Vendor Details */}
      <VendorDetails
        mode="form"
        vendor={data.vendor}
        onChange={(v) => set("vendor", v)}
      />

      {/* 3. Intro Paragraph */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">3</span> Intro Paragraph
        </h3>
        <label className="field">
          <textarea
            className="field__textarea"
            value={data.introText}
            onChange={(e) => set("introText", e.target.value)}
          />
        </label>
      </section>

      {/* 4. Order Items */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">4</span> Order Items
          <span className="form-card__hint">
            Enter item details with Amount (₹)
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm manage-columns-btn"
            onClick={() => setShowColumnModal(true)}
          >
            ⚙ Manage Columns
          </button>
        </h3>
        <OrderItemsTable
          variant="po"
          mode="form"
          items={data.items}
          onChange={(items) => set("items", items)}
          columns={columns}
        />
      </section>

      {/* 5. Amount Summary - User editable */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">5</span> Amount Summary
        </h3>
        <div className="field-grid">
          <label className="field">
            <span className="field__label">Total Amount (₹)</span>
            <input
              type="number"
              className="field__input"
              value={data.grandTotal || ""}
              onChange={(e) => set("grandTotal", e.target.value)}
              placeholder="Enter total amount"
            />
          </label>
          <label className="field">
            <span className="field__label">GST %</span>
            <input
              type="number"
              className="field__input"
              value={data.gstPercent || ""}
              onChange={(e) => set("gstPercent", e.target.value)}
              placeholder="e.g. 18"
            />
          </label>
          <label className="field">
            <span className="field__label">GST Amount (₹)</span>
            <input
              type="number"
              className="field__input"
              value={data.gstAmount || ""}
              onChange={(e) => set("gstAmount", e.target.value)}
              placeholder="Enter GST amount"
            />
          </label>
          <label className="field">
            <span className="field__label">Final Total (₹)</span>
            <input
              type="number"
              className="field__input"
              value={data.finalTotal || ""}
              onChange={(e) => set("finalTotal", e.target.value)}
              placeholder="Enter final total"
            />
          </label>
        </div>
      </section>

      {/* 6. Delivery Details */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">6</span> Delivery Details
        </h3>
        <div className="field-grid">
          <label className="field field--wide">
            <span className="field__label">Delivery Address</span>
            <input
              className="field__input"
              value={data.delivery.address}
              onChange={(e) => setNested("delivery", "address", e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Delivery Date</span>
            <input
              type="date"
              className="field__input"
              value={data.delivery.date}
              onChange={(e) => setNested("delivery", "date", e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Mode of Transport</span>
            <input
              className="field__input"
              value={data.delivery.mode}
              onChange={(e) => setNested("delivery", "mode", e.target.value)}
              placeholder="e.g. By Road / Courier"
            />
          </label>
          <label className="field">
            <span className="field__label">Expected Delivery</span>
            <input
              className="field__input"
              value={data.delivery.expectedDelivery}
              onChange={(e) =>
                setNested("delivery", "expectedDelivery", e.target.value)
              }
              placeholder="e.g. 4-6 weeks"
            />
          </label>
        </div>
      </section>

      {/* 7. Payment Details */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">7</span> Payment Details
        </h3>
        <div className="field-grid">
          <label className="field">
            <span className="field__label">Payment Terms</span>
            <input
              className="field__input"
              value={data.payment.terms}
              onChange={(e) => setNested("payment", "terms", e.target.value)}
              placeholder="e.g. 80% advance, 20% before dispatch"
            />
          </label>
          <label className="field">
            <span className="field__label">Advance %</span>
            <input
              type="number"
              className="field__input"
              value={data.payment.advancePercent}
              onChange={(e) =>
                setNested("payment", "advancePercent", e.target.value)
              }
            />
          </label>
          <label className="field">
            <span className="field__label">Credit Days</span>
            <input
              type="number"
              className="field__input"
              value={data.payment.creditDays}
              onChange={(e) =>
                setNested("payment", "creditDays", e.target.value)
              }
            />
          </label>
          <label className="field field--wide">
            <span className="field__label">Bank Details</span>
            <input
              className="field__input"
              value={data.payment.bankDetails}
              onChange={(e) =>
                setNested("payment", "bankDetails", e.target.value)
              }
              placeholder="Bank name, A/c no., IFSC"
            />
          </label>
        </div>
      </section>

      {/* 8. Terms & Conditions */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">8</span> Terms &amp; Conditions
        </h3>
        <TermsEditor
          mode="form"
          terms={data.terms}
          onChange={(t) => set("terms", t)}
        />
      </section>

      {/* 9. Notes */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">9</span> Notes
        </h3>
        <textarea
          className="field__textarea field__textarea--lg"
          value={data.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional notes for this order..."
        />
      </section>

      {/* 10. Signature */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">10</span> Signature
        </h3>
        <div className="field-grid field-grid--tight">
          <label className="field">
            <span className="field__label">Prepared By</span>
            <input
              className="field__input"
              value={data.signatures.preparedBy}
              onChange={(e) =>
                setNested("signatures", "preparedBy", e.target.value)
              }
            />
          </label>
          <label className="field">
            <span className="field__label">Checked By</span>
            <input
              className="field__input"
              value={data.signatures.checkedBy}
              onChange={(e) =>
                setNested("signatures", "checkedBy", e.target.value)
              }
            />
          </label>
          <label className="field">
            <span className="field__label">Approved By</span>
            <input
              className="field__input"
              value={data.signatures.approvedBy}
              onChange={(e) =>
                setNested("signatures", "approvedBy", e.target.value)
              }
            />
          </label>
        </div>
      </section>

      <div className="sticky-actionbar">
        <span className="sticky-actionbar__status">
          {savedAt
            ? `Draft saved at ${savedAt.toLocaleTimeString()}`
            : "Not saved yet"}
        </span>
        <button className="btn btn-ghost" onClick={clearForm}>
          Clear
        </button>
        <button className="btn btn-secondary" onClick={saveDraft}>
          Save Draft
        </button>
        <button className="btn btn-primary" onClick={goToPreview}>
          Preview →
        </button>
      </div>

      {/* Manage Columns modal */}
      {showColumnModal && (
        <div
          className="mc-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowColumnModal(false)}
        >
          <div className="mc-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mc-panel__header">
              <h3>Manage Columns</h3>
              <button
                type="button"
                className="icon-btn"
                title="Close"
                onClick={() => setShowColumnModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="mc-panel__body">
              <ul className="mc-list">
                {columns.map((c, idx) => (
                  <li
                    key={c.id}
                    className={`mc-list__row${c.visible === false ? " mc-list__row--hidden" : ""}`}
                  >
                    <span className="mc-list__name">
                      {c.label}
                      {c.custom && (
                        <span className="mc-list__badge">custom</span>
                      )}
                    </span>
                    <div className="mc-list__actions">
                      <button
                        type="button"
                        className="icon-btn"
                        title="Move up"
                        disabled={c.movable === false || idx === 0}
                        onClick={() => handleMoveColumn(c, "up")}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Move down"
                        disabled={
                          c.movable === false || idx === columns.length - 1
                        }
                        onClick={() => handleMoveColumn(c, "down")}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Rename column"
                        onClick={() => handleRenameColumn(c)}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title={
                          c.hideable === false
                            ? "Always visible (required for calculations)"
                            : c.visible === false
                              ? "Show column"
                              : "Hide column"
                        }
                        disabled={c.hideable === false}
                        onClick={() => handleToggleColumnVisibility(c)}
                      >
                        {c.visible === false ? "🙈" : "👁"}
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        title={
                          c.removable === false
                            ? "Required for calculations"
                            : "Delete column"
                        }
                        disabled={c.removable === false}
                        onClick={() => handleDeleteColumn(c)}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mc-add">
                <h4>Add New Column</h4>
                <div className="field-grid">
                  <label className="field">
                    <span className="field__label">Column Name</span>
                    <input
                      className="field__input"
                      value={newColLabel}
                      onChange={(e) => setNewColLabel(e.target.value)}
                      placeholder="e.g. Heat Number"
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">Data Type</span>
                    <select
                      className="field__input"
                      value={newColType}
                      onChange={(e) => setNewColType(e.target.value)}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="dropdown">Dropdown</option>
                    </select>
                  </label>
                  {newColType === "dropdown" && (
                    <label className="field field--wide">
                      <span className="field__label">
                        Dropdown Options (comma separated)
                      </span>
                      <input
                        className="field__input"
                        value={newColOptions}
                        onChange={(e) => setNewColOptions(e.target.value)}
                        placeholder="e.g. A36, A572, SS400"
                      />
                    </label>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!newColLabel.trim()}
                  onClick={handleAddColumn}
                >
                  + Add Column
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .manage-columns-btn { margin-left: 12px; }

        .mc-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .mc-panel {
          background: #fff;
          border-radius: 10px;
          width: 100%;
          max-width: 560px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
        }
        .mc-panel__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        .mc-panel__header h3 { margin: 0; font-size: 16px; }
        .mc-panel__body { padding: 16px 20px 20px; }
        .mc-list { list-style: none; margin: 0 0 20px; padding: 0; }
        .mc-list__row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          margin-bottom: 6px;
        }
        .mc-list__row--hidden { opacity: 0.5; }
        .mc-list__name { display: flex; align-items: center; gap: 8px; font-size: 13.5px; }
        .mc-list__badge {
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: #eef2ff;
          color: #4338ca;
          border-radius: 999px;
          padding: 2px 7px;
        }
        .mc-list__actions { display: flex; align-items: center; gap: 4px; }
        .mc-add { border-top: 1px solid #e5e7eb; padding-top: 16px; }
        .mc-add h4 { margin: 0 0 10px; font-size: 13.5px; }
      `}</style>
    </div>
  );
}