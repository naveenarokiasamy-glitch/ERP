import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const { logout, user } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  const username = user?.username || "User";

  /* ---------------------------------------------------------
     CLOSE PROFILE MENU WHEN CLICKING OUTSIDE
  --------------------------------------------------------- */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);


  /* ---------------------------------------------------------
     SIGN OUT
  --------------------------------------------------------- */

  const handleSignOut = () => {
    setProfileOpen(false);

    logout();

    navigate("/login", {
      replace: true,
    });
  };


  /* ---------------------------------------------------------
     PROFILE
  --------------------------------------------------------- */

  const handleProfile = () => {
    setProfileOpen(false);

    navigate("/profile");
  };


  /* ---------------------------------------------------------
     CURRENT MODULE NAME
  --------------------------------------------------------- */

  const getModuleName = () => {
    const path = location.pathname.toLowerCase();

    if (path.includes("/accounts/po")) {
      return "Purchase Order";
    }

    if (path.includes("/accounts/qo")) {
      return "Quotation";
    }

    if (path.includes("/accounts/taxinvoice")) {
      return "Tax Invoice";
    }

    if (path.includes("/accounts/deliverychallan")) {
      return "Delivery Challan";
    }

    if (path.includes("/accounts/proformainvoice")) {
      return "Proforma Invoice";
    }

    if (path.startsWith("/accounts")) {
      return "Accounts";
    }

    if (path.startsWith("/profile")) {
      return "Profile";
    }

    return "x";
  };


  const moduleName = getModuleName();


  return (
    <header className="erp-header">

      {/* =====================================================
          BACKGROUND PATTERN
      ===================================================== */}

      <div className="erp-header-pattern"></div>


      {/* =====================================================
          LEFT - BRAND
      ===================================================== */}

      <div
        className="erp-brand"
        onClick={() => navigate("/")}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            navigate("/");
          }
        }}
      >
        <span className="erp-brand-line"></span>

        <span className="erp-brand-name">
          Mugil Engineering Industry
        </span>
      </div>


      {/* =====================================================
          CENTER - MODULE NAME
      ===================================================== */}

      <div className="erp-module-name">
        {moduleName}
      </div>


      {/* =====================================================
          RIGHT - USER
      ===================================================== */}

      <div
        className="erp-user-area"
        ref={profileRef}
      >

        <button
          type="button"
          className={`erp-profile-trigger ${
            profileOpen ? "erp-profile-trigger-active" : ""
          }`}
          onClick={() => setProfileOpen((current) => !current)}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          title="User menu"
        >

          <span className="erp-avatar">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M12 12a4.2 4.2 0 1 0 0-8.4A4.2 4.2 0 0 0 12 12Zm0 2.2c-4.1 0-7.4 2.1-7.4 4.7 0 .6.5 1.1 1.1 1.1h12.6c.6 0 1.1-.5 1.1-1.1 0-2.6-3.3-4.7-7.4-4.7Z"
              />
            </svg>

          </span>


          <span className="erp-user-text">

            <span className="erp-username">
              {username}
            </span>

            <span className="erp-user-role">
              ERP User
            </span>

          </span>


          <svg
            className={`erp-chevron ${
              profileOpen ? "erp-chevron-open" : ""
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M5.3 7.4a.75.75 0 0 1 1.05-.1L10 10.5l3.65-3.2a.75.75 0 1 1 .98 1.14l-4.15 3.65a.75.75 0 0 1-.98 0L5.35 8.45a.75.75 0 0 1-.05-1.05Z"
            />
          </svg>

        </button>


        {/* =================================================
            PROFILE DROPDOWN
        ================================================= */}

        {profileOpen && (
          <div
            className="erp-profile-dropdown"
            role="menu"
          >

            <div className="erp-dropdown-user">

              <div className="erp-dropdown-avatar">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 12a4.2 4.2 0 1 0 0-8.4A4.2 4.2 0 0 0 12 12Zm0 2.2c-4.1 0-7.4 2.1-7.4 4.7 0 .6.5 1.1 1.1 1.1h12.6c.6 0 1.1-.5 1.1-1.1 0-2.6-3.3-4.7-7.4-4.7Z"
                  />
                </svg>

              </div>


              <div className="erp-dropdown-user-info">

                <strong>
                  {username}
                </strong>

                <span>
                  ERP User
                </span>

              </div>

            </div>


            <div className="erp-dropdown-divider"></div>


            <button
              type="button"
              className="erp-dropdown-item"
              onClick={handleProfile}
            >

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M12 12a4.2 4.2 0 1 0 0-8.4A4.2 4.2 0 0 0 12 12Zm0 2.2c-4.1 0-7.4 2.1-7.4 4.7 0 .6.5 1.1 1.1 1.1h12.6c.6 0 1.1-.5 1.1-1.1 0-2.6-3.3-4.7-7.4-4.7Z"
                />
              </svg>

              <span>
                View Profile
              </span>

            </button>


            <button
              type="button"
              className="erp-dropdown-item erp-signout-item"
              onClick={handleSignOut}
            >

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 8l4 4-4 4"
                />

                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 12H5"
                />

                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
                />
              </svg>

              <span>
                Sign Out
              </span>

            </button>

          </div>
        )}

      </div>

    </header>
  );
}