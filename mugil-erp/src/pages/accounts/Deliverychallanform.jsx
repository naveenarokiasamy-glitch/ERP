import React, { useState, useEffect, useRef, useCallback } from "react";
import DeliveryChallanPreview from "./DeliveryChallanPreview";

// NOTE: Adjust these paths to match your project structure.
// These files already exist in your project and are reused as-is —
// nothing here redefines their styles.
//
// form.css currently only defines `.form-page`. The section/group/
// input/table/button class names below (form-section, form-group,
// form-label, form-input, form-table, btn, btn-primary, etc.) follow
// the same naming convention but aren't present in the form.css you
// shared — they're assumed to live in a shared/base stylesheet used
// elsewhere in your ERP (the way `.btn` etc. aren't in print.css
// either, but print.css's own buttons rely on them). If those classes
// don't exist yet, this form will be functional but unstyled until
// you add them.
import "../../styles/variables.css";
import "../../styles/form.css";
import { useNavigate } from "react-router-dom";
/* ========================================================================
   DELIVERY CHALLAN NUMBER GENERATION
   ------------------------------------------------------------------------
   Kept in one small, isolated, async function so it can be swapped for a
   real backend call later without touching any component code, e.g.:

     async function generateDeliveryChallanNumber() {
       const res = await fetch('/api/delivery-challan/next-number');
       const { number } = await res.json();
       return number;
     }

   While developing, it reads/writes the last-issued number in
   localStorage under DC_NUMBER_CONFIG.storageKey.
   ======================================================================== */

const DC_NUMBER_CONFIG = {
  storageKey: "deliveryChallanLastNumber",
  seedNumber: 458, // first number issued if localStorage has nothing yet
  prefix: "",
  suffix: "",
  padLength: 0, // e.g. 4 -> "0459". 0 disables padding.
};

function formatChallanNumber(num) {
  const { prefix, suffix, padLength } = DC_NUMBER_CONFIG;
  const numStr =
    padLength > 0 ? String(num).padStart(padLength, "0") : String(num);
  return `${prefix}${numStr}${suffix}`;
}

async function generateDeliveryChallanNumber() {
  const { storageKey, seedNumber } = DC_NUMBER_CONFIG;
  const stored = window.localStorage.getItem(storageKey);
  const lastNumber = stored ? parseInt(stored, 10) : seedNumber - 1;
  const nextNumber = Number.isNaN(lastNumber) ? seedNumber : lastNumber + 1;
  window.localStorage.setItem(storageKey, String(nextNumber));
  return formatChallanNumber(nextNumber);
}

/* ========================================================================
   DRAFT PERSISTENCE (localStorage)
   ======================================================================== */

const DRAFT_STORAGE_KEY = "deliveryChallanDraft";

function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Failed to load Delivery Challan draft:", err);
    return null;
  }
}

function saveDraft(data) {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error("Failed to save Delivery Challan draft:", err);
    return false;
  }
}

/* ========================================================================
   ITEM ROW HELPERS
   ======================================================================== */

function generateItemId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyItem() {
  return {
    id: generateItemId(),
    description: "",
    quantity: "",
    rate: "",
    remarks: "",
  };
}

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyFormData() {
  return {
    dcNumber: "", // filled in on mount via generateDeliveryChallanNumber()
    dcDate: getTodayISO(),
    poNumber: "",
    poDate: "",
    billNumber: "",
    billDate: "",
    deliveryAt: "",
    customer: {
      companyName: "",
      address: "",
      contactPerson: "",
      phone: "",
      gstNumber: "",
    },
    items: [createEmptyItem()],
    amountInWords: "",
    preparedBy: "",
  };
}

/* ========================================================================
   COMPONENT
   ======================================================================== */

export default function DeliveryChallanForm() {
  const navigate = useNavigate();
  const [view, setView] = useState("form"); // 'form' | 'preview'
  const [formData, setFormData] = useState(createEmptyFormData);
  const [draftStatus, setDraftStatus] = useState("");
  const hasLoadedRef = useRef(false);

  // On mount: resume a saved draft (keeping its already-issued DC number)
  // or issue a brand new DC number. This runs once.
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const draft = loadDraft();
    if (draft && draft.dcNumber) {
      setFormData(draft);
      return;
    }

    generateDeliveryChallanNumber().then((number) => {
      setFormData((prev) => ({ ...prev, dcNumber: number }));
    });
  }, []);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateCustomerField = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      customer: { ...prev.customer, [field]: value },
    }));
  }, []);

  const updateItem = useCallback((id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  }, []);

  const addRow = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  }, []);

  const duplicateRow = useCallback((id) => {
    setFormData((prev) => {
      const index = prev.items.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      const clone = { ...prev.items[index], id: generateItemId() };
      const items = [...prev.items];
      items.splice(index + 1, 0, clone);
      return { ...prev, items };
    });
  }, []);

  const deleteRow = useCallback((id) => {
    setFormData((prev) => {
      if (prev.items.length <= 1) return prev; // always keep at least one row
      return { ...prev, items: prev.items.filter((item) => item.id !== id) };
    });
  }, []);

  const handleSaveDraft = useCallback(() => {
    const ok = saveDraft(formData);
    setDraftStatus(
      ok
        ? `Draft saved at ${new Date().toLocaleTimeString()}`
        : "Could not save draft",
    );
    window.setTimeout(() => setDraftStatus(""), 3000);
  }, [formData]);

  const handlePreview = useCallback(() => setView("preview"), []);
  const handleBackToForm = useCallback(() => setView("form"), []);
  const handlePrint = useCallback(() => window.print(), []);

  if (view === "preview") {
    return (
      <DeliveryChallanPreview
        data={formData}
        onBack={handleBackToForm}
        onPrint={handlePrint}
      />
    );
  }
  const handleBack = () => {
    navigate(-1);
  };
  return (
    <div className="form-page">
      <div className="form-header">
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
        <h2>Delivery Challan</h2>
        {draftStatus && <span className="form-status">{draftStatus}</span>}
      </div>

      {/* SECTION 1: Delivery Challan Details */}
      <section className="form-section">
        <h3 className="form-section-title">Delivery Challan Details</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">DC Number</label>
            <input
              type="text"
              className="form-input form-input-readonly"
              value={formData.dcNumber}
              readOnly
              disabled
              title="Auto-generated — cannot be edited"
              style={{
                backgroundColor: "var(--bg-surface-muted)",
                color: "var(--text-secondary)",
                cursor: "not-allowed",
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">DC Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.dcDate}
              onChange={(e) => updateField("dcDate", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">PO / LO / WO Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.poNumber}
              onChange={(e) => updateField("poNumber", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">PO / LO / WO Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.poDate}
              onChange={(e) => updateField("poDate", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Bill Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.billNumber}
              onChange={(e) => updateField("billNumber", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Bill Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.billDate}
              onChange={(e) => updateField("billDate", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Delivery At</label>
            <input
              type="text"
              className="form-input"
              value={formData.deliveryAt}
              onChange={(e) => updateField("deliveryAt", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: Customer Details */}
      <section className="form-section">
        <h3 className="form-section-title">Customer Details</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.customer.companyName}
              onChange={(e) =>
                updateCustomerField("companyName", e.target.value)
              }
            />
          </div>
          <div className="form-group form-group-wide">
            <label className="form-label">Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.customer.address}
              onChange={(e) => updateCustomerField("address", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input
              type="text"
              className="form-input"
              value={formData.customer.contactPerson}
              onChange={(e) =>
                updateCustomerField("contactPerson", e.target.value)
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-input"
              value={formData.customer.phone}
              onChange={(e) => updateCustomerField("phone", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">GST Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.customer.gstNumber}
              onChange={(e) => updateCustomerField("gstNumber", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: Items */}
      <section className="form-section">
        <h3 className="form-section-title">Items</h3>
        <table className="form-table">
          <thead>
            <tr>
              <th>SL No</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Rate Per Piece</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>
                  <input
                    type="text"
                    className="form-input"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, "description", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-input"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, "quantity", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-input"
                    value={item.rate}
                    onChange={(e) =>
                      updateItem(item.id, "rate", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-input"
                    value={item.remarks}
                    onChange={(e) =>
                      updateItem(item.id, "remarks", e.target.value)
                    }
                  />
                </td>
                <td className="form-table-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => duplicateRow(item.id)}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteRow(item.id)}
                    disabled={formData.items.length <= 1}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="btn btn-secondary" onClick={addRow}>
          + Add Row
        </button>
      </section>

      {/* SECTION 4: Amount In Words */}
      <section className="form-section">
        <h3 className="form-section-title">Amount In Words</h3>
        <textarea
          className="form-textarea"
          rows={3}
          value={formData.amountInWords}
          onChange={(e) => updateField("amountInWords", e.target.value)}
          placeholder="e.g. Rupees Twelve Thousand Five Hundred Only"
        />
      </section>

      {/* SECTION 5: Prepared By */}
      <section className="form-section">
        <h3 className="form-section-title">Prepared By</h3>
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            value={formData.preparedBy}
            onChange={(e) => updateField("preparedBy", e.target.value)}
          />
        </div>
      </section>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleSaveDraft}
        >
          Save Draft
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePreview}
        >
          Preview
        </button>
      </div>
    </div>
  );
}
