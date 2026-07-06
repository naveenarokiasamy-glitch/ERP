import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Boxes,
  PackageCheck,
  Send,
  Undo2,
} from "lucide-react";
import Header from "../../components/Header";
import consumableStore from "../../data/consumableStore";
import "./ConsumableReports.css";
// import { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//   ArrowLeft,
//   Search,
//   Boxes,
//   PackageCheck,
//   Send,
//   Undo2,
// } from "lucide-react";
// import Header from "../../components/Header";
// import consumableStore from "../../store/consumableStore";

const REPORT_TABS = [
  { key: "grn", label: "GRN Report" },
  { key: "stock", label: "Stock Report" },
  { key: "issue", label: "Issue Report" },
  { key: "return", label: "Return Report" },
  { key: "movement", label: "Movement History" },
];

export default function ConsumableReports() {
  const [purchaseOrders, setPurchaseOrders] = useState(
    consumableStore.getPurchaseOrders(),
  );
  const [stock, setStock] = useState(consumableStore.getConsumableStock());
  const [issued, setIssued] = useState(
    consumableStore.getIssuedConsumables(),
  );
  const [returned, setReturned] = useState(
    consumableStore.getReturnedConsumables(),
  );
  const [movements, setMovements] = useState(
    consumableStore.getMovementHistory(),
  );

  const [activeTab, setActiveTab] = useState("grn");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = consumableStore.subscribe(() => {
      setPurchaseOrders([...consumableStore.getPurchaseOrders()]);
      setStock([...consumableStore.getConsumableStock()]);
      setIssued([...consumableStore.getIssuedConsumables()]);
      setReturned([...consumableStore.getReturnedConsumables()]);
      setMovements([...consumableStore.getMovementHistory()]);
    });
    return unsubscribe;
  }, []);

  const totalConsumables = stock.length;
  const totalAvailableStock = stock.reduce(
    (sum, item) => sum + item.availableQty,
    0,
  );
  const totalIssued = issued.reduce((sum, item) => sum + item.issuedQty, 0);
  const totalReturned = returned.reduce(
    (sum, item) => sum + item.returnQty,
    0,
  );

  const term = search.trim().toLowerCase();

  const filteredGrnRows = useMemo(
    () =>
      purchaseOrders.filter((po) => {
        if (!term) return true;
        return (
          po.poNumber.toLowerCase().includes(term) ||
          po.consumableName.toLowerCase().includes(term) ||
          po.supplier.toLowerCase().includes(term) ||
          po.warehouse.toLowerCase().includes(term)
        );
      }),
    [purchaseOrders, term],
  );

  const filteredStockRows = useMemo(
    () =>
      stock.filter((item) => {
        if (!term) return true;
        return (
          item.consumableName.toLowerCase().includes(term) ||
          item.referenceNumber.toLowerCase().includes(term) ||
          item.warehouse.toLowerCase().includes(term)
        );
      }),
    [stock, term],
  );

  const filteredIssueRows = useMemo(
    () =>
      issued.filter((item) => {
        if (!term) return true;
        return (
          item.consumableName.toLowerCase().includes(term) ||
          item.issueNumber.toLowerCase().includes(term) ||
          item.department.toLowerCase().includes(term) ||
          item.employeeName.toLowerCase().includes(term) ||
          item.warehouse.toLowerCase().includes(term)
        );
      }),
    [issued, term],
  );

  const filteredReturnRows = useMemo(
    () =>
      returned.filter((item) => {
        if (!term) return true;
        return (
          item.consumableName.toLowerCase().includes(term) ||
          item.returnNumber.toLowerCase().includes(term) ||
          item.department.toLowerCase().includes(term) ||
          item.employeeName.toLowerCase().includes(term) ||
          item.warehouse.toLowerCase().includes(term)
        );
      }),
    [returned, term],
  );

  const filteredMovementRows = useMemo(
    () =>
      movements.filter((item) => {
        if (!term) return true;
        return (
          item.consumableName.toLowerCase().includes(term) ||
          item.referenceNumber.toLowerCase().includes(term) ||
          (item.department || "").toLowerCase().includes(term) ||
          (item.user || "").toLowerCase().includes(term) ||
          item.warehouse.toLowerCase().includes(term)
        );
      }),
    [movements, term],
  );

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
          <h1 className="consumable-title">Consumable Reports</h1>
          <p className="consumable-subtitle">
            Live reporting across GRN, Stock, Issue, Return, and Movement
            History. Nothing here is hardcoded - every row reflects the
            current state of the module.
          </p>
        </header>

        <div className="consumable-stock-stats">
          <div className="stat-card">
            <Boxes size={20} />
            <div>
              <span className="stat-value">{totalConsumables}</span>
              <span className="stat-label">Total Consumables</span>
            </div>
          </div>
          <div className="stat-card">
            <PackageCheck size={20} />
            <div>
              <span className="stat-value">{totalAvailableStock}</span>
              <span className="stat-label">Available Stock</span>
            </div>
          </div>
          <div className="stat-card">
            <Send size={20} />
            <div>
              <span className="stat-value">{totalIssued}</span>
              <span className="stat-label">Total Issued</span>
            </div>
          </div>
          <div className="stat-card">
            <Undo2 size={20} />
            <div>
              <span className="stat-value">{totalReturned}</span>
              <span className="stat-label">Total Returned</span>
            </div>
          </div>
        </div>

        <div className="consumable-grn-toolbar">
          <div className="consumable-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search consumable, PO, department, employee, warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div
          className="consumable-grn-toolbar"
          style={{ flexWrap: "wrap", gap: "8px" }}
        >
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "btn-primary" : "btn-secondary"}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="consumable-table-wrapper">
          {activeTab === "grn" && (
            <table className="consumable-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Consumable</th>
                  <th>Ordered Qty</th>
                  <th>Received Qty</th>
                  <th>Pending Qty</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrnRows.map((po) => (
                  <tr key={po.id}>
                    <td>{po.poNumber}</td>
                    <td>{po.supplier}</td>
                    <td>{po.consumableName}</td>
                    <td>{po.orderedQty}</td>
                    <td>{po.receivedQty}</td>
                    <td>{po.pendingQty}</td>
                    <td>{po.warehouse}</td>
                    <td>{po.status}</td>
                  </tr>
                ))}
                {filteredGrnRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="consumable-empty-row">
                      No purchase orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "stock" && (
            <table className="consumable-table">
              <thead>
                <tr>
                  <th>Reference Number</th>
                  <th>Consumable</th>
                  <th>Warehouse</th>
                  <th>Available Qty</th>
                  <th>Unit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockRows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.referenceNumber}</td>
                    <td>{item.consumableName}</td>
                    <td>{item.warehouse}</td>
                    <td>{item.availableQty}</td>
                    <td>{item.unit}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
                {filteredStockRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="consumable-empty-row">
                      No stock records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "issue" && (
            <table className="consumable-table">
              <thead>
                <tr>
                  <th>Issue Number</th>
                  <th>Consumable</th>
                  <th>Department</th>
                  <th>Employee</th>
                  <th>Issued Qty</th>
                  <th>Balance Qty</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssueRows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.issueNumber}</td>
                    <td>{item.consumableName}</td>
                    <td>{item.department}</td>
                    <td>{item.employeeName}</td>
                    <td>{item.issuedQty}</td>
                    <td>{item.balanceQty}</td>
                    <td>{item.warehouse}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
                {filteredIssueRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="consumable-empty-row">
                      No issue records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "return" && (
            <table className="consumable-table">
              <thead>
                <tr>
                  <th>Return Number</th>
                  <th>Issue Number</th>
                  <th>Consumable</th>
                  <th>Department</th>
                  <th>Employee</th>
                  <th>Return Qty</th>
                  <th>Warehouse</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturnRows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.returnNumber}</td>
                    <td>{item.issueNumber}</td>
                    <td>{item.consumableName}</td>
                    <td>{item.department}</td>
                    <td>{item.employeeName}</td>
                    <td>{item.returnQty}</td>
                    <td>{item.warehouse}</td>
                    <td>{item.date}</td>
                  </tr>
                ))}
                {filteredReturnRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="consumable-empty-row">
                      No return records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "movement" && (
            <table className="consumable-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Consumable</th>
                  <th>Reference</th>
                  <th>Quantity</th>
                  <th>Department</th>
                  <th>Warehouse</th>
                  <th>User</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovementRows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.time}</td>
                    <td>{item.type}</td>
                    <td>{item.consumableName}</td>
                    <td>{item.referenceNumber}</td>
                    <td>
                      {item.quantity} {item.unit}
                    </td>
                    <td>{item.department || "-"}</td>
                    <td>{item.warehouse}</td>
                    <td>{item.user || "-"}</td>
                    <td>{item.remarks || "-"}</td>
                  </tr>
                ))}
                {filteredMovementRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="consumable-empty-row">
                      No movement history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
