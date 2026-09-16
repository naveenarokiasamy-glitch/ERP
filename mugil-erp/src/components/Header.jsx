
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

export default function Header({ navLinks = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
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

        {/* =========================
            CUSTOM PAGE NAVIGATION
        ========================== */}

        {navLinks.length > 0 && (
          <nav className="erp-custom-nav">
            {navLinks.map((link) => (
              <button
                key={link.path}
                type="button"
                className={`erp-custom-nav-button ${
                  location.pathname.startsWith(link.path)
                    ? "erp-custom-nav-button-active"
                    : ""
                }`}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            ))}
          </nav>
        )}

        {navLinks.length > 0 && (
          <span className="erp-action-divider" />
        )}


        {/* =========================
            PROFILE
        ========================== */}

        <div className="erp-profile-wrapper">

          <button
            type="button"
            className="erp-header-action erp-profile-action"
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


          {/* Profile Hover Card */}

          <div className="erp-profile-hover-card">

            <div className="erp-profile-card-loader" />

            <div className="erp-profile-card-title">
              {username}
            </div>

            <div className="erp-profile-card-description">
              ERP User
            </div>

          </div>

        </div>


        {/* Vertical Separator */}

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

          <span className="erp-signout-text">
            Sign Out
          </span>

          <span className="erp-signout-hover-text">
            Thanks!
          </span>
        </button>

      </div>
    </header>
  );
}