import React, { useMemo } from "react";
import "./ProformaInvoicePreview.css";

/* ------------------------------------------------------------------
   Fixed company profile (MEI always issues this document, so these
   are constants rather than form fields). Update the bracketed
   placeholders with the real registration details when available.
   ------------------------------------------------------------------ */

const COMPANY = {
  name: "MUGIL ENGINEERING INDUSTRY",
  address: "[Works Address], Trichy, Tamil Nadu.",
  gst: "[GSTIN/UIN]",
  stateName: "Tamil Nadu",
  stateCode: "33",
  phone: "[Phone Number]",
  email: "[Email Address]",
};

const BANK = {
  accountHolder: "MUGIL ENGINEERING INDUSTRY",
  bankName: "STATE BANK OF INDIA",
  accountNumber: "57033386551",
  branch: "THIRUVERUMBUR",
  ifsc: "SBIN0070565",
};

/* ------------------------------------------------------------------
   Number → Indian words (Rupees / Paise)
   ------------------------------------------------------------------ */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigitWords(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? " " + ONES[o] : ""}`;
}

function threeDigitWords(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let str = "";
  if (h) str += `${ONES[h]} Hundred${rest ? " " : ""}`;
  if (rest) str += twoDigitWords(rest);
  return str;
}

function numberToIndianWords(num) {
  num = Math.floor(num);
  if (num === 0) return "Zero";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  let parts = [];
  if (crore) parts.push(`${threeDigitWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitWords(hundred));

  return parts.join(" ").trim();
}

function amountInWords(value) {
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);
  let words = `INR ${numberToIndianWords(rupees)} Only`;
  if (paise > 0) {
    words = `INR ${numberToIndianWords(rupees)} and ${numberToIndianWords(
      paise,
    )} Paise Only`;
  }
  return words;
}

/* ------------------------------------------------------------------
   Formatting helpers
   ------------------------------------------------------------------ */

const fmt = (n) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

/* ------------------------------------------------------------------
   Component
   ------------------------------------------------------------------ */

export default function ProformaInvoicePreview({
  supplier = {},
  invoiceDetails = {},
  items = [],
  taxSummary = {},
  declaration = "",
  onBack,
  onPrint,
}) {
  const calculated = useMemo(() => {
    const rows = items.map((item, idx) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const disc = parseFloat(item.discount) || 0;
      const gross = qty * rate;
      const amount = gross - (gross * disc) / 100;
      return { ...item, slNo: idx + 1, qty, rate, disc, amount };
    });

    const subtotal = rows.reduce((sum, r) => sum + r.amount, 0);

    const cgstPercent = parseFloat(taxSummary.cgstPercent) || 0;
    const sgstPercent = parseFloat(taxSummary.sgstPercent) || 0;
    const igstPercent = parseFloat(taxSummary.igstPercent) || 0;
    const roundOff = parseFloat(taxSummary.roundOff) || 0;

    const cgstAmount = (subtotal * cgstPercent) / 100;
    const sgstAmount = (subtotal * sgstPercent) / 100;
    const igstAmount = (subtotal * igstPercent) / 100;

    const grandTotal =
      subtotal + cgstAmount + sgstAmount + igstAmount + roundOff;

    // HSN / SAC wise tax breakup
    const hsnMap = new Map();
    rows.forEach((r) => {
      const key = r.hsn || "—";
      const existing = hsnMap.get(key) || { hsn: key, taxableValue: 0 };
      existing.taxableValue += r.amount;
      hsnMap.set(key, existing);
    });
    const hsnRows = Array.from(hsnMap.values()).map((h) => ({
      ...h,
      cgstAmount: (h.taxableValue * cgstPercent) / 100,
      sgstAmount: (h.taxableValue * sgstPercent) / 100,
      igstAmount: (h.taxableValue * igstPercent) / 100,
    }));
    const hsnTotals = hsnRows.reduce(
      (acc, h) => ({
        taxableValue: acc.taxableValue + h.taxableValue,
        cgstAmount: acc.cgstAmount + h.cgstAmount,
        sgstAmount: acc.sgstAmount + h.sgstAmount,
        igstAmount: acc.igstAmount + h.igstAmount,
      }),
      { taxableValue: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0 },
    );
    // Total GST across the HSN breakup, and the taxable value + GST total
    const hsnGstTotal =
      hsnTotals.cgstAmount + hsnTotals.sgstAmount + hsnTotals.igstAmount;
    const hsnFinalTotal = hsnTotals.taxableValue + hsnGstTotal;

    return {
      rows,
      subtotal,
      cgstPercent,
      sgstPercent,
      igstPercent,
      roundOff,
      cgstAmount,
      sgstAmount,
      igstAmount,
      grandTotal,
      hsnRows,
      hsnTotals,
      hsnGstTotal,
      hsnFinalTotal,
      showIgst: igstPercent > 0,
    };
  }, [items, taxSummary]);
  const {
    rows,
    subtotal,
    cgstPercent,
    sgstPercent,
    igstPercent,
    roundOff,
    cgstAmount,
    sgstAmount,
    igstAmount,
    grandTotal,
    hsnRows,
    hsnTotals,
    hsnGstTotal,
    hsnFinalTotal,
    showIgst,
  } = calculated;
  return (
    <div className="doc-scene">
      <div className="doc-toolbar no-print">
        <div className="doc-toolbar__left">
          <button type="button" className="btn btn--secondary" onClick={onBack}>
            ← Back
          </button>
        </div>
        <div className="doc-toolbar__title">Proforma Invoice Preview</div>
        <div className="doc-toolbar__right">
          <button type="button" className="btn btn--primary" onClick={onPrint}>
            Print
          </button>
        </div>
      </div>

      <div className="doc-page pi-page">
        <div className="pi-frame">
          {/* ---------------- Header ---------------- */}
          <div className="pi-header">
            <div className="doc-header__logo">MEI</div>
            <div className="doc-header__center">
              <p className="doc-header__company">{COMPANY.name}</p>
              <p className="doc-header__meta">{COMPANY.address}</p>
              <p className="doc-header__meta">
                GSTIN/UIN: {COMPANY.gst} &nbsp;|&nbsp; State Name:{" "}
                {COMPANY.stateName}, Code: {COMPANY.stateCode}
              </p>
              <p className="doc-header__meta">
                Phone: {COMPANY.phone} &nbsp;|&nbsp; E-Mail: {COMPANY.email}
              </p>
            </div>
          </div>

          <div className="pi-title-bar">PROFORMA INVOICE</div>

          {/* ---------------- To / Invoice meta ---------------- */}
          <div className="pi-topgrid">
            <div className="pi-topgrid__left">
              <p className="doc-label">To,</p>
              <p className="pi-supplier-name">{supplier.name || "—"}</p>
              {supplier.address && <p>{supplier.address}</p>}
              {(supplier.city || supplier.state) && (
                <p>
                  {supplier.city}
                  {supplier.city && supplier.state ? ", " : ""}
                  {supplier.state}
                </p>
              )}
              {supplier.state && (
                <p>
                  State Name : {supplier.state}
                  {supplier.stateCode ? `, Code : ${supplier.stateCode}` : ""}
                </p>
              )}
              {supplier.gstNumber && <p>GSTIN/UIN : {supplier.gstNumber}</p>}
              {supplier.phone && <p>Phone : {supplier.phone}</p>}
              {supplier.email && <p>E-Mail : {supplier.email}</p>}
              {supplier.contactPerson && (
                <p>Contact Person : {supplier.contactPerson}</p>
              )}
            </div>

            <table className="pi-metatable">
              <tbody>
                <tr>
                  <td className="pi-metatable__label">Invoice No.</td>
                  <td>{invoiceDetails.invoiceNumber}</td>
                  <td className="pi-metatable__label">Dated</td>
                  <td>{formatDate(invoiceDetails.date)}</td>
                </tr>
                <tr>
                  <td className="pi-metatable__label">Delivery Note</td>
                  <td>{invoiceDetails.deliveryNote}</td>
                  <td className="pi-metatable__label">Mode/Terms of Payment</td>
                  <td>{invoiceDetails.modeOfPayment}</td>
                </tr>
                <tr>
                  <td className="pi-metatable__label">
                    Reference No. &amp; Date
                  </td>
                  <td>{invoiceDetails.referenceNumber}</td>
                  <td className="pi-metatable__label">Reference Date</td>
                  <td>{formatDate(invoiceDetails.referenceDate)}</td>
                </tr>
                <tr>
                  <td className="pi-metatable__label">Buyer's Order No.</td>
                  <td>{invoiceDetails.buyerOrderNumber}</td>
                  <td className="pi-metatable__label">Dated</td>
                  <td>{formatDate(invoiceDetails.date)}</td>
                </tr>
                <tr>
                  <td className="pi-metatable__label">Dispatch Doc No.</td>
                  <td>{invoiceDetails.dispatchDocNumber}</td>
                  <td className="pi-metatable__label">Destination</td>
                  <td>{invoiceDetails.destination}</td>
                </tr>
                <tr>
                  <td className="pi-metatable__label">Dispatched Through</td>
                  <td>{invoiceDetails.dispatchedThrough}</td>
                  <td className="pi-metatable__label">Terms of Delivery</td>
                  <td>{invoiceDetails.termsOfDelivery}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ---------------- Items table ---------------- */}
          <table className="doc-table pi-items-table">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>Sl No.</th>
                <th>Description of Goods</th>
                <th style={{ width: "10%" }}>HSN/SAC</th>
                <th style={{ width: "10%" }}>Quantity</th>
                <th style={{ width: "9%" }}>Rate</th>
                <th style={{ width: "6%" }}>per</th>
                <th style={{ width: "7%" }}>Disc. %</th>
                <th style={{ width: "12%" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="center">{r.slNo}</td>
                  <td className="pi-desc">{r.description}</td>
                  <td className="center">{r.hsn}</td>
                  <td className="num">
                    {r.qty ? `${fmt(r.qty)} ${r.unit || ""}` : ""}
                  </td>
                  <td className="num">{r.rate ? fmt(r.rate) : ""}</td>
                  <td className="center">{r.unit}</td>
                  <td className="num">{r.disc ? fmt(r.disc) : ""}</td>
                  <td className="num">{fmt(r.amount)}</td>
                </tr>
              ))}

              {/* Subtotal */}
              <tr>
                <td colSpan={7} className="pi-total-label">
                  Subtotal
                </td>
                <td className="num">{fmt(subtotal)}</td>
              </tr>

              {cgstPercent > 0 && (
                <tr>
                  <td colSpan={7} className="pi-total-label">
                    CGST {fmt(cgstPercent)}%
                  </td>
                  <td className="num">{fmt(cgstAmount)}</td>
                </tr>
              )}
              {sgstPercent > 0 && (
                <tr>
                  <td colSpan={7} className="pi-total-label">
                    SGST {fmt(sgstPercent)}%
                  </td>
                  <td className="num">{fmt(sgstAmount)}</td>
                </tr>
              )}
              {igstPercent > 0 && (
                <tr>
                  <td colSpan={7} className="pi-total-label">
                    IGST {fmt(igstPercent)}%
                  </td>
                  <td className="num">{fmt(igstAmount)}</td>
                </tr>
              )}

              <tr>
                <td colSpan={7} className="pi-total-label">
                  Round Off
                </td>
                <td className="num">{fmt(roundOff)}</td>
              </tr>

              <tr className="pi-grandtotal-row">
                <td colSpan={7} className="pi-total-label">
                  Total
                </td>
                <td className="num">₹ {fmt(grandTotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* ---------------- Amount in words ---------------- */}
          <div className="pi-words-row">
            <span className="doc-label">Amount Chargeable (in words)</span>
            <span className="pi-eoe">E. &amp; O.E</span>
          </div>
          <p className="pi-words-value">{amountInWords(grandTotal)}</p>

          {/* ---------------- HSN wise tax summary ---------------- */}
          {hsnRows.length > 0 && (
            <table className="doc-table pi-hsn-table">
              <thead>
                <tr>
                  <th>HSN/SAC</th>
                  <th>Taxable Value</th>
                </tr>
              </thead>
              <tbody>
                {hsnRows.map((h) => (
                  <tr key={h.hsn}>
                    <td>{h.hsn}</td>
                    <td className="num">{fmt(h.taxableValue)}</td>
                  </tr>
                ))}
                <tr className="pi-hsn-total-row">
                  <td className="pi-total-label">Taxable Value Total</td>
                  <td className="num">{fmt(hsnTotals.taxableValue)}</td>
                </tr>
                <tr className="pi-hsn-total-row">
                  <td className="pi-total-label">GST</td>
                  <td className="num">{fmt(hsnGstTotal)}</td>
                </tr>
                <tr className="pi-hsn-total-row">
                  <td className="pi-total-label">Final Total</td>
                  <td className="num">{fmt(hsnFinalTotal)}</td>
                </tr>
              </tbody>
            </table>
          )}

          {/* ---------------- Tax amount in words ---------------- */}
          <div className="pi-words-row">
            <span className="doc-label">Tax Amount (in words)</span>
          </div>
          <p className="pi-words-value">
            {taxSummary.taxAmountInWords || "NIL"}
          </p>
          {/* ---------------- Declaration + Bank details ---------------- */}
          <div className="pi-bottomgrid">
            <div className="pi-bottomgrid__cell">
              <p className="doc-label">Declaration</p>
              <p className="pi-declaration-text">{declaration}</p>
            </div>
            <div className="pi-bottomgrid__cell">
              <p className="doc-label">Company&rsquo;s Bank Details</p>
              <p>A/c Holder&rsquo;s Name : {BANK.accountHolder}</p>
              <p>Bank Name : {BANK.bankName}</p>
              <p>A/c No. : {BANK.accountNumber}</p>
              <p>
                Branch &amp; IFS Code : {BANK.branch} &amp; {BANK.ifsc}
              </p>
            </div>
          </div>

          {/* ---------------- Signature ---------------- */}
          <div className="pi-signoff">
            <p>for {COMPANY.name}</p>
            <p className="pi-signoff__line">Authorised Signatory</p>
          </div>

          <p className="pi-footer-note">This is a Computer Generated Invoice</p>
        </div>
      </div>
    </div>
  );
}
