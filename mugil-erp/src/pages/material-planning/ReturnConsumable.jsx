import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Undo2, X } from "lucide-react";
import Header from "../../components/Header";
import consumableStore from "../../data/consumableStore";
import "./ReturnConsumable.css";

// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { ArrowLeft, Search, Undo2, X } from "lucide-react";
// import Header from "../../components/Header";
// import consumableStore from "../../store/consumableStore";

const initialReturnForm = {
  returnQty: "",
  remarks: "",
};

export default function ReturnConsumable() {
  const [issued, setIssued] = useState(consumableStore.getIssuedConsumables());
  const [search, setSearch] = useState("");

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [returnForm, setReturnForm] = useState(initialReturnForm);

  useEffect(() => {
    const unsubscribe = consumableStore.subscribe(() => {
      setIssued([...consumableStore.getIssuedConsumables()]);
    });
    return unsubscribe;
  }, []);

  const filteredIssued = issued.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      item.issueNumber.toLowerCase().includes(term) ||
      item.consumableName.toLowerCase().includes(term) ||
      item.department.toLowerCase().includes(term) ||
      item.employeeName.toLowerCase().includes(term) ||
      (item.jobCard || "").toLowerCase().includes(term)
    );
  });

  const stats = {
    issued: issued.filter((item) => item.status === "Issued").length,
    partial: issued.filter((item) => item.status === "Partially Returned")
      .length,
    fully: issued.filter((item) => item.status === "Fully Returned").length,
  };

  function openReturnModal(issueItem) {
    setSelectedIssue(issueItem);
    setReturnForm(initialReturnForm);
  }

  function closeReturnModal() {
    setSelectedIssue(null);
    setReturnForm(initialReturnForm);
  }

  function handleReturnSubmit(e) {
    e.preventDefault();
    if (!selectedIssue) return;

    const qty = Number(returnForm.returnQty);
    if (!qty || qty <= 0 || qty > selectedIssue.balanceQty) return;

    consumableStore.returnConsumable(selectedIssue.id, {
      returnQty: qty,
      remarks: returnForm.remarks,
      returnedBy: selectedIssue.employeeName,
    });

    closeReturnModal();
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
          <h1 className="consumable-title">Return Consumables</h1>
          <p className="consumable-subtitle">
            Record consumables returned against an issue. Stock is restored
            automatically.
          </p>
        </header>

        <div className="consumable-stock-stats">
          <div className="stat-card">
            <Undo2 size={20} />
            <div>
              <span className="stat-value">{stats.issued}</span>
              <span className="stat-label">Issued</span>
            </div>
          </div>
          <div className="stat-card">
            <Undo2 size={20} />
            <div>
              <span className="stat-value">{stats.partial}</span>
              <span className="stat-label">Partially Returned</span>
            </div>
          </div>
          <div className="stat-card">
            <Undo2 size={20} />
            <div>
              <span className="stat-value">{stats.fully}</span>
              <span className="stat-label">Fully Returned</span>
            </div>
          </div>
        </div>

        <div className="consumable-stock-toolbar">
          <div className="consumable-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search issue number, consumable, department, employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="consumable-table-wrapper">
          <table className="consumable-table">
            <thead>
              <tr>
                <th>Issue Number</th>
                <th>Consumable</th>
                <th>Department</th>
                <th>Employee</th>
                <th>Job Card</th>
                <th>Issued Qty</th>
                <th>Returned Qty</th>
                <th>Balance Qty</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssued.map((item) => (
                <tr key={item.id}>
                  <td>{item.issueNumber}</td>
                  <td>{item.consumableName}</td>
                  <td>{item.department}</td>
                  <td>{item.employeeName}</td>
                  <td>{item.jobCard || "-"}</td>
                  <td>{item.issuedQty}</td>
                  <td>{item.returnedQty}</td>
                  <td>{item.balanceQty}</td>
                  <td>
                    <span
                      className={`status-badge status-${item.status
                        .replace(/\s+/g, "-")
                        .toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      disabled={item.balanceQty <= 0}
                      onClick={() => openReturnModal(item)}
                    >
                      Return
                    </button>
                  </td>
                </tr>
              ))}
              {filteredIssued.length === 0 && (
                <tr>
                  <td colSpan={10} className="consumable-empty-row">
                    No issued consumables found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedIssue && (
          <div className="modal-overlay" onClick={closeReturnModal}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Return Consumable</h3>
                <button className="modal-close" onClick={closeReturnModal}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-info-grid">
                  <div>
                    <span className="modal-info-label">Consumable</span>
                    <span className="modal-info-value">
                      {selectedIssue.consumableName}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Issued Quantity</span>
                    <span className="modal-info-value">
                      {selectedIssue.issuedQty} {selectedIssue.unit}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Already Returned</span>
                    <span className="modal-info-value">
                      {selectedIssue.returnedQty} {selectedIssue.unit}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Balance</span>
                    <span className="modal-info-value">
                      {selectedIssue.balanceQty} {selectedIssue.unit}
                    </span>
                  </div>
                </div>

                <form className="modal-form" onSubmit={handleReturnSubmit}>
                  <label>
                    Return Quantity
                    <input
                      type="number"
                      min="1"
                      max={selectedIssue.balanceQty}
                      value={returnForm.returnQty}
                      onChange={(e) =>
                        setReturnForm((prev) => ({
                          ...prev,
                          returnQty: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label>
                    Remarks
                    <textarea
                      value={returnForm.remarks}
                      onChange={(e) =>
                        setReturnForm((prev) => ({
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
                      onClick={closeReturnModal}
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
