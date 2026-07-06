import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Boxes, Layers, Warehouse } from "lucide-react";
import Header from "../../components/Header";
import consumableStore from "../../data/consumableStore";
import "./ConsumableStock.css";

// import { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import { ArrowLeft, Search, Boxes, Layers, Warehouse } from "lucide-react";
// import Header from "../../components/Header";
// import consumableStore from "../../store/consumableStore";

export default function ConsumableStock() {
  const [stock, setStock] = useState(consumableStore.getConsumableStock());
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const unsubscribe = consumableStore.subscribe(() => {
      setStock([...consumableStore.getConsumableStock()]);
    });
    return unsubscribe;
  }, []);

  const warehouses = useMemo(
    () => ["All", ...new Set(stock.map((item) => item.warehouse))],
    [stock],
  );

  const categories = useMemo(
    () => ["All", ...new Set(stock.map((item) => item.category))],
    [stock],
  );

  const filteredStock = stock.filter((item) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      item.consumableName.toLowerCase().includes(term) ||
      item.referenceNumber.toLowerCase().includes(term) ||
      item.supplier.toLowerCase().includes(term);

    const matchesWarehouse =
      warehouseFilter === "All" || item.warehouse === warehouseFilter;

    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    return matchesSearch && matchesWarehouse && matchesCategory;
  });

  const totalConsumables = stock.length;
  const totalQuantity = stock.reduce((sum, item) => sum + item.availableQty, 0);
  const totalWarehouses = new Set(stock.map((item) => item.warehouse)).size;

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
          <h1 className="consumable-title">Consumable Stock</h1>
          <p className="consumable-subtitle">
            Live stock levels, updated automatically from every GRN.
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
            <Layers size={20} />
            <div>
              <span className="stat-value">{totalQuantity}</span>
              <span className="stat-label">Total Quantity</span>
            </div>
          </div>
          <div className="stat-card">
            <Warehouse size={20} />
            <div>
              <span className="stat-value">{totalWarehouses}</span>
              <span className="stat-label">Warehouses</span>
            </div>
          </div>
        </div>

        <div className="consumable-stock-toolbar">
          <div className="consumable-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search consumable, reference, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            {warehouses.map((wh) => (
              <option key={wh} value={wh}>
                {wh === "All" ? "All Warehouses" : wh}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "All" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="consumable-table-wrapper">
          <table className="consumable-table">
            <thead>
              <tr>
                <th>Reference Number</th>
                <th>Consumable</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Available Qty</th>
                <th>Warehouse</th>
                <th>Supplier</th>
                <th>Last Received Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => (
                <tr key={item.id}>
                  <td>{item.referenceNumber}</td>
                  <td>{item.consumableName}</td>
                  <td>{item.category}</td>
                  <td>{item.unit}</td>
                  <td>{item.availableQty}</td>
                  <td>{item.warehouse}</td>
                  <td>{item.supplier}</td>
                  <td>{item.lastReceivedDate}</td>
                  <td>
                    <span
                      className={`status-badge status-${item.status
                        .replace(/\s+/g, "-")
                        .toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={9} className="consumable-empty-row">
                    No stock available yet. Stock will appear here after a GRN
                    is recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
