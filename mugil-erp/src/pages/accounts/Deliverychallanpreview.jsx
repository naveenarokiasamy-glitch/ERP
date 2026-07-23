import React, { useState, useEffect, useRef, useCallback } from 'react';
import DeliveryChallanPreview from './DeliveryChallanPreview';

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
import '../../styles/variables.css';
import '../../styles/form.css';
import { useNavigate, useLocation } from "react-router-dom";
import { issueToOutsourcing } from "../../data/materialStore";
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
  storageKey: 'deliveryChallanLastNumber',
  seedNumber: 458,  // first number issued if localStorage has nothing yet
  prefix: '',
  suffix: '',
  padLength: 0,     // e.g. 4 -> "0459". 0 disables padding.
};

function formatChallanNumber(num) {
  const { prefix, suffix, padLength } = DC_NUMBER_CONFIG;
  const numStr = padLength > 0 ? String(num).padStart(padLength, '0') : String(num);
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

const DRAFT_STORAGE_KEY = 'deliveryChallanDraft';

function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to load Delivery Challan draft:', err);
    return null;
  }
}

function saveDraft(data) {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Failed to save Delivery Challan draft:', err);
    return false;
  }
}

/* ========================================================================
   ITEM ROW HELPERS
   ======================================================================== */

function generateItemId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyItem() {
  return {
    id: generateItemId(),
    description: '',
    quantity: '',
    rate: '',
    remarks: '',
  };
}

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyFormData() {
  return {
    dcNumber: '',          // filled in on mount via generateDeliveryChallanNumber()
    dcDate: getTodayISO(),
    poNumber: '',
    poDate: '',
    billNumber: '',
    billDate: '',
    deliveryAt: '',
    customer: {
      companyName: '',
      address: '',
      contactPerson: '',
      phone: '',
      gstNumber: '',
    },
    items: [createEmptyItem()],
    amountInWords: '',
    preparedBy: '',
    // Populated only when this form is opened from Issue Material to
    // Cutting > "Outsourcing". Drives the extra Material & Transport
    // Details section and the Save (Outsourcing) action below. Left null
    // for every normal Accounts > Delivery Challan use of this form.
    outsourcing: null,
  };
}

/* ========================================================================
   COMPONENT
   ======================================================================== */

export default function DeliveryChallanForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('form'); // 'form' | 'preview'
  const [formData, setFormData] = useState(createEmptyFormData);
  const [draftStatus, setDraftStatus] = useState('');
  const hasLoadedRef = useRef(false);

  // On mount: resume a saved draft (keeping its already-issued DC number),
  // issue a brand new DC number, OR — if we were sent here from Issue
  // Material to Cutting > Outsourcing — start a fresh challan pre-filled
  // with the selected material's details. This runs once.
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const oi = location.state?.outsourcingIssue;

    if (oi) {
      // Coming from the Outsourcing hand-off: always start a fresh challan
      // (never resume an unrelated draft) with a new DC number, the
      // material's PO Number pre-filled into the existing PO field, the
      // material itself pre-filled as the first item row, and the
      // outsourcing-only fields (Vendor, Delivery Address, Vehicle Number,
      // Driver, Issued Quantity) ready for the user to fill in.
      generateDeliveryChallanNumber().then((number) => {
        setFormData((prev) => ({
          ...createEmptyFormData(),
          dcNumber: number,
          poNumber: oi.poNumber || '',
          items: [
            {
              id: generateItemId(),
              description: [oi.material, oi.grade].filter(Boolean).join(' - '),
              quantity: oi.availableQty || '',
              rate: '',
              remarks: `Plate ${oi.plateNumber || '-'} | Heat ${oi.heatNumber || '-'} | ${oi.thickness || '-'}mm x ${oi.width || '-'} x ${oi.length || '-'}`,
            },
          ],
          outsourcing: {
            jobNumber: oi.jobNumber,
            stockId: oi.stockId,
            poNumber: oi.poNumber,
            material: oi.material,
            grade: oi.grade,
            thickness: oi.thickness,
            width: oi.width,
            length: oi.length,
            plateNumber: oi.plateNumber,
            heatNumber: oi.heatNumber,
            warehouse: oi.warehouse,
            availableQty: oi.availableQty,
            issuedQty: oi.availableQty,
            vendor: '',
            deliveryAddress: '',
            vehicleNumber: '',
            driver: '',
            remarks: '',
            saved: false,
          },
        }));
      });
      return;
    }

    const draft = loadDraft();
    if (draft && draft.dcNumber) {
      setFormData(draft);
      return;
    }

    generateDeliveryChallanNumber().then((number) => {
      setFormData((prev) => ({ ...prev, dcNumber: number }));
    });
  }, [location.state]);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateCustomerField = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      customer: { ...prev.customer, [field]: value },
    }));
  }, []);

  // Updates a field inside formData.outsourcing (Vendor, Delivery Address,
  // Vehicle Number, Driver, Issued Quantity, Remarks). No-op when this form
  // wasn't opened from the Outsourcing hand-off.
  const updateOutsourcingField = useCallback((field, value) => {
    setFormData((prev) =>
      prev.outsourcing
        ? { ...prev, outsourcing: { ...prev.outsourcing, [field]: value } }
        : prev
    );
  }, []);

  const updateItem = useCallback((id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }, []);

  const addRow = useCallback(() => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
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
    setDraftStatus(ok ? `Draft saved at ${new Date().toLocaleTimeString()}` : 'Could not save draft');
    window.setTimeout(() => setDraftStatus(''), 3000);
  }, [formData]);

  const handlePreview = useCallback(() => setView('preview'), []);
  const handleBackToForm = useCallback(() => setView('form'), []);
  const handlePrint = useCallback(() => window.print(), []);

  // SAVE FLOW (Outsourcing only) — creates the outsourcingJobs record via
  // issueToOutsourcing(), reduces Material Stock, and logs movement
  // history. Does NOT touch cuttingJobs / issueToCutting(). Preview/Print
  // continue to work exactly as before via handlePreview/handlePrint.
  const handleSaveOutsourcing = useCallback(() => {
    const oi = formData.outsourcing;
    if (!oi) return;

    if (!oi.vendor || !oi.vendor.trim()) {
      setDraftStatus('Vendor is required before saving.');
      window.setTimeout(() => setDraftStatus(''), 3000);
      return;
    }

    const issuedQty = Number(oi.issuedQty) || 0;
    if (issuedQty <= 0 || issuedQty > Number(oi.availableQty || 0)) {
      setDraftStatus(`Issued Quantity must be between 1 and ${oi.availableQty}.`);
      window.setTimeout(() => setDraftStatus(''), 3000);
      return;
    }

    issueToOutsourcing({
      stockId: oi.stockId,
      jobNumber: oi.jobNumber,
      issuedQty,
      issuedBy: formData.preparedBy?.trim() || 'Current User',
      remarks: oi.remarks?.trim() || '-',
      dcNumber: formData.dcNumber,
      dcDate: formData.dcDate,
      vendor: oi.vendor.trim(),
      deliveryAddress: oi.deliveryAddress?.trim() || '',
      vehicleNumber: oi.vehicleNumber?.trim() || '',
      driver: oi.driver?.trim() || '',
    });

    setFormData((prev) => ({
      ...prev,
      outsourcing: { ...prev.outsourcing, saved: true },
    }));
    setDraftStatus(
      `Outsourcing issue ${oi.jobNumber} saved. Material stock updated.`
    );
    window.setTimeout(() => setDraftStatus(''), 4000);
  }, [formData]);

  if (view === 'preview') {
    return (
      <DeliveryChallanPreview
        data={formData}
        onBack={handleBackToForm}
        onPrint={handlePrint}
      />
    );
  }
const handleBack = () => {
    navigate("/accounts/deliverychallan");
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
                backgroundColor: 'var(--bg-surface-muted)',
                color: 'var(--text-secondary)',
                cursor: 'not-allowed',
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">DC Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.dcDate}
              onChange={(e) => updateField('dcDate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">PO / LO / WO Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.poNumber}
              onChange={(e) => updateField('poNumber', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">PO / LO / WO Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.poDate}
              onChange={(e) => updateField('poDate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Bill Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.billNumber}
              onChange={(e) => updateField('billNumber', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Bill Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.billDate}
              onChange={(e) => updateField('billDate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Delivery At</label>
            <input
              type="text"
              className="form-input"
              value={formData.deliveryAt}
              onChange={(e) => updateField('deliveryAt', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* SECTION 1B: Material & Outsourcing Details — ONLY rendered when this
          form was opened from Issue Material to Cutting > "Outsourcing".
          Reuses the exact same form-section / form-group / form-input /
          form-textarea classes as every other section above; nothing here
          is a new design, just an additional section for a new source of
          data. Normal Accounts > Delivery Challan usage never sees this. */}
      {formData.outsourcing && (
        <section className="form-section">
          <h3 className="form-section-title">
            Material &amp; Outsourcing Details — Job {formData.outsourcing.jobNumber}
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Material</label>
              <input type="text" className="form-input form-input-readonly" value={formData.outsourcing.material || ''} readOnly disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Grade</label>
              <input type="text" className="form-input form-input-readonly" value={formData.outsourcing.grade || ''} readOnly disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Plate Number</label>
              <input type="text" className="form-input form-input-readonly" value={formData.outsourcing.plateNumber || ''} readOnly disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Heat Number</label>
              <input type="text" className="form-input form-input-readonly" value={formData.outsourcing.heatNumber || ''} readOnly disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Thickness (mm)</label>
              <input type="text" className="form-input form-input-readonly" value={formData.outsourcing.thickness ?? ''} readOnly disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Width (mm)</label>
              <input type="text" className="form-input form-input-readonly" value={formData.outsourcing.width ?? ''} readOnly disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Length (mm)</label>
              <input type="text" className="form-input form-input-readonly" value={formData.outsourcing.length ?? ''} readOnly disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Warehouse</label>
              <input type="text" className="form-input form-input-readonly" value={formData.outsourcing.warehouse || ''} readOnly disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Available Quantity</label>
              <input type="text" className="form-input form-input-readonly" value={formData.outsourcing.availableQty ?? ''} readOnly disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Issued Quantity *</label>
              <input
                type="number"
                min={1}
                max={formData.outsourcing.availableQty || undefined}
                className="form-input"
                value={formData.outsourcing.issuedQty}
                onChange={(e) => updateOutsourcingField('issuedQty', e.target.value)}
                disabled={formData.outsourcing.saved}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vendor *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Vendor / outsourcing partner name"
                value={formData.outsourcing.vendor}
                onChange={(e) => updateOutsourcingField('vendor', e.target.value)}
                disabled={formData.outsourcing.saved}
              />
            </div>
            <div className="form-group form-group-wide">
              <label className="form-label">Delivery Address</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={formData.outsourcing.deliveryAddress}
                onChange={(e) => updateOutsourcingField('deliveryAddress', e.target.value)}
                disabled={formData.outsourcing.saved}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.outsourcing.vehicleNumber}
                onChange={(e) => updateOutsourcingField('vehicleNumber', e.target.value)}
                disabled={formData.outsourcing.saved}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Driver</label>
              <input
                type="text"
                className="form-input"
                value={formData.outsourcing.driver}
                onChange={(e) => updateOutsourcingField('driver', e.target.value)}
                disabled={formData.outsourcing.saved}
              />
            </div>
            <div className="form-group form-group-wide">
              <label className="form-label">Remarks</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={formData.outsourcing.remarks}
                onChange={(e) => updateOutsourcingField('remarks', e.target.value)}
                disabled={formData.outsourcing.saved}
              />
            </div>
          </div>

          {formData.outsourcing.saved && (
            <p className="form-status" style={{ marginTop: '0.5rem' }}>
              ✅ Saved — this outsourcing issue has been recorded. Continue to Preview to print the challan.
            </p>
          )}
        </section>
      )}

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
              onChange={(e) => updateCustomerField('companyName', e.target.value)}
            />
          </div>
          <div className="form-group form-group-wide">
            <label className="form-label">Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.customer.address}
              onChange={(e) => updateCustomerField('address', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input
              type="text"
              className="form-input"
              value={formData.customer.contactPerson}
              onChange={(e) => updateCustomerField('contactPerson', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-input"
              value={formData.customer.phone}
              onChange={(e) => updateCustomerField('phone', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">GST Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.customer.gstNumber}
              onChange={(e) => updateCustomerField('gstNumber', e.target.value)}
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
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-input"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-input"
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-input"
                    value={item.remarks}
                    onChange={(e) => updateItem(item.id, 'remarks', e.target.value)}
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
          onChange={(e) => updateField('amountInWords', e.target.value)}
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
            onChange={(e) => updateField('preparedBy', e.target.value)}
          />
        </div>
      </section>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
          Save Draft
        </button>
        {formData.outsourcing && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveOutsourcing}
            disabled={formData.outsourcing.saved}
          >
            {formData.outsourcing.saved ? 'Saved' : 'Save'}
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={handlePreview}>
          Preview
        </button>
      </div>
    </div>
  );
}