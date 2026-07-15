export default function PrintLayout({ title, onBack, children }) {
  const handlePrint = () => window.print();

  return (
    <div className="doc-scene">
      <div className="doc-toolbar no-print">
        <div className="doc-toolbar__left">
          <button className="btn btn-secondary" onClick={onBack}>← Back to Edit</button>
        </div>
        <div className="doc-toolbar__title">{title}</div>
        <div className="doc-toolbar__right">
          <button className="btn btn-secondary" onClick={handlePrint}>Save as PDF</button>
          <button className="btn btn-primary" onClick={handlePrint}>🖨 Print</button>
        </div>
      </div>
      <div className="doc-page">{children}</div>
    </div>
  );
}
