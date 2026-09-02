import { useState, useRef, useEffect } from "react";
import {
  Scissors,
  X,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Factory,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMaterialStore, issueToCutting } from "../../data/materialStore";
import "./issuematerialtocutting.css";
import Header from "../../components/Header";
import "../../styles/BackButton.css";
import { Link } from "react-router-dom";
let jobSeq = 2003;
// Separate sequence for Outsourcing jobs so job numbers never collide with
// In House cutting job numbers (CUT-xxxx).
let outJobSeq = 5001;

export default function IssueMaterialToCutting() {
  const { materialStock } = useMaterialStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [activeRow, setActiveRow] = useState(null);
  // Row waiting on the "Where do you want to issue the material?" choice,
  // shown before either the existing In House modal opens or we redirect
  // to the Delivery Challan form for Outsourcing.
  const [choiceRow, setChoiceRow] = useState(null);
  const [form, setForm] = useState({
    jobNumber: "",
    issuedQty: "",
    issuedBy: "",
    remarks: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(true);

  const scrollRef = useRef(null);

  // Get unique warehouses and materials for filters
  const warehouses = [...new Set(materialStock.map((r) => r.warehouse))];
  const materials = [...new Set(materialStock.map((r) => r.material))];

  // Filter available stock (availableQty > 0)
  const availableStock = materialStock.filter((r) => r.availableQty > 0);

 const rows = availableStock.filter((r) => {
    const searchValue = search.trim().toLowerCase();
 
    const matchesWarehouse =
      !warehouseFilter || r.warehouse === warehouseFilter;
 
    const matchesMaterial = !materialFilter || r.material === materialFilter;
 
    if (!searchValue) {
      return matchesWarehouse && matchesMaterial;
    }
 
    // If searching a number, prioritize thickness
    const isNumericSearch = /^\d+(\.\d+)?$/.test(searchValue);
 
    if (isNumericSearch) {
      const thicknessMatches = String(r.thickness ?? "")
        .toLowerCase()
        .includes(searchValue);
 
      return thicknessMatches && matchesWarehouse && matchesMaterial;
    }
 
    // Otherwise search text fields
    const matchesText = [
      r.material,
      r.grade,
      r.heatNumber,
      r.plateNumber,
      r.poNumber,
      r.batchNumber,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchValue);
 
    return matchesText && matchesWarehouse && matchesMaterial;
  });

  // Calculate total available for stats
  const totalAvailableQty = availableStock.reduce(
    (sum, r) => sum + r.availableQty,
    0,
  );
  const totalLots = availableStock.length;
  const totalWeight = availableStock.reduce(
    (sum, r) => sum + (r.weight * r.availableQty || 0),
    0,
  );

  // Handle scroll shadows
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftShadow(scrollLeft > 0);
      setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollTable = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollRef.current.scrollLeft;
      scrollRef.current.scrollTo({
        left:
          direction === "left"
            ? currentScroll - scrollAmount
            : currentScroll + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const openIssue = (row) => {
    setActiveRow(row);
    setForm({
      jobNumber: `CUT-${jobSeq++}`,
      issuedQty: "",
      issuedBy: "",
      remarks: "",
    });
    setErrors({});
    setSuccessMessage("");
    setIsSubmitting(false);
  };

  // Step 0 — clicking "Issue" in the table now asks where the material
  // should go, instead of opening the In House modal directly.
  const handleIssueClick = (row) => {
    setChoiceRow(row);
  };

  const closeChoiceModal = () => setChoiceRow(null);

  // Option 1: In House — unchanged current behaviour, just triggered one
  // click later (after the choice is made).
  const chooseInHouse = () => {
    const row = choiceRow;
    setChoiceRow(null);
    openIssue(row);
  };

  // Option 2: Outsourcing — do NOT open the cutting modal / create a
  // cutting job. Instead, hand off to the existing Delivery Challan form
  // with the selected material's details auto-filled via route state.
  const chooseOutsourcing = () => {
    const row = choiceRow;
    setChoiceRow(null);
    const jobNumber = `OUT-${outJobSeq++}`;
    navigate("/accounts/DeliveryChallan", {
      state: {
        outsourcingIssue: {
          stockId: row.id,
          jobNumber,
          poNumber: row.poNumber,
          material: row.material,
          grade: row.grade,
          thickness: row.thickness,
          width: row.width,
          length: row.length,
          plateNumber: row.plateNumber,
          heatNumber: row.heatNumber,
          availableQty: row.availableQty,
          warehouse: row.warehouse,
        },
      },
    });
  };

  const closeModal = () => {
    if (!isSubmitting) {
      setActiveRow(null);
      setSuccessMessage("");
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.issuedQty || Number(form.issuedQty) <= 0) {
      newErrors.issuedQty = "Issued Quantity must be greater than 0";
    } else if (Number(form.issuedQty) > activeRow.availableQty) {
      newErrors.issuedQty = `Issued Quantity cannot exceed Available Quantity (${activeRow.availableQty})`;
    }

    if (!form.issuedBy.trim()) {
      newErrors.issuedBy = "Issued By is required";
    }

    if (!form.jobNumber.trim()) {
      newErrors.jobNumber = "Job Number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    const issuedQty = Number(form.issuedQty);

    try {
      issueToCutting({
        stockId: activeRow.id,
        jobNumber: form.jobNumber.trim(),
        issuedQty,
        issuedBy: form.issuedBy.trim(),
        remarks: form.remarks.trim() || "-",
      });

      setSuccessMessage(
        `✅ Successfully issued ${issuedQty} units to ${form.jobNumber}`,
      );

      setTimeout(() => {
        setActiveRow(null);
        setSuccessMessage("");
        setIsSubmitting(false);
      }, 2000);
    } catch (error) {
      console.error("Error issuing material:", error);
      setErrors({ submit: "Failed to issue material. Please try again." });
      setIsSubmitting(false);
    }
  };


  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      "In Stock": "imtc-status-success",
      "Partially Issued": "imtc-status-warning",
      "Fully Issued": "imtc-status-danger",
      Available: "imtc-status-success",
      "Issued to Production": "imtc-status-info",
      Received: "imtc-status-neutral",
    };
    return statusMap[status] || "imtc-status-neutral";
  };

  return (
    <>
      <Header />
    <div className="imtc-page">
      

      {/* Breadcrumb */}
      <div className="imtc-breadcrumb">
        <Link to="/inventory" className="imtc-breadcrumb-item">
            Inventory
        </Link>

        <span className="imtc-breadcrumb-sep">/</span>

        <Link to="/inventory/material" className="imtc-breadcrumb-item">
          Material
        </Link>

        <span className="imtc-breadcrumb-sep">/</span>

        <span className="imtc-breadcrumb-item">Issue to Cutting</span>
        
      </div>
   <Link to="/inventory/material" className="erp-back-button">
  <ArrowLeft size={16} />
  Back
</Link>
      

      {/* Header */}
      <div className="imtc-header">
        <h1 className="imtc-title">Issue Material to Cutting</h1>
        <p className="imtc-subtitle">
          Issue raw plates from Material Stock to a cutting job. Reduces
          available stock immediately and creates a cutting job record.
        </p>
      </div>

      {/* Toolbar */}
      <div className="imtc-toolbar">
        <div className="imtc-search">
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
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by material, material thickness , grade, heat no., plate no., or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="imtc-filters">
          <select
            className="imtc-filter-select"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          <select
            className="imtc-filter-select"
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
          >
            <option value="">All Materials</option>
            {materials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="imtc-stat-row">
        <div className="imtc-stat-card">
          <div className="imtc-stat-value">{totalLots}</div>
          <div className="imtc-stat-label">Available Lots</div>
        </div>
        <div className="imtc-stat-card">
          <div className="imtc-stat-value">{totalAvailableQty}</div>
          <div className="imtc-stat-label">Available Qty (Units)</div>
        </div>
        <div className="imtc-stat-card">
          <div className="imtc-stat-value">{totalWeight.toFixed(1)}</div>
          <div className="imtc-stat-label">Total Weight (kg)</div>
        </div>
        <div className="imtc-stat-card">
          <div className="imtc-stat-value">{warehouses.length}</div>
          <div className="imtc-stat-label">Warehouses</div>
        </div>
      </div>

      {/* Table */}
      <div
        className={`imtc-table-wrap ${showLeftShadow ? "imtc-scroll-left" : ""} ${showRightShadow ? "imtc-scroll-right" : ""}`}
      >
        <div className="imtc-table-scroll" ref={scrollRef}>
          <table className="imtc-table">
            <thead>
              <tr>
                <th className="imtc-col-po">PO Number</th>
                <th className="imtc-col-material">Material</th>
                <th className="imtc-col-grade">Grade</th>
                <th className="imtc-col-spec">Specification</th>
                <th className="imtc-col-thk">Thk (mm)</th>
                <th className="imtc-col-width">Width (mm)</th>
                <th className="imtc-col-length">Length (mm)</th>
                <th className="imtc-col-plate">Plate No.</th>
                <th className="imtc-col-qty">Available Qty</th>
                <th className="imtc-col-warehouse">Warehouse</th>
                <th className="imtc-col-rack">Rack Location</th>
                <th className="imtc-col-weight">Weight (kg)</th>
                <th className="imtc-col-status">Status</th>
                <th className="imtc-col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="imtc-col-po">
                    <strong>{r.poNumber}</strong>
                  </td>
                  <td className="imtc-col-material">{r.material}</td>
                  <td className="imtc-col-grade">{r.grade}</td>
                  <td className="imtc-col-spec">{r.specification || "-"}</td>
                  <td className="imtc-col-thk">{r.thickness}</td>
                  <td className="imtc-col-width">{r.width}</td>
                  <td className="imtc-col-length">{r.length}</td>
                  <td className="imtc-col-plate">
                    <span className="imtc-text-mono">{r.plateNumber}</span>
                  </td>
                  <td className="imtc-col-qty">
                    <strong className="imtc-available-qty">
                      {r.availableQty}
                    </strong>
                  </td>
                  <td className="imtc-col-warehouse">{r.warehouse}</td>
                  <td className="imtc-col-rack">{r.rackLocation || "-"}</td>
                  <td className="imtc-col-weight">
                    {r.weight ? (r.weight * r.availableQty).toFixed(1) : "-"}
                  </td>
                  <td className="imtc-col-status">
                    <span
                      className={`imtc-status-badge ${getStatusBadgeClass(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="imtc-col-action">
                    <button
                      className="imtc-btn imtc-btn-accent"
                      onClick={() => handleIssueClick(r)}
                      disabled={r.availableQty <= 0}
                    >
                      <Scissors size={14} /> Issue
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={14} className="imtc-table-empty">
                    {availableStock.length === 0
                      ? "No available stock to issue. Please receive materials via GRN first."
                      : "No stock matches your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="imtc-scroll-buttons">
          <button
            className="imtc-scroll-btn"
            onClick={() => scrollTable("left")}
          >
            <ChevronLeft size={16} /> Left
          </button>
          <button
            className="imtc-scroll-btn"
            onClick={() => scrollTable("right")}
          >
            Right <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Choice Modal — "Where do you want to issue the material?" */}
      {choiceRow && (
        <div className="imtc-modal-backdrop" onClick={closeChoiceModal}>
          <div className="imtc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="imtc-modal-header">
              <h3>Where do you want to issue the material?</h3>
              <button className="imtc-btn-icon" onClick={closeChoiceModal}>
                <X size={20} />
              </button>
            </div>
            <div className="imtc-modal-body">
              <p className="imtc-subtitle" style={{ marginBottom: "1rem" }}>
                {choiceRow.material} ({choiceRow.grade}) — Plate{" "}
                {choiceRow.plateNumber}, {choiceRow.availableQty} units
                available.
              </p>
              <div className="imtc-grid-issue">
                <button
                  type="button"
                  className="imtc-btn imtc-btn-outline imtc-full-width"
                  onClick={chooseInHouse}
                  style={{ justifyContent: "flex-start", padding: "1rem" }}
                >
                  <Factory size={18} /> In House
                </button>
                <button
                  type="button"
                  className="imtc-btn imtc-btn-outline imtc-full-width"
                  onClick={chooseOutsourcing}
                  style={{ justifyContent: "flex-start", padding: "1rem" }}
                >
                  <Truck size={18} /> Outsourcing
                </button>
              </div>
            </div>
            <div className="imtc-modal-actions">
              <button
                className="imtc-btn imtc-btn-outline"
                onClick={closeChoiceModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {activeRow && (
        <div className="imtc-modal-backdrop" onClick={closeModal}>
          <div className="imtc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="imtc-modal-header">
              <h3>Issue Material to Cutting</h3>
              <button
                className="imtc-btn-icon"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            {successMessage && (
              <div className="imtc-success-message">
                <CheckCircle size={18} />
                {successMessage}
              </div>
            )}

            {errors.submit && (
              <div className="imtc-error-message">
                <AlertCircle size={18} />
                {errors.submit}
              </div>
            )}

            <div className="imtc-modal-body">
              <div className="imtc-grid-issue">
                <div className="imtc-field imtc-full-width">
                  <label>Material Details</label>
                  <div className="imtc-detail-box">
                    <div className="imtc-detail-row">
                      <span className="imtc-detail-label">PO Number:</span>
                      <span className="imtc-detail-value">
                        {activeRow.poNumber}
                      </span>
                    </div>
                    <div className="imtc-detail-row">
                      <span className="imtc-detail-label">Material:</span>
                      <span className="imtc-detail-value">
                        {activeRow.material}
                      </span>
                    </div>
                    <div className="imtc-detail-row">
                      <span className="imtc-detail-label">Grade:</span>
                      <span className="imtc-detail-value">
                        {activeRow.grade}
                      </span>
                    </div>
                    <div className="imtc-detail-row">
                      <span className="imtc-detail-label">Plate Number:</span>
                      <span className="imtc-detail-value">
                        {activeRow.plateNumber}
                      </span>
                    </div>
                    <div className="imtc-detail-row">
                      <span className="imtc-detail-label">Heat Number:</span>
                      <span className="imtc-detail-value">
                        {activeRow.heatNumber}
                      </span>
                    </div>
                    <div className="imtc-detail-row">
                      <span className="imtc-detail-label">Available Qty:</span>
                      <span className="imtc-detail-value imtc-highlight">
                        {activeRow.availableQty} units
                      </span>
                    </div>
                    <div className="imtc-detail-row">
                      <span className="imtc-detail-label">Warehouse:</span>
                      <span className="imtc-detail-value">
                        {activeRow.warehouse}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="imtc-field imtc-required">
                  <label>Cutting Job Number</label>
                  <input
                    value={form.jobNumber}
                    onChange={(e) =>
                      setForm({ ...form, jobNumber: e.target.value })
                    }
                    className={errors.jobNumber ? "error" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.jobNumber && (
                    <span className="imtc-error-text">{errors.jobNumber}</span>
                  )}
                </div>

                <div className="imtc-field imtc-required">
                  <label>Issued Quantity</label>
                  <input
                    type="number"
                    max={activeRow.availableQty}
                    min={1}
                    value={form.issuedQty}
                    onChange={(e) =>
                      setForm({ ...form, issuedQty: e.target.value })
                    }
                    className={errors.issuedQty ? "error" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.issuedQty && (
                    <span className="imtc-error-text">{errors.issuedQty}</span>
                  )}
                  <small className="imtc-field-hint">
                    Max: {activeRow.availableQty} units
                  </small>
                </div>

                <div className="imtc-field imtc-required">
                  <label>Issued By</label>
                  <input
                    value={form.issuedBy}
                    onChange={(e) =>
                      setForm({ ...form, issuedBy: e.target.value })
                    }
                    placeholder="Employee name"
                    className={errors.issuedBy ? "error" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.issuedBy && (
                    <span className="imtc-error-text">{errors.issuedBy}</span>
                  )}
                </div>

                <div className="imtc-field imtc-full-width">
                  <label>Remarks</label>
                  <textarea
                    rows={2}
                    value={form.remarks}
                    onChange={(e) =>
                      setForm({ ...form, remarks: e.target.value })
                    }
                    placeholder="Optional remarks about this issue"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="imtc-modal-actions">
              <button
                className="imtc-btn imtc-btn-outline"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="imtc-btn imtc-btn-primary"
                onClick={submit}
                disabled={isSubmitting || !!successMessage}
              >
                {isSubmitting ? "Processing..." : "Issue Material"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}