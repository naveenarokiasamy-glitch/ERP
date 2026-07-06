import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ConsumableGRN.css";
import {
  ArrowLeft,
  PackagePlus,
  Search,
  ClipboardList,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import Header from "../../components/Header";
import consumableStore from "../../data/consumableStore";
// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//   ArrowLeft,
//   PackagePlus,
//   Search,
//   ClipboardList,
//   Clock,
//   CheckCircle2,
//   X,
// } from "lucide-react";
// import Header from "../../components/Header";
// import consumableStore from "../../store/consumableStore";

const initialReceiveForm = {
  quantityReceived: "",
  receivedBy: "",
  remarks: "",
};

const initialDirectForm = {
  supplier: "",
  consumableName: "",
  category: "",
  unit: "",
  quantity: "",
  warehouse: "",
  receivedBy: "",
  remarks: "",
};

export default function ConsumableGRN() {
  const [purchaseOrders, setPurchaseOrders] = useState(
    consumableStore.getPurchaseOrders(),
  );
  const [search, setSearch] = useState("");

  const [selectedPO, setSelectedPO] = useState(null);
  const [receiveForm, setReceiveForm] = useState(initialReceiveForm);

  const [showDirectModal, setShowDirectModal] = useState(false);
  const [directForm, setDirectForm] = useState(initialDirectForm);

  useEffect(() => {
    const unsubscribe = consumableStore.subscribe(() => {
      setPurchaseOrders([...consumableStore.getPurchaseOrders()]);
    });
    return unsubscribe;
  }, []);

  const filteredPOs = purchaseOrders.filter((po) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      po.poNumber.toLowerCase().includes(term) ||
      po.supplier.toLowerCase().includes(term) ||
      po.consumableName.toLowerCase().includes(term) ||
      po.category.toLowerCase().includes(term)
    );
  });

  const stats = {
    total: purchaseOrders.length,
    pending: purchaseOrders.filter((po) => po.status === "Pending").length,
    partial: purchaseOrders.filter((po) => po.status === "Partially Received")
      .length,
    completed: purchaseOrders.filter((po) => po.status === "Completed").length,
  };

  function openReceiveModal(po) {
    setSelectedPO(po);
    setReceiveForm(initialReceiveForm);
  }

  function closeReceiveModal() {
    setSelectedPO(null);
    setReceiveForm(initialReceiveForm);
  }

  function handleReceiveSubmit(e) {
    e.preventDefault();
    if (!selectedPO) return;
    if (!receiveForm.quantityReceived || !receiveForm.receivedBy) return;

    consumableStore.receiveConsumableGRN(selectedPO.poNumber, {
      quantityReceived: Number(receiveForm.quantityReceived),
      receivedBy: receiveForm.receivedBy,
      remarks: receiveForm.remarks,
    });

    closeReceiveModal();
  }

  function openDirectModal() {
    setDirectForm(initialDirectForm);
    setShowDirectModal(true);
  }

  function closeDirectModal() {
    setShowDirectModal(false);
    setDirectForm(initialDirectForm);
  }

  function handleDirectChange(field, value) {
    setDirectForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDirectSubmit(e) {
    e.preventDefault();
    const {
      supplier,
      consumableName,
      category,
      unit,
      quantity,
      warehouse,
      receivedBy,
    } = directForm;
    if (
      !supplier ||
      !consumableName ||
      !category ||
      !unit ||
      !quantity ||
      !warehouse ||
      !receivedBy
    ) {
      return;
    }

    consumableStore.createDirectConsumableGRN({
      ...directForm,
      quantity: Number(directForm.quantity),
    });

    closeDirectModal();
  }

  return (
    <>
      <Header />
      <div className="consumable-grn-page">
        <Link to="/inventory/consumable" className="consumable-back">
          <ArrowLeft size={15} />
          Consumables
        </Link>

        <header className="consumable-grn-header">
          <span className="consumable-eyebrow">Consumables</span>
          <h1 className="consumable-title">Consumable GRN</h1>
          <p className="consumable-subtitle">
            Receive consumables against Purchase Orders, or record a Direct GRN
            for local purchases.
          </p>
        </header>

        <div className="consumable-grn-stats">
          <div className="stat-card">
            <ClipboardList size={20} />
            <div>
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Purchase Orders</span>
            </div>
          </div>
          <div className="stat-card">
            <Clock size={20} />
            <div>
              <span className="stat-value">{stats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          <div className="stat-card">
            <Clock size={20} />
            <div>
              <span className="stat-value">{stats.partial}</span>
              <span className="stat-label">Partially Received</span>
            </div>
          </div>
          <div className="stat-card">
            <CheckCircle2 size={20} />
            <div>
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>

        <div className="consumable-grn-toolbar">
          <div className="consumable-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search PO, supplier, consumable, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={openDirectModal}>
            <PackagePlus size={16} />
            New Direct GRN
          </button>
        </div>

        <div className="consumable-table-wrapper">
          <table className="consumable-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Consumable</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Ordered Qty</th>
                <th>Received Qty</th>
                <th>Pending Qty</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.map((po) => (
                <tr key={po.id}>
                  <td>{po.poNumber}</td>
                  <td>{po.supplier}</td>
                  <td>{po.consumableName}</td>
                  <td>{po.category}</td>
                  <td>{po.unit}</td>
                  <td>{po.orderedQty}</td>
                  <td>{po.receivedQty}</td>
                  <td>{po.pendingQty}</td>
                  <td>{po.warehouse}</td>
                  <td>
                    <span
                      className={`status-badge status-${po.status.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      disabled={po.status === "Completed"}
                      onClick={() => openReceiveModal(po)}
                    >
                      Receive
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPOs.length === 0 && (
                <tr>
                  <td colSpan={11} className="consumable-empty-row">
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedPO && (
          <div className="modal-overlay" onClick={closeReceiveModal}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Receive Consumable</h3>
                <button className="modal-close" onClick={closeReceiveModal}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-info-grid">
                  <div>
                    <span className="modal-info-label">PO Number</span>
                    <span className="modal-info-value">
                      {selectedPO.poNumber}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Consumable</span>
                    <span className="modal-info-value">
                      {selectedPO.consumableName}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Ordered Quantity</span>
                    <span className="modal-info-value">
                      {selectedPO.orderedQty}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Received Quantity</span>
                    <span className="modal-info-value">
                      {selectedPO.receivedQty}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Pending Quantity</span>
                    <span className="modal-info-value">
                      {selectedPO.pendingQty}
                    </span>
                  </div>
                </div>

                <form className="modal-form" onSubmit={handleReceiveSubmit}>
                  <label>
                    Quantity Received
                    <input
                      type="number"
                      min="1"
                      max={selectedPO.pendingQty}
                      value={receiveForm.quantityReceived}
                      onChange={(e) =>
                        setReceiveForm((prev) => ({
                          ...prev,
                          quantityReceived: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label>
                    Received By
                    <input
                      type="text"
                      value={receiveForm.receivedBy}
                      onChange={(e) =>
                        setReceiveForm((prev) => ({
                          ...prev,
                          receivedBy: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label>
                    Remarks
                    <textarea
                      value={receiveForm.remarks}
                      onChange={(e) =>
                        setReceiveForm((prev) => ({
                          ...prev,
                          remarks: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={closeReceiveModal}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showDirectModal && (
          <div className="modal-overlay" onClick={closeDirectModal}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>New Direct GRN</h3>
                <button className="modal-close" onClick={closeDirectModal}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <form className="modal-form" onSubmit={handleDirectSubmit}>
                  <label>
                    Supplier
                    <input
                      type="text"
                      value={directForm.supplier}
                      onChange={(e) =>
                        handleDirectChange("supplier", e.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Consumable Name
                    <input
                      type="text"
                      value={directForm.consumableName}
                      onChange={(e) =>
                        handleDirectChange("consumableName", e.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Category
                    <input
                      type="text"
                      value={directForm.category}
                      onChange={(e) =>
                        handleDirectChange("category", e.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Unit
                    <input
                      type="text"
                      placeholder="Nos, Kg, Litre..."
                      value={directForm.unit}
                      onChange={(e) =>
                        handleDirectChange("unit", e.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Quantity
                    <input
                      type="number"
                      min="1"
                      value={directForm.quantity}
                      onChange={(e) =>
                        handleDirectChange("quantity", e.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Warehouse
                    <input
                      type="text"
                      value={directForm.warehouse}
                      onChange={(e) =>
                        handleDirectChange("warehouse", e.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Received By
                    <input
                      type="text"
                      value={directForm.receivedBy}
                      onChange={(e) =>
                        handleDirectChange("receivedBy", e.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Remarks
                    <textarea
                      value={directForm.remarks}
                      onChange={(e) =>
                        handleDirectChange("remarks", e.target.value)
                      }
                    />
                  </label>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={closeDirectModal}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
