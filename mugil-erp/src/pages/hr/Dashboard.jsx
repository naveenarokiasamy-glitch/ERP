import React, { useMemo } from "react";
import {
  calculateDashboardSummary,
  calculateDepartmentSummary,
  calculateShiftSummary,
  calculateTodaySummary,
  calculateMonthlySummary,
  getMonthlyAttendance,
  getWeeklyPayroll,
  getPaidPayroll,
  getPendingPayroll,
  getReferenceDate,
} from "../../data/hrData";
import "./Dashboard.css";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

// Helper Functions
function formatINR(value) {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function TickStrip() {
  return (
    <div className="hr-tick-strip">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className={`hr-tick ${i % 3 === 0 ? "hr-tick-lg" : ""}`} />
      ))}
    </div>
  );
}

function Kpi({ label, value, sub, tone = "ink" }) {
  const toneClass = `kpi-value-${tone}`;

  return (
    <div className="hr-card kpi-card">
      <TickStrip />
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${toneClass}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function Gauge({ percent }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const size = 92;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;
  const color =
    clamped >= 90
      ? "var(--success)"
      : clamped >= 75
        ? "var(--amber)"
        : "var(--danger)";

  return (
    <div className="gauge-container">
      <svg width={size} height={size} className="gauge-svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
        />
      </svg>
      <div className="gauge-percent">
        <span className="gauge-percent-text">{clamped.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function SectionHeader({ title, hint }) {
  return (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {hint && <span className="section-hint">{hint}</span>}
    </div>
  );
}

function Panel({ children, style }) {
  return (
    <div className="panel" style={style}>
      {children}
    </div>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th className={`table-th ${align === "right" ? "table-th-right" : ""}`}>
      {children}
    </th>
  );
}

function Td({ children, align = "left", mono = false, bold = false, style }) {
  const classes = [
    "table-td",
    align === "right" ? "table-td-right" : "",
    mono ? "table-td-mono" : "",
    bold ? "table-td-bold" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <td className={classes} style={style}>
      {children}
    </td>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const summary = useMemo(() => calculateDashboardSummary(), []);
  const todaySummary = useMemo(() => calculateTodaySummary(), []);
  const monthlySummary = useMemo(() => calculateMonthlySummary(), []);
  const deptSummary = useMemo(() => calculateDepartmentSummary(), []);
  const shiftSummary = useMemo(() => calculateShiftSummary(), []);
  const paidTotal = useMemo(
    () => getPaidPayroll().reduce((s, p) => s + p.netSalary, 0),
    [],
  );
  const pendingTotal = useMemo(
    () => getPendingPayroll().reduce((s, p) => s + p.netSalary, 0),
    [],
  );

  const weeklyPayrollTotal = useMemo(() => {
    const refDate = getReferenceDate();
    const d = new Date(refDate);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    const weekStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return getWeeklyPayroll(weekStart).reduce((s, r) => s + r.totalPay, 0);
  }, []);

  const attendancePercentToday = useMemo(() => {
    const workingCount =
      todaySummary.present +
      todaySummary.absent +
      todaySummary.late +
      todaySummary.halfDay +
      todaySummary.onLeave;
    const activeCount =
      todaySummary.present + todaySummary.late + todaySummary.halfDay;
    return workingCount ? (activeCount / workingCount) * 100 : 0;
  }, [todaySummary]);

  const trend = useMemo(() => {
    const records = getMonthlyAttendance();
    const byDate = {};
    records.forEach((r) => {
      if (
        r.attendanceStatus === "Holiday" ||
        r.attendanceStatus === "Weekly Off"
      )
        return;
      if (!byDate[r.date]) byDate[r.date] = { present: 0, total: 0 };
      byDate[r.date].total += 1;
      if (
        r.attendanceStatus === "Present" ||
        r.attendanceStatus === "Late" ||
        r.attendanceStatus === "Half Day"
      ) {
        byDate[r.date].present += 1;
      }
    });
    return Object.keys(byDate)
      .sort()
      .map((date) => {
        const { present, total } = byDate[date];
        const pct = total ? (present / total) * 100 : 0;
        return { date, pct, dayNum: Number(date.split("-")[2]) };
      });
  }, []);

  const maxBarHeight = 110;
const navigate = useNavigate();
const handleBack = () => {
    navigate("/hr");
  };

  return (
     <>
          <Header />
    <div className="dashboard-container">
       <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
      <div className="page-header">
        <div className="page-badge">HR &amp; Payroll Control Panel</div>
        <h1 className="page-title">Workforce Dashboard</h1>
        <div className="page-subtitle">
          Snapshot as of {getReferenceDate()} · {summary.totalDepartments}{" "}
          departments · {summary.devicesOnline}/{summary.totalDevices} devices
          online
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <Kpi
          label="Total Employees"
          value={summary.totalEmployees}
          sub={`${summary.activeEmployees} active · ${summary.inactiveEmployees} inactive`}
          tone="accent"
        />
        <Kpi
          label="Present Today"
          value={todaySummary.present}
          tone="success"
        />
        <Kpi label="Absent Today" value={todaySummary.absent} tone="danger" />
        <Kpi label="Late Today" value={todaySummary.late} tone="amber" />
        <Kpi label="On Leave" value={todaySummary.onLeave} />
        <Kpi label="Half Day" value={todaySummary.halfDay} />
        <div className="hr-card gauge-kpi">
          <Gauge percent={attendancePercentToday} />
          <div>
            <div className="gauge-kpi-label">Attendance %</div>
            <div className="gauge-kpi-sub">today, working staff</div>
          </div>
        </div>
        <Kpi
          label="Weekly Payroll"
          value={formatINR(weeklyPayrollTotal)}
          tone="accent"
        />
        <Kpi
          label="Monthly Payroll"
          value={formatINR(monthlySummary.totalNetPayroll)}
          tone="accent"
        />
        <Kpi label="Paid Salary" value={formatINR(paidTotal)} tone="success" />
        <Kpi
          label="Pending Salary"
          value={formatINR(pendingTotal)}
          tone="danger"
        />
        <Kpi
          label="Total Overtime Hours"
          value={`${monthlySummary.totalOvertimeHours} h`}
          tone="amber"
        />
      </div>

      {/* Department + Shift */}
      <div className="two-column">
        <Panel>
          <SectionHeader
            title="Department Summary"
            hint={`${deptSummary.length} depts`}
          />
          <div className="hr-scroll" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <Th>Department</Th>
                  <Th align="right">Employees</Th>
                  <Th align="right">Present</Th>
                  <Th align="right">Avg Salary</Th>
                  <Th>Head</Th>
                </tr>
              </thead>
              <tbody>
                {deptSummary.map((d) => (
                  <tr key={d.department}>
                    <Td bold>{d.department}</Td>
                    <Td align="right" mono>
                      {d.employeeCount}
                    </Td>
                    <Td align="right" mono>
                      {d.presentToday}
                    </Td>
                    <Td align="right" mono>
                      {formatINR(d.avgSalary)}
                    </Td>
                    <Td>{d.head}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            title="Shift Summary"
            hint={`${shiftSummary.length} shifts`}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shiftSummary.map((s) => {
              const pct = s.employeeCount
                ? (s.presentToday / s.employeeCount) * 100
                : 0;
              return (
                <div key={s.shift} className="shift-card">
                  <div className="shift-header">
                    <span className="shift-name">{s.shift}</span>
                    <span className="shift-time">
                      {s.startTime}–{s.endTime}
                    </span>
                  </div>
                  <div className="shift-stats">
                    <span>{s.employeeCount} employees</span>
                    <span>{s.presentToday} present</span>
                  </div>
                  <div className="shift-progress">
                    <div
                      className="shift-progress-bar"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Today's Attendance Summary + Monthly Trend */}
      <div className="two-column-reverse">
        <Panel>
          <SectionHeader title="Today's Attendance" />
          <div className="attendance-grid">
            {[
              ["Present", todaySummary.present, "success"],
              ["Absent", todaySummary.absent, "danger"],
              ["Late", todaySummary.late, "amber"],
              ["Leave", todaySummary.onLeave, "accent"],
              ["Half Day", todaySummary.halfDay, "ink"],
              ["Holiday", todaySummary.holiday, "muted"],
              ["Weekly Off", todaySummary.weeklyOff, "muted"],
            ].map(([label, value, color]) => (
              <div key={label} className="attendance-item">
                <div className="attendance-label">{label}</div>
                <div className={`attendance-value attendance-value-${color}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            title="Monthly Attendance Trend"
            hint="daily present rate"
          />
          <div className="hr-scroll" style={{ overflowX: "auto" }}>
            <div className="trend-container">
              {trend.map((t) => {
                const barH = Math.max(2, (t.pct / 100) * maxBarHeight);
                const colorClass =
                  t.pct >= 90 ? "success" : t.pct >= 75 ? "amber" : "danger";
                return (
                  <div
                    key={t.date}
                    className="trend-bar-wrapper"
                    title={`${t.date}: ${t.pct.toFixed(1)}%`}
                  >
                    <div
                      className={`trend-bar trend-bar-${colorClass}`}
                      style={{ height: barH }}
                    />
                    <div className="trend-bar-base" />
                    <div className="trend-day">{t.dayNum}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>
    </div>
    </>
  );
}
