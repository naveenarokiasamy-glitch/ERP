import { useNavigate } from "react-router-dom";
import "./AccountsHome.css";

export default function AccountsHome() {
  const navigate = useNavigate();

  const menus = [
    {
      title: "Purchase Order",
      short: "PO",
      description: "Create and manage Purchase Orders.",
      path: "/accounts/PO",
      color: "#0f766e",
    },
    {
      title: "Quotation",
      short: "QO",
      description: "Create and manage Quotations.",
      path: "/accounts/QO",
      color: "#1d4ed8",
    },
  ];

  return (
    <div className="accounts-page">
      <div className="accounts-container">
        <h1>Accounts Module</h1>
        <p>Select a module to continue.</p>

        <div className="accounts-grid">
          {menus.map((item) => (
            <div
              key={item.title}
              className="accounts-card"
              onClick={() => navigate(item.path)}
            >
              <div className="accounts-icon" style={{ background: item.color }}>
                {item.short}
              </div>

              <h2>{item.title}</h2>

              <p>{item.description}</p>

              <button>Open</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
