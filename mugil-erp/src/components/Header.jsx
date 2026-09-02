import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const username = user?.username || "User";

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  return (
    <header className="erp-header">
      {/* Background pattern */}
      <div className="erp-header-pattern" />

      {/* =========================
          BRAND
      ========================== */}
      <div className="erp-brand">
        <span className="erp-brand-line" />

        <span className="erp-brand-name">
          Mugil Engineering Industry
        </span>
      </div>

      {/* =========================
          RIGHT SIDE
      ========================== */}
      <div className="erp-user-area">

        {/* User information */}
        <div className="erp-user-info">

          <div className="erp-avatar">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5" />
            </svg>
          </div>

          <div className="erp-user-text">
            <span className="erp-username">
              {username}
            </span>

            <span className="erp-user-role">
              ERP User
            </span>
          </div>

        </div>

        {/* Vertical separator */}
        <span className="erp-action-divider" />

        {/* =========================
            PROFILE
        ========================== */}
        <button
          type="button"
          className="erp-header-action"
          onClick={handleProfile}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5" />
          </svg>

          <span>Profile</span>
        </button>

        {/* Vertical separator */}
        <span className="erp-action-divider" />

        {/* =========================
            SIGN OUT
        ========================== */}
        <button
          type="button"
          className="erp-header-action erp-signout-action"
          onClick={handleSignOut}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M21 3v18" />
          </svg>

          <span>Sign Out</span>
        </button>

      </div>
    </header>
  );
}