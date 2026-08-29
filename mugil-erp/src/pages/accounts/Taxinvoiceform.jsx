import React, { useState, useEffect, useMemo } from "react";
import TaxInvoicePreview from "./TaxInvoicePreview";
import "./TaxInvoice.css";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";

// ---------------------------------------------------------------------------
// Lazy-loads the standalone print engine (TaxInvoicePrint.js) into the page
// on first use, so no manual <script> tag needs to be added to index.html.
// Mirrors the same pattern QuotationForm.jsx uses for QuotationPrint.js.
// Safe to call repeatedly.
// ---------------------------------------------------------------------------
let taxInvoicePrintEnginePromise = null;
function loadTaxInvoicePrintEngine() {
  if (typeof window.generateTaxInvoicePrint === "function") {
    return Promise.resolve();
  }
  if (taxInvoicePrintEnginePromise) return taxInvoicePrintEnginePromise;

  taxInvoicePrintEnginePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-tax-invoice-print-engine="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("TaxInvoicePrint.js failed to load")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "/TaxInvoicePrint.js";
    script.async = true;
    script.dataset.taxInvoicePrintEngine = "true";
    script.onload = () => resolve();
    script.onerror = () => {
      taxInvoicePrintEnginePromise = null; // allow retrying on a later click
      reject(new Error("TaxInvoicePrint.js failed to load"));
    };
    document.head.appendChild(script);
  });

  return taxInvoicePrintEnginePromise;
}

const COMPANY = {
  name: "MUGIL ENGINEERING INDUSTRY",
  worksLine1: "Works : 2/89. SF No 105, Thanjavur Main Road,",
  worksLine2: "Devarayaneri, Assoor Post, Trichy - 620 015.",
  gstin: "33AHDPR8644K1ZX",
  ssiNo: "18.13.18257 dt 31.01.2001",
  cell1: "98424-52887",
  cell2: "89039-52887",
  pan: "AHDPR8644K",
};

const COMPANY_ADDRESSES = [
  {
    id: "unit1",
    label: "Unit 1",
    address:
      "4/211, S.F. No.105, Thanjavur Main Road, Devarayanery, Assor (P.O.), Trichy - 620 015",
  },
  {
    id: "unit2",
    label: "Unit 2",
    address:
      "S.F. No: 436 / 5A, Near B K Bharath Township, Thanjavur Main Road, Valavanthankottai, Trichy - 620015",
  },
];

const customers = [
  {
    gst: "33ADUFS1852R1Z6",
    companyName: "SRI GURU KRUPA CONSTRUCTIONS",
    address:
      "No.90, Bhavani Main Road, Opp to Anna Statue, Perundurai - 638052",
    phone: "9876543210",
    email: "contact@srigurukrupa.com",
    state: "Tamil Nadu",
    stateCode: "33",
  },
  {
    gst: "33AHDPR8644K1ZX",
    companyName: "MUGIL ENGINEERING INDUSTRY",
    address:
      "2/89 SF No 105 Thanjavur Main Road, Devarayaneri, Assoor Post, Trichy - 620015",
    phone: "9842452887",
    email: "info@mugil.com",
    state: "Tamil Nadu",
    stateCode: "33",
  },
  {
    gst: "33AALCC1724F1Z1",
    companyName: "COIMBATORE CASTINGS PVT LTD",
    address: "45, SIDCO Industrial Estate, Kurichi, Coimbatore - 641021",
    phone: "9843211234",
    email: "sales@cbecastings.com",
    state: "Tamil Nadu",
    stateCode: "33",
  },
  {
    gst: "33ABCDE1234F1Z5",
    companyName: "SOUTHERN FABRICATORS",
    address: "12/4, Trichy Road, Karur - 639002",
    phone: "9865432190",
    email: "info@southernfab.com",
    state: "Tamil Nadu",
    stateCode: "33",
  },
  {
    gst: "29AAGCS1234H1Z8",
    companyName: "BANGALORE STEEL WORKS",
    address: "88, Peenya Industrial Area, Bangalore - 560058",
    phone: "9900112233",
    email: "contact@bswsteel.com",
    state: "Karnataka",
    stateCode: "29",
  },
  {
    gst: "27AAACP1234K1ZC",
    companyName: "PRECISION ENGINEERING CO",
    address: "23, MIDC Industrial Area, Pune - 411019",
    phone: "9822334455",
    email: "sales@precisioneng.com",
    state: "Maharashtra",
    stateCode: "27",
  },
  {
    gst: "33AAECT5678M1Z2",
    companyName: "TIRUCHY VALVES & FITTINGS",
    address: "5, Bharathidasan Nagar, Thillai Nagar, Trichy - 620018",
    phone: "9787654321",
    email: "info@tiruchyvalves.com",
    state: "Tamil Nadu",
    stateCode: "33",
  },
  {
    gst: "33AAFCM4321N1Z9",
    companyName: "MADURAI PIPES & TUBES",
    address: "17, Anna Nagar Main Road, Madurai - 625020",
    phone: "9865123456",
    email: "sales@maduraipipes.com",
    state: "Tamil Nadu",
    stateCode: "33",
  },
];

const emptyItem = () => ({
  id: Date.now() + Math.random(),
  description: "",
  hsn: "",
  quantity: "",
  unit: "",
  rate: "",
});

const STORAGE_KEY = "taxInvoiceDraft";

// Add to defaultFormData
const defaultFormData = {
  invoiceNumber: "",
  invoiceDate: "",
  dateOfSupply: "",
  reverseCharge: "NO",
  vehicleNumber: "",
  modeOfTransport: "",
  stateNameCode: "",
  receiverGst: "",
  consigneeGst: "",
  companyAddressId: "unit1",

  cgstPct: 9,
  sgstPct: 9,
  igstPct: 0,
  roundedOff: 0,

  bankName: "STATE BANK OF INDIA",
  accountNumber: "",
  branch: "",
  ifsc: "",

  declaration:
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",

  enclosures: {
    "Delivery Challan": true,
    "Material Accountable Statement": true,
    Invoice: true,
    "Inspection Report": true,
    "Rate Workout Sheet": true,
  },
};

/* ============================================================
   Number -> Indian words helper
   ============================================================ */
function numberToWordsIndian(num) {
  num = Math.round(num || 0);
  if (num === 0) return "Zero";

  const ones = [
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
  const tens = [
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

  const twoDigits = (n) => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  };

  const threeDigits = (n) => {
    if (n < 100) return twoDigits(n);
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 ? " and " + twoDigits(n % 100) : "")
    );
  };

  let result = "";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  if (crore) result += threeDigits(crore) + " Crore ";
  if (lakh) result += threeDigits(lakh) + " Lakh ";
  if (thousand) result += threeDigits(thousand) + " Thousand ";
  if (hundred) result += threeDigits(hundred);

  return result.trim();
}

export default function TaxInvoiceForm() {
  const [view, setView] = useState("form");
  const [formData, setFormData] = useState(defaultFormData);
  const [items, setItems] = useState([emptyItem()]);

  /* ---- restore draft ---- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.items && parsed.items.length) setItems(parsed.items);
      }
    } catch (e) {
      console.error("Failed to restore draft", e);
    }
  }, []);

  /* ---- autosave draft ---- */
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, items }));
      } catch (e) {
        console.error("Failed to save draft", e);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [formData, items]);

  const receiver = useMemo(
    () => customers.find((c) => c.gst === formData.receiverGst) || null,
    [formData.receiverGst],
  );

  const consignee = useMemo(
    () => customers.find((c) => c.gst === formData.consigneeGst) || null,
    [formData.consigneeGst],
  );

  const selectedCompanyAddress = useMemo(
    () =>
      COMPANY_ADDRESSES.find(
        (address) => address.id === formData.companyAddressId,
      ) || COMPANY_ADDRESSES[0],
    [formData.companyAddressId],
  );

  /* Place of supply is derived entirely from the consignee */
  const placeOfSupply = consignee
    ? { state: consignee.state, stateCode: consignee.stateCode }
    : { state: "", stateCode: "" };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEnclosure = (label) => {
    setFormData((prev) => ({
      ...prev,
      enclosures: { ...prev.enclosures, [label]: !prev.enclosures[label] },
    }));
  };

  /* ---- items handlers ---- */
  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  };

  const addRow = () => setItems((prev) => [...prev, emptyItem()]);

  const duplicateRow = (id) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: Date.now() + Math.random() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const deleteRow = (id) => {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.id !== id) : prev,
    );
  };

  /* ---- calculations ---- */
  const itemsWithAmount = items.map((it) => ({
    ...it,
    amount: (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0),
  }));

  const subtotal = itemsWithAmount.reduce((sum, it) => sum + it.amount, 0);

  const cgstAmount = (subtotal * (parseFloat(formData.cgstPct) || 0)) / 100;
  const sgstAmount = (subtotal * (parseFloat(formData.sgstPct) || 0)) / 100;
  const igstAmount = (subtotal * (parseFloat(formData.igstPct) || 0)) / 100;

  const beforeRounding = subtotal + cgstAmount + sgstAmount + igstAmount;
  const grandTotalRaw =
    beforeRounding + (parseFloat(formData.roundedOff) || 0);
  const grandTotal = Math.round(grandTotalRaw);
  const roundedOffAuto = grandTotal - beforeRounding;

  const navigate = useNavigate();

  const amountInWords = numberToWordsIndian(grandTotal) + " Rupees Only";

  const previewData = {
    company: {
      ...COMPANY,
      worksLine1: `Works : ${selectedCompanyAddress.address}`,
      worksLine2: "",
    },
    formData,
    items: itemsWithAmount,
    receiver,
    consignee,
    placeOfSupply: {
      // Place of Supply comes from consignee's state
      state: placeOfSupply.state,
      // State Name & Code is manually entered by user
      stateNameCode: formData.stateNameCode,
    },
    totals: {
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      roundedOff: roundedOffAuto,
      grandTotal,
      amountInWords,
    },
  };

  // Opens the new standalone print system (TaxInvoicePrint.html/css/js) in
  // its own tab, handing it the exact same `previewData` this form already
  // computes -- mirrors QuotationForm.jsx's goToPreview(). The existing
  // in-app "preview" view/TaxInvoicePreview component above is left intact
  // and untouched; this simply gives the Preview button a second, primary
  // action (print/PDF) without removing any existing functionality.
  const goToPrint = async () => {
    try {
      await loadTaxInvoicePrintEngine();
      window.generateTaxInvoicePrint(previewData);
    } catch (err) {
      console.error(err);
      alert(
        "Print preview isn't available: couldn't load /TaxInvoicePrint.js. " +
          "Make sure TaxInvoicePrint.html, TaxInvoicePrint.css, and TaxInvoicePrint.js " +
          "are deployed as static files reachable at the site root (e.g. copied into " +
          "your app's public/ folder), and that public/left.png and public/right.png exist.",
      );
    }
  };

  if (view === "preview") {
    return (
      <TaxInvoicePreview data={previewData} onBack={() => setView("form")} />
    );
  }

  const handleBack = () => {
    navigate("/accounts");
  };

  return (
     <>
                  <Header />
    <div className="ti-form-page">
      <div className="ti-form-header">
        <div className="ti-form-header-left">
          <button
            type="button"
            onClick={handleBack}
            className="ti-form-back-btn"
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

          <div className="ti-form-title-block">
            <h1 className="ti-form-title">Tax Invoice</h1>
            <p className="ti-form-subtitle">
              Create and manage tax invoice details
            </p>
          </div>
        </div>
      </div>

      <div className="ti-form-content">

        {/* 1. Invoice Details */}
        <section className="ti-form-section">
          <div className="ti-form-section-header">
            <span className="ti-form-section-number">01</span>
            <h2 className="ti-form-section-title">Invoice Details</h2>
          </div>

          <div className="ti-form-section-body">
            <div className="ti-form-grid">
              <div className="ti-form-field">
                <label className="ti-form-label">Invoice Number</label>
                <input
                  className="ti-form-input"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    updateField("invoiceNumber", e.target.value)
                  }
                  placeholder="e.g. 01"
                />
              </div>

              <div className="ti-form-field">
                <label className="ti-form-label">Invoice Date</label>
                <input
                  className="ti-form-input"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) =>
                    updateField("invoiceDate", e.target.value)
                  }
                />
              </div>

              <div className="ti-form-field">
                <label className="ti-form-label">Date of Supply</label>
                <input
                  className="ti-form-input"
                  type="date"
                  value={formData.dateOfSupply}
                  onChange={(e) =>
                    updateField("dateOfSupply", e.target.value)
                  }
                />
              </div>

              <div className="ti-form-field">
                <label className="ti-form-label">Reverse Charge (Y/N)</label>
                <select
                  className="ti-form-select"
                  value={formData.reverseCharge}
                  onChange={(e) =>
                    updateField("reverseCharge", e.target.value)
                  }
                >
                  <option value="NO">NO</option>
                  <option value="YES">YES</option>
                </select>
              </div>

              <div className="ti-form-field">
                <label className="ti-form-label">Vehicle Number</label>
                <input
                  className="ti-form-input"
                  value={formData.vehicleNumber}
                  onChange={(e) =>
                    updateField("vehicleNumber", e.target.value)
                  }
                  placeholder="e.g. TN23AV9019"
                />
              </div>

              <div className="ti-form-field">
                <label className="ti-form-label">Mode of Transport</label>
                <input
                  className="ti-form-input"
                  value={formData.modeOfTransport}
                  onChange={(e) =>
                    updateField("modeOfTransport", e.target.value)
                  }
                  placeholder="e.g. VAN"
                />
              </div>

              <div className="ti-form-field">
                <label className="ti-form-label">Address</label>
                <select
                  className="ti-form-select"
                  value={selectedCompanyAddress.id}
                  onChange={(e) =>
                    updateField("companyAddressId", e.target.value)
                  }
                >
                  {COMPANY_ADDRESSES.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label}: {address.address}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Receiver / 3. Consignee */}
        <div className="ti-form-party-grid">
          <section className="ti-form-party-card">
            <div className="ti-form-party-card-header">
              <h2 className="ti-form-party-card-title">
                02 &nbsp; Details of Receiver (Billed To)
              </h2>
            </div>

            <div className="ti-form-party-card-body">
              <div className="ti-form-field ti-form-customer-select">
                <label className="ti-form-label">Select GST</label>
                <select
                  className="ti-form-select"
                  value={formData.receiverGst}
                  onChange={(e) =>
                    updateField("receiverGst", e.target.value)
                  }
                >
                  <option value="">-- Select GST --</option>
                  {customers.map((c) => (
                    <option key={c.gst} value={c.gst}>
                      {c.gst} — {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {receiver && (
                <div className="ti-form-grid ti-form-grid--two ti-form-readonly-grid">
                  <div className="ti-form-field">
                    <label className="ti-form-label">Company Name</label>
                    <input
                      className="ti-form-input"
                      value={receiver.companyName}
                      readOnly
                    />
                  </div>

                  <div className="ti-form-field">
                    <label className="ti-form-label">GST Number</label>
                    <input
                      className="ti-form-input"
                      value={receiver.gst}
                      readOnly
                    />
                  </div>

                  <div className="ti-form-field ti-form-field--span-2">
                    <label className="ti-form-label">Address</label>
                    <input
                      className="ti-form-input"
                      value={receiver.address}
                      readOnly
                    />
                  </div>

                  <div className="ti-form-field">
                    <label className="ti-form-label">State</label>
                    <input
                      className="ti-form-input"
                      value={receiver.state}
                      readOnly
                    />
                  </div>

                  <div className="ti-form-field">
                    <label className="ti-form-label">State Code</label>
                    <input
                      className="ti-form-input"
                      value={receiver.stateCode}
                      readOnly
                    />
                  </div>

                  <div className="ti-form-field">
                    <label className="ti-form-label">Phone Number</label>
                    <input
                      className="ti-form-input"
                      value={receiver.phone}
                      readOnly
                    />
                  </div>

                  <div className="ti-form-field">
                    <label className="ti-form-label">Email</label>
                    <input
                      className="ti-form-input"
                      value={receiver.email}
                      readOnly
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="ti-form-party-card">
            <div className="ti-form-party-card-header">
              <h2 className="ti-form-party-card-title">
                03 &nbsp; Details of Consignee (Shipped To)
              </h2>
            </div>

            <div className="ti-form-party-card-body">
              <div className="ti-form-field ti-form-customer-select">
                <label className="ti-form-label">Select GST</label>
                <select
                  className="ti-form-select"
                  value={formData.consigneeGst}
                  onChange={(e) =>
                    updateField("consigneeGst", e.target.value)
                  }
                >
                  <option value="">-- Select GST --</option>
                  {customers.map((c) => (
                    <option key={c.gst} value={c.gst}>
                      {c.gst} — {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {consignee && (
                <div className="ti-form-grid ti-form-grid--two ti-form-readonly-grid">
                  <div className="ti-form-field">
                    <label className="ti-form-label">Company Name</label>
                    <input
                      className="ti-form-input"
                      value={consignee.companyName}
                      readOnly
                    />
                  </div>

                  <div className="ti-form-field">
                    <label className="ti-form-label">GST</label>
                    <input
                      className="ti-form-input"
                      value={consignee.gst}
                      readOnly
                    />
                  </div>

                  <div className="ti-form-field ti-form-field--span-2">
                    <label className="ti-form-label">Address</label>
                    <input
                      className="ti-form-input"
                      value={consignee.address}
                      readOnly
                    />
                  </div>

                  <div className="ti-form-field">
                    <label className="ti-form-label">State</label>
                    <input
                      className="ti-form-input"
                      value={consignee.state}
                      readOnly
                    />
                  </div>

                  <div className="ti-form-field">
                    <label className="ti-form-label">State Code</label>
                    <input
                      className="ti-form-input"
                      value={consignee.stateCode}
                      readOnly
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
                {/* 4. Place of Supply */}
        <section className="ti-form-section">
          <div className="ti-form-section-header">
            <span className="ti-form-section-number">04</span>
            <h2 className="ti-form-section-title">Place of Supply</h2>
          </div>

          <div className="ti-form-section-body">
            <div className="ti-form-grid ti-form-grid--two">
              <div className="ti-form-field">
                <label className="ti-form-label">
                  Place of Supply (Auto from Consignee)
                </label>
                <input
                  className="ti-form-input"
                  value={placeOfSupply.state}
                  readOnly
                  placeholder="Auto from Consignee"
                />
              </div>

              <div className="ti-form-field">
                <label className="ti-form-label">
                  Name & Code of State (Enter Manually)
                </label>
                <input
                  className="ti-form-input"
                  value={formData.stateNameCode}
                  onChange={(e) =>
                    updateField("stateNameCode", e.target.value)
                  }
                  placeholder="e.g. Tamilnadu & 33"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Invoice Items */}
        <section className="ti-form-section">
          <div className="ti-form-section-header">
            <span className="ti-form-section-number">05</span>
            <h2 className="ti-form-section-title">Invoice Items</h2>
          </div>

          <div className="ti-form-section-body">
            <div className="ti-form-items-wrapper">
              <table className="ti-form-items-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>SL</th>
                    <th>Description of Goods</th>
                    <th style={{ width: 100 }}>HSN/SAC</th>
                    <th style={{ width: 90 }}>Quantity</th>
                    <th style={{ width: 80 }}>Unit</th>
                    <th style={{ width: 110 }}>Rate</th>
                    <th style={{ width: 120 }}>Amount</th>
                    <th style={{ width: 130 }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {itemsWithAmount.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="ti-form-item-sl">{idx + 1}</td>

                      <td>
                        <input
                          className="ti-form-item-input"
                          value={it.description}
                          onChange={(e) =>
                            updateItem(
                              it.id,
                              "description",
                              e.target.value,
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="ti-form-item-input"
                          value={it.hsn}
                          onChange={(e) =>
                            updateItem(it.id, "hsn", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="ti-form-item-input ti-form-item-number"
                          type="number"
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(
                              it.id,
                              "quantity",
                              e.target.value,
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="ti-form-item-input"
                          value={it.unit}
                          onChange={(e) =>
                            updateItem(it.id, "unit", e.target.value)
                          }
                          placeholder="Mtrs"
                        />
                      </td>

                      <td>
                        <input
                          className="ti-form-item-input ti-form-item-number"
                          type="number"
                          value={it.rate}
                          onChange={(e) =>
                            updateItem(it.id, "rate", e.target.value)
                          }
                        />
                      </td>

                      <td className="ti-form-item-amount">
                        ₹
                        {it.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="ti-form-row-actions">
                        <button
                          type="button"
                          className="ti-form-row-btn"
                          onClick={() => duplicateRow(it.id)}
                        >
                          Duplicate
                        </button>

                        <button
                          type="button"
                          className="ti-form-row-btn ti-form-row-btn--delete"
                          onClick={() => deleteRow(it.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="ti-form-add-row"
              onClick={addRow}
            >
              + Add Row
            </button>
          </div>
        </section>

        {/* 6. Amount Summary */}
        <section className="ti-form-section">
          <div className="ti-form-section-header">
            <span className="ti-form-section-number">06</span>
            <h2 className="ti-form-section-title">Amount Summary</h2>
          </div>

          <div className="ti-form-section-body">
            <div className="ti-form-summary-layout">
              <div className="ti-form-tax-grid">
                <div className="ti-form-field">
                  <label className="ti-form-label">Subtotal</label>
                  <input
                    className="ti-form-input"
                    value={subtotal.toFixed(2)}
                    readOnly
                  />
                </div>

                <div className="ti-form-field">
                  <label className="ti-form-label">CGST %</label>
                  <input
                    className="ti-form-input"
                    type="number"
                    value={formData.cgstPct}
                    onChange={(e) =>
                      updateField("cgstPct", e.target.value)
                    }
                  />
                </div>

                <div className="ti-form-field">
                  <label className="ti-form-label">CGST Amount</label>
                  <input
                    className="ti-form-input"
                    value={cgstAmount.toFixed(2)}
                    readOnly
                  />
                </div>

                <div className="ti-form-field">
                  <label className="ti-form-label">SGST %</label>
                  <input
                    className="ti-form-input"
                    type="number"
                    value={formData.sgstPct}
                    onChange={(e) =>
                      updateField("sgstPct", e.target.value)
                    }
                  />
                </div>

                <div className="ti-form-field">
                  <label className="ti-form-label">SGST Amount</label>
                  <input
                    className="ti-form-input"
                    value={sgstAmount.toFixed(2)}
                    readOnly
                  />
                </div>

                <div className="ti-form-field">
                  <label className="ti-form-label">IGST %</label>
                  <input
                    className="ti-form-input"
                    type="number"
                    value={formData.igstPct}
                    onChange={(e) =>
                      updateField("igstPct", e.target.value)
                    }
                  />
                </div>

                <div className="ti-form-field">
                  <label className="ti-form-label">IGST Amount</label>
                  <input
                    className="ti-form-input"
                    value={igstAmount.toFixed(2)}
                    readOnly
                  />
                </div>

                <div className="ti-form-field">
                  <label className="ti-form-label">Rounded Off</label>
                  <input
                    className="ti-form-input"
                    value={roundedOffAuto.toFixed(2)}
                    readOnly
                  />
                </div>
              </div>

              <div className="ti-form-grand-total">
                <div className="ti-form-grand-total-header">
                  Grand Total
                </div>

                <div className="ti-form-grand-total-body">
                  <p className="ti-form-total-label">Grand Total</p>

                  <p className="ti-form-total-value">
                    ₹
                    {grandTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>

                  <div className="ti-form-amount-words">
                    <div className="ti-form-amount-words-label">
                      Total Amount in Words
                    </div>

                    <div className="ti-form-amount-words-value">
                      {amountInWords}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Bank Details */}
        <section className="ti-form-section">
          <div className="ti-form-section-header">
            <span className="ti-form-section-number">07</span>
            <h2 className="ti-form-section-title">
              Company Bank Details
            </h2>
          </div>

          <div className="ti-form-section-body">
            <div className="ti-form-grid">
              <div className="ti-form-field">
                <label className="ti-form-label">Bank Name</label>
                <input
                  className="ti-form-input"
                  value={formData.bankName}
                  onChange={(e) =>
                    updateField("bankName", e.target.value)
                  }
                />
              </div>

              <div className="ti-form-field">
                <label className="ti-form-label">Account Number</label>
                <input
                  className="ti-form-input"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    updateField("accountNumber", e.target.value)
                  }
                />
              </div>

              <div className="ti-form-field">
                <label className="ti-form-label">Branch</label>
                <input
                  className="ti-form-input"
                  value={formData.branch}
                  onChange={(e) =>
                    updateField("branch", e.target.value)
                  }
                />
              </div>

              <div className="ti-form-field">
                <label className="ti-form-label">IFSC</label>
                <input
                  className="ti-form-input"
                  value={formData.ifsc}
                  onChange={(e) =>
                    updateField("ifsc", e.target.value)
                  }
                />
              </div>

              <div className="ti-form-field">
                <label className="ti-form-label">PAN</label>
                <input
                  className="ti-form-input"
                  value={COMPANY.pan}
                  readOnly
                />
              </div>
            </div>
          </div>
        </section>

                {/* 8. Declaration */}
        <section className="ti-form-section">
          <div className="ti-form-section-header">
            <span className="ti-form-section-number">08</span>
            <h2 className="ti-form-section-title">Declaration</h2>
          </div>

          <div className="ti-form-section-body">
            <textarea
              className="ti-form-textarea"
              rows={4}
              value={formData.declaration}
              onChange={(e) =>
                updateField("declaration", e.target.value)
              }
            />
          </div>
        </section>

        {/* 9. Enclosures */}
        <section className="ti-form-section">
          <div className="ti-form-section-header">
            <span className="ti-form-section-number">09</span>
            <h2 className="ti-form-section-title">Enclosures</h2>
          </div>

          <div className="ti-form-section-body">
            <div className="ti-form-enclosure-list">
              {Object.keys(formData.enclosures).map((label) => (
                <label
                  key={label}
                  className="ti-form-checkbox"
                >
                  <input
                    type="checkbox"
                    checked={formData.enclosures[label]}
                    onChange={() => toggleEnclosure(label)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </section>

        <div className="ti-form-actions">
          <button
            type="button"
            className="ti-form-preview-btn"
            onClick={goToPrint}
          >
            Preview Invoice
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
