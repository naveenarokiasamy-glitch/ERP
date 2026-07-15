import PrintLayout from '../../components/PrintLayout';
import CompanyHeader from '../../components/CompanyHeader';
import CompanyFooter from '../../components/CompanyFooter';
import VendorDetails from '../../components/VendorDetails';
import OrderItemsTable from '../../components/OrderItemsTable';
import AmountSummary from '../../components/AmountSummary';
import TermsEditor from '../../components/TermsEditor';
import { formatDate } from '../../utils/calculations';

export default function QuotationPreview({ data, summary, onBack }) {
  // Get vendor name for display
  const vendorName = data.vendor?.companyName || '';
  const vendorCity = data.vendor?.city || '';
  const vendorAttn = data.vendor?.attn || '';
  const vendorPhone = data.vendor?.phone || '';
  const vendorEmail = data.vendor?.email || '';

  // Format the "To:" line as in the PDF
  const toLine = [vendorName, vendorCity].filter(Boolean).join('  ');

  return (
    <PrintLayout title={`Quotation Preview — ${data.quotationNumber || 'Untitled'}`} onBack={onBack}>
      <CompanyHeader docTitle="QUOTATION" />

      {/* Meta row - Date and Quotation No */}
      <div className="doc-metarow">
        <div className="doc-metarow__block">
          <p><span className="doc-label">Date:</span> {formatDate(data.quotationDate)}</p>
        </div>
        <div className="doc-metarow__block doc-metarow__right">
          <p><span className="doc-label">Quotation No:</span> {data.quotationNumber || '—'}</p>
        </div>
      </div>

      {/* To: line with all customer details */}
      <div className="doc-to-line">
        <p><span className="doc-label">To:</span> {toLine}</p>
        {vendorAttn && <p style={{ marginLeft: '36px' }}>Attn: {vendorAttn}</p>}
        {vendorPhone && <p style={{ marginLeft: '36px' }}>Phone: {vendorPhone}</p>}
        {vendorEmail && <p style={{ marginLeft: '36px' }}>Email: {vendorEmail}</p>}
      </div>

      {/* Subject */}
      <div className="doc-subject">
        <p><span className="doc-label">Subject:</span> {data.subject || '—'}</p>
      </div>

      {/* Dear Sir and Intro */}
      <p className="doc-intro" style={{ marginTop: 12 }}>
        Dear Sir,
      </p>
      <p className="doc-intro">{data.introText || 'We thank you for your valuable enquiry and are pleased to submit our quotation for the manufacturing and supply of fabricated Mild Steel Pipes as per your requirements.'}</p>
      <p className="doc-intro">We are pleased to submit our competitive quotation as detailed below:</p>

      {/* Quotation Details - using heading style from PDF */}
      <div className="doc-section-heading" style={{ fontSize: '16px', fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
        Quotation Details
      </div>
      <OrderItemsTable variant="quote" mode="print" items={data.items} />
      <AmountSummary mode="print" docType="quote" summary={summary} />

      {/* Technical Details */}
      {data.technicalDetails.length > 0 && (
        <>
          <div className="doc-section-heading" style={{ fontSize: '16px', fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
            TECHNICAL DETAILS
          </div>
          {data.technicalDetails.map((sec, idx) => {
            const heading = sec.heading || `Section ${idx + 1}`;
            const points = sec.points.filter(p => p.trim());
            
            // Format as in PDF: "## 1. Material" style
            return (
              <div key={idx} style={{ marginBottom: 12 }}>
                <p style={{ fontWeight: 700, margin: '8px 0 2px' }}>
                  {idx + 1}. {heading}
                </p>
                {points.length > 0 && (
                  <div style={{ paddingLeft: 0 }}>
                    {points.map((p, pIdx) => (
                      <p key={pIdx} style={{ margin: '2px 0', paddingLeft: 0 }}>
                        {p}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Terms & Conditions - includes payment terms as per PDF */}
      <div className="doc-section-heading" style={{ fontSize: '16px', fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
        TERMS &amp; CONDITIONS
      </div>
      
      {/* If there are payment terms, show them as part of terms & conditions
      {data.paymentTerms && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ margin: '2px 0' }}>
            <span style={{ fontWeight: 600 }}>Payment Terms:</span> {data.paymentTerms}
          </p>
        </div>
      )}
       */}
      <TermsEditor mode="print" terms={data.terms} />

      {/* Closing - matches PDF exactly */}
      <p style={{ marginTop: 24 }}>
        We look forward to receiving your valuable order.
      </p>
      <p style={{ marginTop: 12 }}>Thanking You,</p>
      
      {/* Company signature - using data or defaults from PDF */}
      <div style={{ marginTop: 12 }}>
        <p>For {data.companyName || 'Mugil Engineering Industry'}</p>
        <div style={{ marginTop: 24 }}>
          <p>{data.signatures.preparedBy || 'P. Rajappa'}</p>
          <p>{data.signatures.designation || 'Proprietor'}</p>
        </div>
      </div>

      <CompanyFooter />
    </PrintLayout>
  );
}