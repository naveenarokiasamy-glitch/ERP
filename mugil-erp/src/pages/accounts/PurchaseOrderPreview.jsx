import PrintLayout from "../../components/PrintLayout";
import OrderItemsTable from "../../components/OrderItemsTable";
import { formatDate } from "../../utils/calculations";
import CompanyHeader from "../../components/CompanyHeader";
import CompanyFooter from "../../components/CompanyFooter";

export default function PurchaseOrderPreview({
  data,
  summary,
  onBack,
  columns,
}) {
  // Format date as DD.MM.YYYY
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Format amount with commas (Indian format)
  const formatIndianCurrency = (amount) => {
    if (!amount) return "—";
    const num = Number(amount);
    if (isNaN(num)) return "—";
    const parts = num.toFixed(2).split(".");
    let integerPart = parts[0];
    const lastThree = integerPart.slice(-3);
    const other = integerPart.slice(0, -3);
    if (other !== "") {
      integerPart =
        other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    } else {
      integerPart = lastThree;
    }
    return integerPart;
  };

  const displayTotal = summary?.subtotal || data.grandTotal || 0;
  const displayGstPercent = data.gstPercent || "18";
  const displayGstAmount = data.gstAmount || "Extra";
  const displayFinalTotal = data.finalTotal || "As applicable";

  return (
    <PrintLayout
      title={`Purchase Order Preview — ${data.poNumber || "Untitled"}`}
      onBack={onBack}
    >
      {/* Company Header */}
      <CompanyHeader docTitle="Purchase Order" />

      <div className="po-preview-container">
        {/* Header */}
        <div className="po-header">
          <div className="po-title">PURCHASE ORDER</div>
          <div className="po-date">Date: {formatDateDisplay(data.poDate)}</div>
        </div>

        {/* To/Address Block */}
        <div className="po-address-block">
          <p>To,</p>
          <p>
            <strong>{data.vendor?.companyName || "—"}</strong>
          </p>
          {data.vendor?.address && <p>{data.vendor.address}</p>}
          {data.vendor?.gst && <p>GST: {data.vendor.gst}</p>}
        </div>

        {/* Subject */}
        <div className="po-subject">
          <p>
            <strong>Subject:</strong> {data.subject || "—"}
          </p>
        </div>

        {/* Intro/Salutation */}
        <div className="po-intro">
          <p>Dear Sir,</p>
          <p>
            With reference to your quotation {data.refQuoteNumber || "—"}
            {data.refDate ? ` dated ${formatDateDisplay(data.refDate)}` : ""},
            we are pleased to place the purchase order as per the
            below-mentioned details.
          </p>
        </div>

        {/* Order Details Table */}
        <div className="po-section-heading">Details of Order:</div>

        <OrderItemsTable
          variant="po"
          mode="print"
          items={data.items}
          columns={columns}
        />

        {/* Amount Summary */}
        <div className="po-section-heading">Amount Summary:</div>
        <div className="po-amount-summary">
          <p>
            <span className="po-amount-label">Total (Excluding GST):</span>
            <span className="po-amount-value">
              ₹ {formatIndianCurrency(displayTotal)}/-
            </span>
          </p>
          <p>
            <span className="po-amount-label">
              GST @ {displayGstPercent}% :
            </span>
            <span className="po-amount-value">
              {typeof displayGstAmount === "number"
                ? `₹ ${formatIndianCurrency(displayGstAmount)}/-`
                : "Extra"}
            </span>
          </p>
          <p>
            <span className="po-amount-label">Total Amount:</span>
            <span className="po-amount-value">
              {typeof displayFinalTotal === "number"
                ? `₹ ${formatIndianCurrency(displayFinalTotal)}/-`
                : "As applicable"}
            </span>
          </p>
        </div>

        {/* Closing */}
        <div className="po-closing">
          <p>Kindly proceed with the execution of the order at the earliest.</p>
          <p>Thanking You,</p>
          <p>Yours faithfully,</p>
        </div>

        {/* Signature */}
        <div className="po-signature">
          <p>({data.signatures?.preparedBy || "Rajappa P"})</p>
          <p>{data.companyName || "M/s. Mugil Engineering Industry"}</p>
          <p>{data.location || "Trichy"}</p>
        </div>
      </div>

      {/* Company Footer */}
      <CompanyFooter />

      {/* Custom CSS for PDF-style preview */}
      <style>{`
        .po-preview-container {
          font-family: 'Times New Roman', Times, serif;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px 50px 30px 50px;
          color: #1a1a1a;
          line-height: 1.6;
          background: white;
        }

        .po-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 30px;
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 10px;
        }

        .po-title {
          font-size: 24px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .po-date {
          font-size: 14px;
          font-weight: normal;
        }

        .po-address-block {
          margin-bottom: 20px;
          line-height: 1.8;
        }

        .po-address-block p {
          margin: 0;
        }

        .po-subject {
          margin-bottom: 20px;
          font-size: 14px;
        }

        .po-subject p {
          margin: 0;
        }

        .po-intro {
          margin-bottom: 25px;
          font-size: 14px;
        }

        .po-intro p {
          margin: 6px 0;
        }

        .po-section-heading {
          font-weight: bold;
          font-size: 15px;
          margin: 25px 0 12px 0;
          text-decoration: underline;
        }

        .po-amount-summary {
          margin: 10px 0 20px 0;
          padding-left: 20px;
        }

        .po-amount-summary p {
          margin: 4px 0;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          max-width: 400px;
        }

        .po-amount-label {
          font-weight: 500;
        }

        .po-amount-value {
          font-weight: 600;
        }

        .po-closing {
          margin: 30px 0 20px 0;
          font-size: 14px;
        }

        .po-closing p {
          margin: 4px 0;
        }

        .po-signature {
          margin-top: 10px;
          font-size: 14px;
          line-height: 1.8;
        }

        .po-signature p {
          margin: 2px 0;
        }

        /* Table overrides for PDF style */
        .po-preview-container .doc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin: 10px 0 15px 0;
        }

        .po-preview-container .doc-table th {
          border: 1px solid #1a1a1a;
          padding: 8px 10px;
          text-align: left;
          font-weight: bold;
          background-color: #f8f8f8;
        }

        .po-preview-container .doc-table td {
          border: 1px solid #1a1a1a;
          padding: 8px 10px;
          vertical-align: top;
        }

        .po-preview-container .doc-table .num {
          text-align: right;
          font-weight: 500;
        }

        .po-preview-container .doc-table .center {
          text-align: center;
        }

        /* Print-specific adjustments */
        @media print {
          .po-preview-container {
            padding: 20px 30px;
          }
          
          .po-header {
            border-bottom: 2px solid #000;
          }
          
          .po-preview-container .doc-table th {
            background-color: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </PrintLayout>
  );
}
