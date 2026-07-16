import { useEffect, useState } from "react";
import VendorDetails from "../../components/VendorDetails";
import OrderItemsTable from "../../components/OrderItemsTable";
import AmountSummary from "../../components/AmountSummary";
import TermsEditor from "../../components/TermsEditor";
import QuotationPreview from "./QuotationPreview";
import { initialQuoteData } from "../../utils/initialData";
import { summarizeQuoteItems } from "../../utils/calculations";
import "./Quotation.css";
import { useNavigate } from "react-router-dom";

const DRAFT_KEY = "mei-erp-quotation-draft";

// Default technical sections based on the PDF
const DEFAULT_TECHNICAL_SECTIONS = [
  {
    heading: "Material",
    points: [
      "Mild Steel Plates conforming to IS 2062 Grade. Plate Thickness: 20 mm.",
    ],
  },
  {
    heading: "Pipe Specification",
    points: [
      "Type of Pipe: Fabricated Mild Steel Pipe",
      "Internal Diameter (I.D.): 540 mm",
      "Standard Pipe Length: 6.0 metres",
    ],
  },
  {
    heading: "Fabrication Scope",
    points: [
      "Procurement of M.S. plates.",
      "Cutting of plates to the required dimensions.",
      "Plate rolling to achieve the specified diameter.",
      "Full penetration welding of all circumferential joints.",
      "Grinding and finishing of weld joints.",
      "Dimensional inspection of fabricated pipes.",
    ],
  },
  {
    heading: "Fabrication Methodology",
    points: [
      "The pipes shall be fabricated at our works in transportable sections and supplied to the project site.",
      "Each 6.0-metre-long pipe shall be fabricated by welding four (4) rolled sections of 1.5 metre length each to achieve the required pipe length.",
      "All circumferential weld joints shall be fully welded, ground, and finished before dispatch.",
    ],
  },
  {
    heading: "Inspection",
    points: [
      "Visual inspection of weld joints.",
      "Dimensional inspection of fabricated pipes.",
    ],
  },
];

export default function QuotationForm() {
  const [view, setView] = useState("form");
  const [data, setData] = useState(() => {
    const initial = initialQuoteData();
    // Set default technical details if not already set
    if (!initial.technicalDetails || initial.technicalDetails.length === 0) {
      initial.technicalDetails = DEFAULT_TECHNICAL_SECTIONS;
    }
    return initial;
  });
  const [errors, setErrors] = useState({});
  const [savedAt, setSavedAt] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Ensure technical details exist
        if (!parsed.technicalDetails || parsed.technicalDetails.length === 0) {
          parsed.technicalDetails = DEFAULT_TECHNICAL_SECTIONS;
        }
        setData(parsed);
      } catch {
        // ignore corrupt draft
      }
    }
  }, []);

  const set = (key, value) => setData((d) => ({ ...d, [key]: value }));

  const summary = summarizeQuoteItems(data.items, {
    gstPercent: Number(data.gstPercent) || 0,
  });

  const validate = () => {
    const next = {};
    if (!data.quotationNumber.trim())
      next.quotationNumber = "Quotation Number is required";
    if (!data.quotationDate) next.quotationDate = "Quotation Date is required";
    if (!data.vendor.companyName.trim())
      next.vendorCompany = "Customer company name is required";
    const hasItem = data.items.some(
      (it) => it.description.trim() && Number(it.qty) > 0,
    );
    if (!hasItem)
      next.items = "Add at least one item with a description and quantity";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    setSavedAt(new Date());
  };

  const clearForm = () => {
    if (!window.confirm("Clear all fields and start a new Quotation?")) return;
    localStorage.removeItem(DRAFT_KEY);
    const fresh = initialQuoteData();
    fresh.technicalDetails = DEFAULT_TECHNICAL_SECTIONS;
    setData(fresh);
    setErrors({});
    setSavedAt(null);
  };

  const goToPreview = () => {
    if (!validate()) return;
    saveDraft();
    setView("preview");
  };

  // ---- Technical Details helpers ----
  const addSection = () => {
    set("technicalDetails", [
      ...data.technicalDetails,
      { heading: "", points: [""] },
    ]);
  };

  const updateSectionHeading = (idx, heading) => {
    const next = [...data.technicalDetails];
    next[idx] = { ...next[idx], heading };
    set("technicalDetails", next);
  };

  const removeSection = (idx) => {
    if (data.technicalDetails.length <= 1) {
      alert("At least one technical section is required.");
      return;
    }
    set(
      "technicalDetails",
      data.technicalDetails.filter((_, i) => i !== idx),
    );
  };

  const addPoint = (idx) => {
    const next = [...data.technicalDetails];
    next[idx] = { ...next[idx], points: [...next[idx].points, ""] };
    set("technicalDetails", next);
  };

  const updatePoint = (secIdx, pointIdx, value) => {
    const next = [...data.technicalDetails];
    const points = [...next[secIdx].points];
    points[pointIdx] = value;
    next[secIdx] = { ...next[secIdx], points };
    set("technicalDetails", next);
  };

  const removePoint = (secIdx, pointIdx) => {
    const next = [...data.technicalDetails];
    const points = next[secIdx].points;
    if (points.length <= 1) {
      alert("At least one point is required per section.");
      return;
    }
    next[secIdx] = {
      ...next[secIdx],
      points: points.filter((_, i) => i !== pointIdx),
    };
    set("technicalDetails", next);
  };

  // Reset to default technical sections
  const resetToDefaultTechnical = () => {
    if (!window.confirm("Reset technical details to default template?")) return;
    set("technicalDetails", DEFAULT_TECHNICAL_SECTIONS);
  };

  if (view === "preview") {
    return (
      <QuotationPreview
        data={data}
        summary={summary}
        onBack={() => setView("form")}
      />
    );
  }

  const handleBack = () => {
    navigate("/accounts");
  };
  return (
    <div className="form-page">
      <div className="form-page__header">
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
        <div className="form-page__heading">
          <h1>Quotation</h1>
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

      {/* Quotation Details */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">1</span> Quotation Details
        </h3>
        <div className="field-grid">
          <label className="field">
            <span className="field__label">
              Quotation Number<span className="field__required">*</span>
            </span>
            <input
              className={`field__input ${errors.quotationNumber ? "has-error" : ""}`}
              value={data.quotationNumber}
              onChange={(e) => set("quotationNumber", e.target.value)}
              placeholder="e.g. MEI/QTN/0626-05"
            />
          </label>
          <label className="field">
            <span className="field__label">
              Quotation Date<span className="field__required">*</span>
            </span>
            <input
              type="date"
              className={`field__input ${errors.quotationDate ? "has-error" : ""}`}
              value={data.quotationDate}
              onChange={(e) => set("quotationDate", e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Validity</span>
            <input
              className="field__input"
              value={data.validity}
              onChange={(e) => set("validity", e.target.value)}
              placeholder="e.g. 7 days from the date of issue"
            />
          </label>
          <label className="field">
            <span className="field__label">Delivery Time</span>
            <input
              className="field__input"
              value={data.deliveryTime}
              onChange={(e) => set("deliveryTime", e.target.value)}
              placeholder="e.g. 4-6 weeks from PO"
            />
          </label>
          <label className="field field--wide">
            <span className="field__label">
              Subject<span className="field__required">*</span>
            </span>
            <input
              className="field__input"
              value={data.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="e.g. Quotation for Manufacturing and Supply of Fabricated M.S. Longitudinal Pipes"
            />
          </label>
          <label className="field">
            <span className="field__label">Prepared By</span>
            <input
              className="field__input"
              value={data.preparedBy}
              onChange={(e) => set("preparedBy", e.target.value)}
              placeholder="e.g. P. Rajappa"
            />
          </label>
          <label className="field">
            <span className="field__label">Company Name</span>
            <input
              className="field__input"
              value={data.companyName || "Mugil Engineering Industry"}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="e.g. Mugil Engineering Industry"
            />
          </label>
          <label className="field">
            <span className="field__label">Designation</span>
            <input
              className="field__input"
              value={data.designation || "Proprietor"}
              onChange={(e) => set("designation", e.target.value)}
              placeholder="e.g. Proprietor"
            />
          </label>
        </div>
      </section>

      {/* Customer Details */}
      <VendorDetails
        mode="form"
        vendor={data.vendor}
        onChange={(v) => set("vendor", v)}
        heading="Customer Details"
      />

      {/* Intro Paragraph */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">3</span> Intro Paragraph
        </h3>
        <textarea
          className="field__textarea"
          value={data.introText}
          onChange={(e) => set("introText", e.target.value)}
          placeholder="e.g. We thank you for your valuable enquiry and are pleased to submit our quotation for the manufacturing and supply of fabricated Mild Steel Pipes as per your requirements."
          rows={3}
        />
      </section>

      {/* Quotation Items */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">4</span> Quotation Items
          <span className="form-card__hint">
            Totals calculate automatically
          </span>
        </h3>
        <OrderItemsTable
          variant="quote"
          mode="form"
          items={data.items}
          onChange={(items) => set("items", items)}
        />
      </section>

      {/* Amount Summary */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">5</span> Amount Summary
        </h3>
        <div
          className="field-grid field-grid--tight"
          style={{ marginBottom: 12, maxWidth: 220 }}
        >
          <label className="field">
            <span className="field__label">GST %</span>
            <input
              type="number"
              className="field__input"
              value={data.gstPercent}
              onChange={(e) => set("gstPercent", e.target.value)}
              placeholder="18"
            />
          </label>
        </div>
        <AmountSummary mode="form" docType="quote" summary={summary} />
      </section>

      {/* Technical Details */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">6</span> Technical Details
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={resetToDefaultTechnical}
            style={{ marginLeft: "auto" }}
          >
            ↻ Reset to Default
          </button>
        </h3>
        <p className="form-card__hint" style={{ marginBottom: 16 }}>
          Each section represents a main heading (e.g., Material, Pipe
          Specification) with sub-points underneath.
        </p>

        {data.technicalDetails.map((sec, secIdx) => (
          <div
            key={secIdx}
            style={{
              marginBottom: 20,
              padding: 16,
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              background: "#fafafa",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 4,
                    color: "#666",
                  }}
                >
                  Section Heading <span className="field__required">*</span>
                </label>
                <input
                  className="field__input"
                  value={sec.heading}
                  onChange={(e) => updateSectionHeading(secIdx, e.target.value)}
                  placeholder="e.g. Material, Pipe Specification, Fabrication Scope"
                  style={{ fontWeight: 600 }}
                />
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => removeSection(secIdx)}
                title="Remove section"
                style={{ marginTop: 20 }}
              >
                ✕ Remove Section
              </button>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 4,
                  color: "#666",
                }}
              >
                Points / Sub-details
              </label>
              {sec.points.map((pt, ptIdx) => (
                <div
                  key={ptIdx}
                  className="terms-list__item"
                  style={{
                    marginBottom: 6,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ color: "#999", fontWeight: 300, minWidth: 20 }}
                  >
                    •
                  </span>
                  <input
                    className="field__input"
                    value={pt}
                    onChange={(e) => updatePoint(secIdx, ptIdx, e.target.value)}
                    placeholder={`Point ${ptIdx + 1}`}
                  />
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => removePoint(secIdx, ptIdx)}
                    title="Remove point"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => addPoint(secIdx)}
            >
              + Add Point
            </button>
          </div>
        ))}

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addSection}
          >
            + Add Technical Section
          </button>
        </div>
      </section>

      {/* Payment Terms */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">7</span> Payment Terms
        </h3>
        <textarea
          className="field__textarea"
          value={data.paymentTerms}
          onChange={(e) => set("paymentTerms", e.target.value)}
          placeholder="e.g. 80% advance along with the Purchase Order and the balance 20% before dispatch"
          rows={3}
        />
      </section>

      {/* Terms & Conditions */}
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

      {/* Notes */}
      <section className="form-card">
        <h3 className="form-card__title">
          <span className="step-number">9</span> Notes
        </h3>
        <textarea
          className="field__textarea field__textarea--lg"
          value={data.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional notes for this quotation..."
          rows={4}
        />
      </section>

      {/* Signature */}
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
                set("signatures", {
                  ...data.signatures,
                  preparedBy: e.target.value,
                })
              }
              placeholder="e.g. P. Rajappa"
            />
          </label>
          <label className="field">
            <span className="field__label">Checked By</span>
            <input
              className="field__input"
              value={data.signatures.checkedBy}
              onChange={(e) =>
                set("signatures", {
                  ...data.signatures,
                  checkedBy: e.target.value,
                })
              }
            />
          </label>
          <label className="field">
            <span className="field__label">Approved By</span>
            <input
              className="field__input"
              value={data.signatures.approvedBy}
              onChange={(e) =>
                set("signatures", {
                  ...data.signatures,
                  approvedBy: e.target.value,
                })
              }
            />
          </label>
          <label className="field">
            <span className="field__label">Designation</span>
            <input
              className="field__input"
              value={data.signatures.designation || "Proprietor"}
              onChange={(e) =>
                set("signatures", {
                  ...data.signatures,
                  designation: e.target.value,
                })
              }
              placeholder="e.g. Proprietor"
            />
          </label>
          <label className="field">
            <span className="field__label">Company</span>
            <input
              className="field__input"
              value={data.signatures.company || "Mugil Engineering Industry"}
              onChange={(e) =>
                set("signatures", {
                  ...data.signatures,
                  company: e.target.value,
                })
              }
              placeholder="e.g. Mugil Engineering Industry"
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
    </div>
  );
}
