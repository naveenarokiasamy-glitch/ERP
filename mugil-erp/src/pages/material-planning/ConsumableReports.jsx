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

    <div className="crpt-page">
      <Link to="/inventory/consumable" className="erp-back-button">
  <ArrowLeft size={16} />
  Back
</Link>

      <section className="crpt-header-card">
        <div className="crpt-header-content">
          <span className="crpt-eyebrow">Consumables</span>

          <h1 className="crpt-title">Consumable Reports</h1>

          <p className="crpt-subtitle">
            Live reporting across GRN, Stock, Issue, Return, and Movement
            History. Nothing here is hardcoded - every row reflects the current
            state of the module.
          </p>
        </div>
      </section>

      <section className="crpt-kpi-grid">
        <div className="crpt-kpi-card crpt-kpi-blue">
          <div className="crpt-kpi-pattern"></div>

          <div className="crpt-kpi-icon">
            <Boxes size={22} />
          </div>

          <div className="crpt-kpi-content">
            <span className="crpt-kpi-value">
              {totalConsumables}
            </span>

            <span className="crpt-kpi-label">
              Total Consumables
            </span>
          </div>
        </div>

        <div className="crpt-kpi-card crpt-kpi-green">
          <div className="crpt-kpi-pattern"></div>

          <div className="crpt-kpi-icon">
            <PackageCheck size={22} />
          </div>

          <div className="crpt-kpi-content">
            <span className="crpt-kpi-value">
              {totalAvailableStock}
            </span>

            <span className="crpt-kpi-label">
              Available Stock
            </span>
          </div>
        </div>

        <div className="crpt-kpi-card crpt-kpi-orange">
          <div className="crpt-kpi-pattern"></div>

          <div className="crpt-kpi-icon">
            <Send size={22} />
          </div>

          <div className="crpt-kpi-content">
            <span className="crpt-kpi-value">
              {totalIssued}
            </span>

            <span className="crpt-kpi-label">
              Total Issued
            </span>
          </div>
        </div>

        <div className="crpt-kpi-card crpt-kpi-purple">
          <div className="crpt-kpi-pattern"></div>

          <div className="crpt-kpi-icon">
            <Undo2 size={22} />
          </div>

          <div className="crpt-kpi-content">
            <span className="crpt-kpi-value">
              {totalReturned}
            </span>

            <span className="crpt-kpi-label">
              Total Returned
            </span>
          </div>
        </div>
      </section>

      <section className="crpt-toolbar-card">
        <div className="crpt-toolbar-top">
          <div className="crpt-search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search consumable, PO, department, employee, warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="crpt-tabs">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={
                activeTab === tab.key
                  ? "crpt-tab crpt-tab-active"
                  : "crpt-tab"
              }
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <div className="crpt-table-card">

                {activeTab === "grn" && (
          <div className="crpt-table-wrapper">
            <table className="crpt-table">
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
                    <td>
                      <span className="crpt-status-chip">
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredGrnRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="crpt-empty-row"
                    >
                      No purchase orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "stock" && (
          <div className="crpt-table-wrapper">
            <table className="crpt-table">
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
                    <td>
                      <span className="crpt-status-chip">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredStockRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="crpt-empty-row"
                    >
                      No stock records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "issue" && (
          <div className="crpt-table-wrapper">
            <table className="crpt-table">
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
                    <td>
                      <span className="crpt-status-chip">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredIssueRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="crpt-empty-row">
                      No issue records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "return" && (
          <div className="crpt-table-wrapper">
            <table className="crpt-table">
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
                    <td colSpan={8} className="crpt-empty-row">
                      No return records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "movement" && (
          <div className="crpt-table-wrapper">
            <table className="crpt-table">
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
                    <td>
                      <span className="crpt-status-chip">
                        {item.type}
                      </span>
                    </td>
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
                    <td colSpan={10} className="crpt-empty-row">
                      No movement history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </>
);
}
