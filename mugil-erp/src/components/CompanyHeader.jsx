import "./CompanyHeader.css";

export default function CompanyHeader({ docTitle }) {
  return (
    <>
      <div className="doc-header">
        <div className="doc-header__logo">
          <img
            src="/mugil-logo.png"
            alt="NXT GENZ"
          />
        </div>

        <div className="doc-header__center">
          <h1 className="doc-header__company">
            NXT GENZ
          </h1>

          <div className="doc-header__meta">
            Registration Number: N/A &nbsp;•&nbsp; GSTIN: N/A
          </div>
        </div>

        <div className="doc-header__logo--right">
          <img
            src="/globe-logo.png"
            alt="NXT GENZ"
          />
        </div>
      </div>

      <div className="doc-title">
        {docTitle}
      </div>
    </>
  );
}