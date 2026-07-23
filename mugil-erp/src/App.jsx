import { Navigate, Route, Routes } from "react-router-dom";
import CustomCursor from "./components/CustomCursor.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AccountsLoginPage from "./pages/accounts/LoginPage.jsx";
import AdminLoginPage from "./pages/admin/LoginPage.jsx";
import HrLoginPage from "./pages/hr/LoginPage.jsx";
import MaterialPlanningLoginPage from "./pages/material-planning/LoginPage.jsx";
import ProductionLoginPage from "./pages/production/LoginPage.jsx";
import SupervisorLoginPage from "./pages/supervisor/LoginPage.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import Inventory from "./pages/material-planning/Inventory.jsx";
import Material from "./pages/material-planning/Material.jsx";
import Consumable from "./pages/material-planning/Consumable.jsx";

import MaterialGRN from "./pages/material-planning/Materialgrn";
import MaterialStock from "./pages/material-planning/Materialstock";

import IssueMaterialToCutting from "./pages/material-planning/issuematerialtocutting";
import ReceiveFromCutting from "./pages/material-planning/Receivefromcutting";
import CuttingBalanceStock from "./pages/material-planning/Cuttingbalancestock";
import IssueToProduction from "./pages/material-planning/issuetoprod";
import Scrap from "./pages/material-planning/Scrap";
import Rejection from "./pages/material-planning/Rejection";
import Rework from "./pages/material-planning/Rework";
import MaterialMovementHistory from "./pages/material-planning/MaterialMovementHistory";
import Reports from "./pages/material-planning/Reports";
import ConsumableGRN from "./pages/material-planning/ConsumableGRN";
import ConsumableStock from "./pages/material-planning/ConsumableStock";
import IssueConsumable from "./pages/material-planning/IssueConsumable";
import ReturnConsumable from "./pages/material-planning/ReturnConsumable";
import ConsumableReports from "./pages/material-planning/ConsumableReports";
import HRMenu from "./pages/hr/hrmenu";
import Dashboard from "./pages/hr/Dashboard";
import Employees from "./pages/hr/Employees";
import EmployeeProfile from "./pages/hr/EmployeeProfile";
import TodayAttendance from "./pages/hr/TodayAttendance";
import MonthlyAttendance from "./pages/hr/MonthlyAttendance";
import AttendanceCalendar from "./pages/hr/AttendanceCalendar";
import AttendanceLogs from "./pages/hr/AttendanceLogs";
import SalarySettings from "./pages/hr/SalarySettings";
import Payroll from "./pages/hr/Payroll";
import DeviceManagement from "./pages/hr/DeviceManagement";
import Repoort from "./pages/hr/Report";
import PO from "./pages/accounts/PurchaseOrderForm";
import QO from "./pages/accounts/QuotationForm";
import AccountsHome from "./pages/accounts/AccountsHome";
import TaxInvoice from "./pages/accounts/Taxinvoiceform";
import DeliveryChallan from "./pages/accounts/Deliverychallanform";
import ProformaInvoiceForm from "./pages/accounts/Proformainvoiceform";
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/production/login" replace />} />
        <Route path="/production/login" element={<ProductionLoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/hr/login" element={<HrLoginPage />} />
        <Route
          path="/material-planning/login"
          element={<MaterialPlanningLoginPage />}
        />
        <Route path="/supervisor/login" element={<SupervisorLoginPage />} />
        <Route path="/accounts/login" element={<AccountsLoginPage />} />
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <WelcomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/material"
          element={
            <ProtectedRoute>
              <Material />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/consumable"
          element={
            <ProtectedRoute>
              <Consumable />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/material/grn"
          element={
            <ProtectedRoute>
              <MaterialGRN />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/material/stock"
          element={
            <ProtectedRoute>
              <MaterialStock />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/material/issue-cutting"
          element={
            <ProtectedRoute>
              <IssueMaterialToCutting />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/material/receive-cutting"
          element={
            <ProtectedRoute>
              <ReceiveFromCutting />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/material/stock/cutting-balance"
          element={
            <ProtectedRoute>
              <CuttingBalanceStock />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/material/issue-production"
          element={
            <ProtectedRoute>
              <IssueToProduction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/material/rework"
          element={
            <ProtectedRoute>
              <Rework />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/material/scrap"
          element={
            <ProtectedRoute>
              <Scrap />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/material/rejection"
          element={
            <ProtectedRoute>
              <Rejection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/material/rework"
          element={
            <ProtectedRoute>
              <Rework />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/material/movement-history"
          element={
            <ProtectedRoute>
              <MaterialMovementHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/material/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/consumable/grn"
          element={
            <ProtectedRoute>
              <ConsumableGRN />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/consumable/stock"
          element={
            <ProtectedRoute>
              <ConsumableStock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/consumable/issue"
          element={
            <ProtectedRoute>
              <IssueConsumable />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/consumable/return"
          element={
            <ProtectedRoute>
              <ReturnConsumable />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/consumable/reports"
          element={
            <ProtectedRoute>
              <ConsumableReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr"
          element={
            <ProtectedRoute>
              <HRMenu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/employees"
          element={
            <ProtectedRoute>
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/employee/:id"
          element={
            <ProtectedRoute>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/today-attendance"
          element={
            <ProtectedRoute>
              <TodayAttendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/monthly-attendance"
          element={
            <ProtectedRoute>
              <MonthlyAttendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/attendance-calendar"
          element={
            <ProtectedRoute>
              <AttendanceCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/attendance-logs"
          element={
            <ProtectedRoute>
              <AttendanceLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/salary-settings"
          element={
            <ProtectedRoute>
              <SalarySettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/payroll"
          element={
            <ProtectedRoute>
              <Payroll />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/device-management"
          element={
            <ProtectedRoute>
              <DeviceManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/reports"
          element={
            <ProtectedRoute>
              <Repoort />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <AccountsHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/po"
          element={
            <ProtectedRoute>
              <PO />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/qo"
          element={
            <ProtectedRoute>
              <QO />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/TaxInvoice"
          element={
            <ProtectedRoute>
              <TaxInvoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/DeliveryChallan"
          element={
            <ProtectedRoute>
              <DeliveryChallan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/ProformaInvoice"
          element={
            <ProtectedRoute>
              <ProformaInvoiceForm />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/production/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
