import { useState } from "react";
import {
  PackageCheck,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import {
  useMaterialStore,
  receiveGRN,
  statusOptions,
} from "../../data/materialStore";
import "./MaterialGRN.css";
import Header from "../../components/Header";
export default function MaterialGRN() {
  const { purchaseOrders } = useMaterialStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activePO, setActivePO] = useState(null);
  const [formData, setFormData] = useState({
    heatNumber: "",
    plateNumber: "",
    warehouse: "",
    rackLocation: "",
    batchNumber: "",
    receivedQty: "",
    receivedWeight: "",
    receivedDate: new Date().toISOString().slice(0, 10),
    inspectionStatus: "Pending",
    remarks: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate GRN number
  const generateGRNNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const timestamp = Date.now().toString().slice(-6);
    return `GRN-${year}${month}${day}-${timestamp}`;
  };

  const rows = purchaseOrders.filter((po) => {
    const matchesSearch =
      !search ||
      [po.poNumber, po.supplier, po.material, po.grade]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus = !statusFilter || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openReceive = (po) => {
    setActivePO(po);
    setFormData({
      heatNumber: po.heatNumber || "",
      plateNumber: po.plateNumber || "",
      warehouse: po.warehouse || "",
      rackLocation: "",
      batchNumber: "",
      receivedQty: po.pendingQty || "",
      receivedWeight: "",
      receivedDate: new Date().toISOString().slice(0, 10),
      inspectionStatus: "Pending",
      remarks: "",
    });
    setErrors({});
    setSuccessMessage("");
    setIsSubmitting(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.heatNumber.trim()) {
      newErrors.heatNumber = "Heat Number is required";
    }
    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = "Plate Number is required";
    }
    if (!formData.warehouse.trim()) {
      newErrors.warehouse = "Warehouse is required";
    }
    if (!formData.receivedDate) {
      newErrors.receivedDate = "Received Date is required";
    }

    const qty = Number(formData.receivedQty);
    if (!formData.receivedQty || qty <= 0) {
      newErrors.receivedQty = "Received Quantity must be greater than 0";
    } else if (qty > activePO.pendingQty) {
      newErrors.receivedQty = `Received Quantity cannot exceed Pending Quantity (${activePO.pendingQty})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const confirmReceive = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    const qty = Number(formData.receivedQty);

    // Calculate weight if not provided
    let weight = formData.receivedWeight
      ? Number(formData.receivedWeight)
      : null;
    if (!weight && activePO.weight) {
      weight = activePO.weight * qty;
    }

    const extra = {
      heatNumber: formData.heatNumber.trim(),
      plateNumber: formData.plateNumber.trim(),
      warehouse: formData.warehouse.trim(),
      rackLocation: formData.rackLocation.trim(),
      batchNumber: formData.batchNumber.trim(),
      receivedWeight: weight,
      receivedDate: formData.receivedDate,
      inspectionStatus: formData.inspectionStatus,
      remarks: formData.remarks.trim(),
      // Additional fields for Material Stock
      thickness: activePO.thickness,
      width: activePO.width,
      length: activePO.length,
      material: activePO.material,
      grade: activePO.grade,
      specification: activePO.specification,
    };

    try {
      receiveGRN(activePO.poNumber, qty, extra);
      setSuccessMessage(
        `✅ Successfully received ${qty} units for ${activePO.poNumber}`,
      );

      // Close modal after short delay
      setTimeout(() => {
        setActivePO(null);
        setSuccessMessage("");
        setIsSubmitting(false);
      }, 2000);
    } catch (error) {
      console.error("Error receiving material:", error);
      setErrors({ submit: "Failed to receive material. Please try again." });
      setIsSubmitting(false);
    }
  };

  // Navigation function
  const goBack = () => {
    window.history.back();
  };

  return (
    <>
          <Header />
    <div className="grn-page">
      {/* Back Button */}
      <button className="grn-back-btn" onClick={goBack}>
        <ArrowLeft size={18} /> Back
      </button>

      {/* Breadcrumb */}
      <div className="grn-breadcrumb">
        <span className="grn-breadcrumb-item">Inventory</span>
        <span className="grn-breadcrumb-sep">/</span>
        <span className="grn-breadcrumb-item">Material</span>
        <span className="grn-breadcrumb-sep">/</span>
        <span className="grn-breadcrumb-item">GRN</span>
      </div>

      {/* Header */}
      <div className="grn-header">
        <h1 className="grn-title">GRN — Goods Receipt Note</h1>
        <p className="grn-subtitle">
          Receive raw materials against open Purchase Orders. Received quantity
          flows directly into Material Stock.
        </p>
      </div>

      {/* Toolbar */}
      <div className="grn-toolbar">
        <div className="grn-search">
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
            placeholder="Search by PO number, supplier or grade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grn-filters">
          <select
            className="grn-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {statusOptions.po.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grn-stat-row">
        <div className="grn-stat-card">
          <div className="grn-stat-value">{purchaseOrders.length}</div>
          <div className="grn-stat-label">Total POs</div>
        </div>
        <div className="grn-stat-card">
          <div className="grn-stat-value">
            {purchaseOrders.filter((po) => po.status === "Pending").length}
          </div>
          <div className="grn-stat-label">Pending</div>
        </div>
        <div className="grn-stat-card">
          <div className="grn-stat-value">
            {purchaseOrders.filter((po) => po.status === "Partial").length}
          </div>
          <div className="grn-stat-label">Partial</div>
        </div>
        <div className="grn-stat-card">
          <div className="grn-stat-value">
            {purchaseOrders.filter((po) => po.status === "Completed").length}
          </div>
          <div className="grn-stat-label">Completed</div>
        </div>
      </div>

      {/* Table */}
      <div className="grn-table-wrap">
        <div className="grn-table-scroll">
          <table className="grn-table">
            <thead>
              <tr>
                <th className="grn-col-po">PO Number</th>
                <th className="grn-col-material">Material</th>
                <th className="grn-col-thk">Thickness</th>
                <th className="grn-col-width">Width</th>
                <th className="grn-col-length">Length</th>
                <th className="grn-col-qty">Ordered</th>
                <th className="grn-col-qty">Received</th>
                <th className="grn-col-qty">Pending</th>
                <th className="grn-col-date">Delivery Date</th>
                <th className="grn-col-status">Status</th>
                <th className="grn-col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((po) => (
                <tr key={po.poNumber}>
                  <td className="grn-col-po">
                    <strong>{po.poNumber}</strong>
                  </td>
                  <td className="grn-col-material">{po.material}</td>
                  <td className="grn-col-thk">{po.thickness}</td>
                  <td className="grn-col-width">{po.width}</td>
                  <td className="grn-col-length">{po.length}</td>
                  <td className="grn-col-qty">{po.orderedQty}</td>
                  <td className="grn-col-qty">{po.receivedQty}</td>
                  <td className="grn-col-qty">{po.pendingQty}</td>
                  <td className="grn-col-date">{po.expectedDeliveryDate}</td>
                  <td className="grn-col-status">
                    <span
                      className={`grn-status-badge ${
                        po.status === "Completed"
                          ? "grn-status-success"
                          : po.status === "Partial"
                            ? "grn-status-warning"
                            : "grn-status-neutral"
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="grn-col-action">
                    <button
                      className="grn-btn grn-btn-accent"
                      disabled={po.pendingQty <= 0}
                      onClick={() => openReceive(po)}
                    >
                      <PackageCheck size={14} /> Receive
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="grn-table-empty">
                    No purchase orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {activePO && (
        <div
          className="grn-modal-backdrop"
          onClick={() => !isSubmitting && setActivePO(null)}
        >
          <div className="grn-modal" onClick={(e) => e.stopPropagation()}>
            <div className="grn-modal-header">
              <h3>GRN Entry — {activePO.poNumber}</h3>
              <button
                className="grn-btn-icon"
                onClick={() => !isSubmitting && setActivePO(null)}
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            {successMessage && (
              <div className="grn-success-message">
                <CheckCircle size={18} />
                {successMessage}
              </div>
            )}

            {errors.submit && (
              <div className="grn-error-message">
                <AlertCircle size={18} />
                {errors.submit}
              </div>
            )}

            <div className="grn-modal-body">
              <div className="grn-grid">
                <div className="grn-field">
                  <label>GRN Number</label>
                  <input
                    type="text"
                    value={generateGRNNumber()}
                    disabled
                    className="grn-readonly"
                  />
                </div>
                <div className="grn-field">
                  <label>PO Number</label>
                  <input
                    type="text"
                    value={activePO.poNumber}
                    disabled
                    className="grn-readonly"
                  />
                </div>
                <div className="grn-field">
                  <label>Supplier</label>
                  <input
                    type="text"
                    value={activePO.supplier}
                    disabled
                    className="grn-readonly"
                  />
                </div>
                <div className="grn-field">
                  <label>Material</label>
                  <input
                    type="text"
                    value={activePO.material}
                    disabled
                    className="grn-readonly"
                  />
                </div>
                <div className="grn-field">
                  <label>Grade</label>
                  <input
                    type="text"
                    value={activePO.grade}
                    disabled
                    className="grn-readonly"
                  />
                </div>
                <div className="grn-field">
                  <label>Specification</label>
                  <input
                    type="text"
                    value={activePO.specification}
                    disabled
                    className="grn-readonly"
                  />
                </div>
                <div className="grn-field">
                  <label>Thickness (mm)</label>
                  <input
                    type="text"
                    value={activePO.thickness}
                    disabled
                    className="grn-readonly"
                  />
                </div>
                <div className="grn-field">
                  <label>Width (mm)</label>
                  <input
                    type="text"
                    value={activePO.width}
                    disabled
                    className="grn-readonly"
                  />
                </div>
                <div className="grn-field">
                  <label>Length (mm)</label>
                  <input
                    type="text"
                    value={activePO.length}
                    disabled
                    className="grn-readonly"
                  />
                </div>
                <div className="grn-field">
                  <label>Ordered Quantity</label>
                  <input
                    type="text"
                    value={activePO.orderedQty}
                    disabled
                    className="grn-readonly"
                  />
                </div>
                <div className="grn-field">
                  <label>Already Received</label>
                  <input
                    type="text"
                    value={activePO.receivedQty}
                    disabled
                    className="grn-readonly"
                  />
                </div>
                <div className="grn-field">
                  <label>Pending Quantity</label>
                  <input
                    type="text"
                    value={activePO.pendingQty}
                    disabled
                    className="grn-readonly"
                  />
                </div>
              </div>

              <div className="grn-divider">Receiving Details</div>

              <div className="grn-grid">
                <div className="grn-field grn-required">
                  <label>Heat Number</label>
                  <input
                    type="text"
                    value={formData.heatNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, heatNumber: e.target.value })
                    }
                    className={errors.heatNumber ? "grn-error" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.heatNumber && (
                    <span className="grn-error-text">{errors.heatNumber}</span>
                  )}
                </div>
                <div className="grn-field grn-required">
                  <label>Plate Number</label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, plateNumber: e.target.value })
                    }
                    className={errors.plateNumber ? "grn-error" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.plateNumber && (
                    <span className="grn-error-text">{errors.plateNumber}</span>
                  )}
                </div>
                <div className="grn-field grn-required">
                  <label>Warehouse</label>
                  <input
                    type="text"
                    value={formData.warehouse}
                    onChange={(e) =>
                      setFormData({ ...formData, warehouse: e.target.value })
                    }
                    className={errors.warehouse ? "grn-error" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.warehouse && (
                    <span className="grn-error-text">{errors.warehouse}</span>
                  )}
                </div>
                <div className="grn-field">
                  <label>Rack Location</label>
                  <input
                    type="text"
                    value={formData.rackLocation}
                    onChange={(e) =>
                      setFormData({ ...formData, rackLocation: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grn-field">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, batchNumber: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grn-field grn-required">
                  <label>Received Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={activePO.pendingQty}
                    value={formData.receivedQty}
                    onChange={(e) =>
                      setFormData({ ...formData, receivedQty: e.target.value })
                    }
                    className={errors.receivedQty ? "grn-error" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.receivedQty && (
                    <span className="grn-error-text">{errors.receivedQty}</span>
                  )}
                </div>
                <div className="grn-field">
                  <label>Received Weight (kg)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={formData.receivedWeight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        receivedWeight: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                  <small className="grn-field-hint">
                    Optional - will auto-calculate if not provided
                  </small>
                </div>
                <div className="grn-field grn-required">
                  <label>Received Date</label>
                  <input
                    type="date"
                    value={formData.receivedDate}
                    onChange={(e) =>
                      setFormData({ ...formData, receivedDate: e.target.value })
                    }
                    className={errors.receivedDate ? "grn-error" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.receivedDate && (
                    <span className="grn-error-text">
                      {errors.receivedDate}
                    </span>
                  )}
                </div>
                <div className="grn-field">
                  <label>Inspection Status</label>
                  <select
                    value={formData.inspectionStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inspectionStatus: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Partial Pass">Partial Pass</option>
                  </select>
                </div>
                <div className="grn-field grn-full-width">
                  <label>Remarks</label>
                  <textarea
                    rows={2}
                    value={formData.remarks}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="grn-modal-actions">
              <button
                className="grn-btn grn-btn-outline"
                onClick={() => !isSubmitting && setActivePO(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="grn-btn grn-btn-primary"
                onClick={confirmReceive}
                disabled={isSubmitting || !!successMessage}
              >
                {isSubmitting ? "Processing..." : "Receive Material"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
