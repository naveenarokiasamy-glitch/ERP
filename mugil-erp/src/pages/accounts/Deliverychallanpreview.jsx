import React from 'react';

// Shared "official document" preview/print chrome — .doc-scene,
// .doc-toolbar, .doc-page sizing, and the @media print rules that hide
// .no-print elements and force A4 — all already live in print.css.
// Adjust these paths to match your project structure.
import '../../styles/print.css';
import '../../styles/variables.css'; // safety net in case it isn't already loaded globally
import './DeliveryChallanPreview.css';

function formatDisplayDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

// The original challan book has one tall, fixed-size grid box for line
// items regardless of how many lines are actually written. Padding out
// to a minimum row count keeps that same proportion instead of the
// table collapsing to fit only the entered rows.
const MIN_ITEM_ROWS = 8;

export default function DeliveryChallanPreview({ data = {}, onBack, onPrint }) {
  const {
    dcNumber = '',
    dcDate = '',
    poNumber = '',
    poDate = '',
    billNumber = '',
    billDate = '',
    deliveryAt = '',
    customer = {},
    items = [],
    amountInWords = '',
  } = data;

  const rows =
    items.length >= MIN_ITEM_ROWS
      ? items
      : [...items, ...Array.from({ length: MIN_ITEM_ROWS - items.length }, () => null)];

  // The original form only has room for "To / M/s." — Contact Person,
  // Phone, and GST Number are folded into a small extra line under it
  // rather than adding a new printed field the original doesn't have.
  const customerExtraLine = [
    customer.contactPerson,
    customer.phone,
    customer.gstNumber && `GST: ${customer.gstNumber}`,
  ]
    .filter(Boolean)
    .join('  |  ');

  return (
    <div className="doc-scene">
      <div className="doc-toolbar no-print">
        <div className="doc-toolbar__left">
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            ← Back to Form
          </button>
          <span className="doc-toolbar__title">Delivery Challan Preview</span>
        </div>
        <div className="doc-toolbar__right">
          <button type="button" className="btn btn-primary" onClick={onPrint}>
            Print
          </button>
        </div>
      </div>

      <div className="doc-page dc-page">
        {/* ============ FIXED HEADER — pre-printed, do not redesign ============ */}
        <div className="dc-topline">
          <div className="dc-topline__left">
            <p>SSI No.: 18,13,18257 dt. 31.01.2001</p>
            <p>TIN No.: 185/33503563160</p>
          </div>
          <div className="dc-topline__center">
            <p className="dc-topline__title">DELIVERY CHALLAN</p>
          </div>
          <div className="dc-topline__right">
            <p>Cell : 98424 - 52887</p>
            <p>Works : 0431-2904508</p>
            <p>Resi : 0431-2553287</p>
          </div>
        </div>

        <div className="dc-brand">
          <div className="dc-brand__logo" aria-hidden="true">
            {/* Replace with the real logo, e.g.:
                <img src="/assets/mugil-logo.png" alt="" /> */}
            M
          </div>
          <div className="dc-brand__text">
            <h1>MUGIL ENGINEERING INDUSTRY</h1>
            <p>Works : 2/89, SF No. 105, Thanjavur Main Road,</p>
            <p>Devarayaneri, Assur Post, Trichy-620 015.</p>
          </div>
        </div>

        <hr className="dc-divider" />

        {/* ============ USER-FILLED AREA ============ */}
        <div className="dc-info">
          <div className="dc-info-left">
            <div className="dc-info-line">
              <span className="dc-static-label">To</span>
            </div>
            <div className="dc-info-line">
              <span className="dc-static-label">M/s.</span>
              <span className="dc-filled dc-filled-block">
                {customer.companyName}
                {customer.address ? `, ${customer.address}` : ''}
              </span>
            </div>
            {customerExtraLine && (
              <div className="dc-info-line dc-info-line-small">
                <span className="dc-filled">{customerExtraLine}</span>
              </div>
            )}
          </div>

          <div className="dc-info-right">
            <div className="dc-info-right-row">
              <span className="dc-static-label">No.</span>
              <span className="dc-filled dc-number-value">{dcNumber}</span>
              <span className="dc-static-label dc-date-label">Date:</span>
              <span className="dc-filled">{formatDisplayDate(dcDate)}</span>
            </div>
            <div className="dc-info-right-row">
              <span className="dc-static-label">PO/LO/WO No.</span>
              <span className="dc-filled">{poNumber}</span>
              <span className="dc-static-label dc-date-label">Date:</span>
              <span className="dc-filled">{formatDisplayDate(poDate)}</span>
            </div>
            <div className="dc-info-right-row">
              <span className="dc-static-label">Bill No.</span>
              <span className="dc-filled">{billNumber}</span>
              <span className="dc-static-label dc-date-label">Date:</span>
              <span className="dc-filled">{formatDisplayDate(billDate)}</span>
            </div>
            <div className="dc-info-right-row">
              <span className="dc-static-label">Delivery at</span>
              <span className="dc-filled dc-filled-block">{deliveryAt}</span>
            </div>
          </div>
        </div>

        <table className="dc-items-table">
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Sl. No.</th>
              <th>Description</th>
              <th>Quantity (Nos.)</th>
              <th>Rate per Piece/Rs.</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => (
              <tr key={item?.id ?? `blank-${index}`}>
                <td className="dc-cell-center">{item ? index + 1 : ''}</td>
                <td className="dc-cell-left">{item?.description}</td>
                <td className="dc-cell-center">{item?.quantity}</td>
                <td className="dc-cell-center">{item?.rate}</td>
                <td className="dc-cell-left">{item?.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="dc-amount-words">
          <span className="dc-static-label">Rupees</span>
          <span className="dc-filled dc-amount-line">{amountInWords}</span>
        </div>

        {/* ============ FIXED FOOTER — pre-printed, do not redesign ============ */}
        <hr className="dc-footer-top-divider" />
        <div className="dc-footer-signoff">
          <p className="dc-for-company">
            For <strong>Mugil Engineering Industry</strong>
          </p>
          <p className="dc-signature-line">Signature</p>
        </div>
        <hr className="dc-footer-bottom-divider" />
        <p className="dc-footer-donate">DONATE EYES &amp; BLOOD</p>
      </div>
    </div>
  );
}