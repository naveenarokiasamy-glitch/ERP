import { formatINR } from '../utils/calculations';

/**
 * docType: 'po' -> full CGST/SGST/IGST + round off breakdown
 * docType: 'quote' -> simple Subtotal / GST / Grand Total (matches the
 *          original quotation format exactly)
 */
export default function AmountSummary({ mode = 'form', docType = 'po', summary, interState, onToggleInterState }) {
  if (docType === 'quote') {
    if (mode === 'print') {
      return (
        <table className="doc-summary doc-summary--boxed">
          <tbody>
            <tr>
              <td className="label">Subtotal</td>
              <td className="value">{formatINR(summary.subtotal)}</td>
            </tr>
            <tr>
              <td className="label">GST @ {summary.gstPercent}%</td>
              <td className="value">{formatINR(summary.gstAmount)}</td>
            </tr>
            <tr>
              <td className="label">Grand Total</td>
              <td className="value">{formatINR(summary.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      );
    }
    return (
      <div className="summary-panel">
        <div className="summary-panel__row"><span>Subtotal</span><span>{formatINR(summary.subtotal)}</span></div>
        <div className="summary-panel__row"><span>GST @ {summary.gstPercent}%</span><span>{formatINR(summary.gstAmount)}</span></div>
        <div className="summary-panel__row is-total"><span>Grand Total</span><span>{formatINR(summary.grandTotal)}</span></div>
      </div>
    );
  }

  // ---- Purchase Order full breakdown ----
  if (mode === 'print') {
    return (
      <table className="doc-summary doc-summary--boxed">
        <tbody>
          <tr><td className="label">Subtotal</td><td className="value">{formatINR(summary.subtotal)}</td></tr>
          <tr><td className="label">Discount</td><td className="value">- {formatINR(summary.discountTotal)}</td></tr>
          <tr><td className="label">Taxable Amount</td><td className="value">{formatINR(summary.taxableTotal)}</td></tr>
          {interState ? (
            <tr><td className="label">IGST</td><td className="value">{formatINR(summary.igst)}</td></tr>
          ) : (
            <>
              <tr><td className="label">CGST</td><td className="value">{formatINR(summary.cgst)}</td></tr>
              <tr><td className="label">SGST</td><td className="value">{formatINR(summary.sgst)}</td></tr>
            </>
          )}
          <tr><td className="label">Round Off</td><td className="value">{formatINR(summary.roundOff)}</td></tr>
          <tr><td className="label">Grand Total</td><td className="value">{formatINR(summary.grandTotal)}</td></tr>
        </tbody>
      </table>
    );
  }

  return (
    <div className="summary-panel">
      <label className="summary-panel__toggle">
        <span className="switch">
          <input type="checkbox" checked={interState} onChange={(e) => onToggleInterState(e.target.checked)} />
          <span className="switch__track" />
        </span>
        Inter-state (use IGST instead of CGST/SGST)
      </label>
      <div className="summary-panel__row"><span>Subtotal</span><span>{formatINR(summary.subtotal)}</span></div>
      <div className="summary-panel__row"><span>Discount</span><span>- {formatINR(summary.discountTotal)}</span></div>
      <div className="summary-panel__row"><span>Taxable Amount</span><span>{formatINR(summary.taxableTotal)}</span></div>
      {interState ? (
        <div className="summary-panel__row"><span>IGST</span><span>{formatINR(summary.igst)}</span></div>
      ) : (
        <>
          <div className="summary-panel__row"><span>CGST</span><span>{formatINR(summary.cgst)}</span></div>
          <div className="summary-panel__row"><span>SGST</span><span>{formatINR(summary.sgst)}</span></div>
        </>
      )}
      <div className="summary-panel__row"><span>Round Off</span><span>{formatINR(summary.roundOff)}</span></div>
      <div className="summary-panel__row is-total"><span>Grand Total</span><span>{formatINR(summary.grandTotal)}</span></div>
    </div>
  );
}
