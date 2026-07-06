import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Send, Boxes, X } from "lucide-react";
import Header from "../../components/Header";
import consumableStore from "../../data/consumableStore";
import "./IssueConsumable.css";

// import { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import { ArrowLeft, Search, Send, Boxes, X } from "lucide-react";
// import Header from "../../components/Header";
// import consumableStore from "../../store/consumableStore";

const initialIssueForm = {
  department: "",
  employeeName: "",
  jobCard: "",
  quantity: "",
  remarks: "",
};

export default function IssueConsumable() {
  const [stock, setStock] = useState(consumableStore.getConsumableStock());
  const [search, setSearch] = useState("");

  const [selectedStock, setSelectedStock] = useState(null);
  const [issueForm, setIssueForm] = useState(initialIssueForm);

  useEffect(() => {
    const unsubscribe = consumableStore.subscribe(() => {
      setStock([...consumableStore.getConsumableStock()]);
    });
    return unsubscribe;
  }, []);

  // Only consumables that currently have stock on hand can be issued.
  const availableStock = useMemo(
    () => stock.filter((item) => item.availableQty > 0),
    [stock],
  );

  const filteredStock = availableStock.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      item.consumableName.toLowerCase().includes(term) ||
      item.referenceNumber.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.warehouse.toLowerCase().includes(term)
    );
  });

  const totalAvailableItems = availableStock.length;
  const totalAvailableQty = availableStock.reduce(
    (sum, item) => sum + item.availableQty,
    0,
  );

  function openIssueModal(stockItem) {
    setSelectedStock(stockItem);
    setIssueForm(initialIssueForm);
  }

  function closeIssueModal() {
    setSelectedStock(null);
    setIssueForm(initialIssueForm);
  }

  function handleIssueChange(field, value) {
    setIssueForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleIssueSubmit(e) {
    e.preventDefault();
    if (!selectedStock) return;

    const { department, employeeName, jobCard, quantity, remarks } = issueForm;
    if (!department || !employeeName || !quantity) return;

    const qty = Number(quantity);
    if (qty <= 0 || qty > selectedStock.availableQty) return;

    consumableStore.issueConsumable(selectedStock.id, {
      department,
      employeeName,
      jobCard,
      quantity: qty,
      remarks,
    });

    closeIssueModal();
  }

  return (
    <>
      <Header />
      <div className="consumable-stock-page">
        <Link to="/inventory/consumable" className="consumable-back">
          <ArrowLeft size={15} />
          Consumables
        </Link>

        <header className="consumable-stock-header">
          <span className="consumable-eyebrow">Consumables</span>
          <h1 className="consumable-title">Issue Consumables</h1>
          <p className="consumable-subtitle">
            Issue available consumable stock to a department, employee, or job
            card / production order.
          </p>
        </header>

        <div className="consumable-stock-stats">
          <div className="stat-card">
            <Boxes size={20} />
            <div>
              <span className="stat-value">{totalAvailableItems}</span>
              <span className="stat-label">Consumables Available</span>
            </div>
          </div>
          <div className="stat-card">
            <Send size={20} />
            <div>
              <span className="stat-value">{totalAvailableQty}</span>
              <span className="stat-label">Total Available Quantity</span>
            </div>
          </div>
        </div>

        <div className="consumable-stock-toolbar">
          <div className="consumable-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search consumable, reference, category, warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="consumable-table-wrapper">
          <table className="consumable-table">
            <thead>
              <tr>
                <th>Reference Number</th>
                <th>Consumable</th>
                <th>Category</th>
                <th>Warehouse</th>
                <th>Available Quantity</th>
                <th>Unit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => (
                <tr key={item.id}>
                  <td>{item.referenceNumber}</td>
                  <td>{item.consumableName}</td>
                  <td>{item.category}</td>
                  <td>{item.warehouse}</td>
                  <td>{item.availableQty}</td>
                  <td>{item.unit}</td>
                  <td>
                    <button
                      className="btn-primary"
                      onClick={() => openIssueModal(item)}
                    >
                      Issue
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={7} className="consumable-empty-row">
                    No available consumable stock to issue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedStock && (
          <div className="modal-overlay" onClick={closeIssueModal}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Issue Consumable</h3>
                <button className="modal-close" onClick={closeIssueModal}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-info-grid">
                  <div>
                    <span className="modal-info-label">Consumable</span>
                    <span className="modal-info-value">
                      {selectedStock.consumableName}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Available Quantity</span>
                    <span className="modal-info-value">
                      {selectedStock.availableQty} {selectedStock.unit}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Warehouse</span>
                    <span className="modal-info-value">
                      {selectedStock.warehouse}
                    </span>
                  </div>
                </div>

                <form className="modal-form" onSubmit={handleIssueSubmit}>
                  <label>
                    Department
                    <input
                      type="text"
                      value={issueForm.department}
                      onChange={(e) =>
                        handleIssueChange("department", e.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Employee Name
                    <input
                      type="text"
                      value={issueForm.employeeName}
                      onChange={(e) =>
                        handleIssueChange("employeeName", e.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Job Card / Production Order
                    <input
                      type="text"
                      value={issueForm.jobCard}
                      onChange={(e) =>
                        handleIssueChange("jobCard", e.target.value)
                      }
                    />
                  </label>

                  <label>
                    Quantity
                    <input
                      type="number"
                      min="1"
                      max={selectedStock.availableQty}
                      value={issueForm.quantity}
                      onChange={(e) =>
                        handleIssueChange("quantity", e.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Remarks
                    <textarea
                      value={issueForm.remarks}
                      onChange={(e) =>
                        handleIssueChange("remarks", e.target.value)
                      }
                    />
                  </label>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={closeIssueModal}
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
