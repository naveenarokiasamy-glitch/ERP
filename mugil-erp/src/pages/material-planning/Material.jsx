import { Link, useNavigate } from "react-router-dom";
import {
  PackagePlus,
  Boxes,
  Layers,
  Scissors,
  Ban,
  BarChart3,
  ArrowLeft,
  Factory,
} from "lucide-react";
import "./Material.css";
import Header from "../../components/Header";
const materialActions = [
  {
    code: "GRN",
    title: "GRN (Goods Receipt Note)",
    description: "Receive new raw materials from suppliers.",
    icon: PackagePlus,
    path: "/inventory/material/grn",
  },
  {
    code: "STK",
    title: "Material Stock",
    description:
      "Live stock levels across full inventory and cutting balances.",
    icon: Boxes,
    isStock: true,
    path: "/inventory/material/stock",
    subSections: [
      {
        label: "Full Material Stock",
        description: "Complete on-hand quantities by item and location.",
        icon: Layers,
        path: "/inventory/material/stock/",
      },
      {
        label: "Cutting Balance Stock",
        description: "Remaining balances left over after cutting operations.",
        icon: Scissors,
        path: "/inventory/material/stock/cutting-balance",
      },
    ],
  },
  {
    code: "CUT",
    title: "Issue Material to Cutting",
    description: "Issue raw materials from stock to the cutting department.",
    icon: Scissors,
    path: "/inventory/material/issue-cutting",
  },
  {
    code: "RCD",
    title: "Receive From Cutting",
    description:
      "Receive cut pieces, balance plates, scrap and rejected materials.",
    icon: PackagePlus,
    path: "/inventory/material/receive-cutting",
  },
  {
    code: "ISS",
    title: "Issue Material to Production",
    description: "Issue raw materials to production.",
    icon: Factory,
    path: "/inventory/material/issue-production",
  },
  {
    code: "SCR",
    title: "Scrap Materials",
    description:
      "Store and manage scrap generated after cutting and fabrication.",
    icon: Scissors,
    path: "/inventory/material/scrap",
  },
  {
    code: "REJ",
    title: "Rejection Materials",
    description: "Store materials rejected for quality issues or damage.",
    icon: Ban,
    path: "/inventory/material/rejection",
  },
  {
    code: "RWK",
    title: "Rework Materials",
    description:
      "Manage rejected materials sent for rework and return completed items back to finished inventory.",
    icon: Factory,
    path: "/inventory/material/rework",
  },
  {
    code: "MOV",
    title: "Material Movement History",
    description: "Track all material movements throughout the workflow.",
    icon: Boxes,
    path: "/inventory/material/movement-history",
  },
  {
    code: "RPT",
    title: "Reports",
    description: "Inventory, stock, GRN, scrap and rejection reports.",
    icon: BarChart3,
    path: "/inventory/material/reports",
  },
];
export default function Material() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="material-page">
        <Link to="/inventory" className="material-back">
          <ArrowLeft size={15} />
          Inventory
        </Link>

        <header className="material-header">
          <span className="material-eyebrow">Materials</span>
          <h1 className="material-title">Material Inventory</h1>
          <p className="material-subtitle">
            Manage all raw materials used in production.
          </p>
        </header>

        <div className="material-grid">
          {materialActions.map((action) => {
            const Icon = action.icon;

            if (action.isStock) {
              return (
                <div
                  className="material-card material-card-wide"
                  key={action.title}
                  onClick={() => navigate(action.path)}
                >
                  <div className="material-card-top">
                    <div className="material-icon">
                      <Icon size={22} strokeWidth={1.8} />
                    </div>
                    <span className="material-code">{action.code}</span>
                  </div>
                  <h3 className="material-card-title">{action.title}</h3>
                  <p className="material-card-desc">{action.description}</p>

                  <div className="material-subgrid">
                    {action.subSections.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <div
                          className="material-subcard"
                          key={sub.label}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(sub.path);
                          }}
                        >
                          <div className="material-subcard-icon">
                            <SubIcon size={17} strokeWidth={1.8} />
                          </div>
                          <div>
                            <h4 className="material-subcard-title">
                              {sub.label}
                            </h4>
                            <p className="material-subcard-desc">
                              {sub.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <div
                className="material-card"
                key={action.title}
                onClick={() => navigate(action.path)}
              >
                <div className="material-card-top">
                  <div className="material-icon">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <span className="material-code">{action.code}</span>
                </div>
                <h3 className="material-card-title">{action.title}</h3>
                <p className="material-card-desc">{action.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
