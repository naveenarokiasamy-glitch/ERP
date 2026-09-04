import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "../../components/Header";
import "./ExpenseProfit.css";

const STORAGE_KEY = "accountsExpenseProfitTempRecords";

const TEMP_RECORDS = [
  {
    id: 1,
    recordNumber: "EXP1001",
    date: "2026-09-01",
    type: "Expense",
    category: "Transport",
    description: "Material delivery",
    amount: 2500,
    paymentMode: "UPI",
    reference: "TRN-001",
    notes: "",
  },
  {
    id: 2,
    recordNumber: "EXP1002",
    date: "2026-09-02",
    type: "Expense",
    category: "Office",
    description: "Office stationery",
    amount: 1200,
    paymentMode: "Cash",
    reference: "OFF-001",
    notes: "",
  },
  {
    id: 3,
    recordNumber: "EXP1003",
    date: "2026-09-03",
    type: "Expense",
    category: "Salary",
    description: "Employee salary",
    amount: 25000,
    paymentMode: "Bank Transfer",
    reference: "SAL-001",
    notes: "",
  },
  {
    id: 4,
    recordNumber: "INC1001",
    date: "2026-09-03",
    type: "Income",
    category: "Sales",
    description: "Tax Invoice TI1001",
    amount: 50000,
    paymentMode: "Bank Transfer",
    reference: "TI1001",
    notes: "",
  },
  {
    id: 5,
    recordNumber: "INC1002",
    date: "2026-09-04",
    type: "Income",
    category: "Sales",
    description: "Tax Invoice TI1002",
    amount: 30000,
    paymentMode: "UPI",
    reference: "TI1002",
    notes: "",
  },
];

export default function ExpenseProfit() {
  
 const [records, setRecords] = useState([]);
const [showExpenseForm, setShowExpenseForm] = useState(false);

const [expenseForm, setExpenseForm] = useState({
  date: new Date().toISOString().split("T")[0],
  type: "Expense",
  category: "Transport",
  description: "",
  amount: "",
  paymentMode: "Cash",
  reference: "",
  notes: "",
});

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(TEMP_RECORDS)
    );

    setRecords(TEMP_RECORDS);
  }, []);

  const totalExpense = useMemo(() => {
    return records
      .filter((record) => record.type === "Expense")
      .reduce((total, record) => total + Number(record.amount || 0), 0);
  }, [records]);

  const totalIncome = useMemo(() => {
    return records
      .filter((record) => record.type === "Income")
      .reduce((total, record) => total + Number(record.amount || 0), 0);
  }, [records]);

  const netProfit = totalIncome - totalExpense;

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleExpenseChange = (field, value) => {
  setExpenseForm((prev) => ({
    ...prev,
    [field]: value,
  }));
};

const handleSaveExpense = (e) => {
  e.preventDefault();

  if (
    !expenseForm.date ||
    !expenseForm.category ||
    !expenseForm.description.trim() ||
    !expenseForm.amount
  ) {
    alert("Please fill in all required fields.");
    return;
  }

  const newExpense = {
    id: Date.now(),
    recordNumber: `EXP${Date.now().toString().slice(-4)}`,
    date: expenseForm.date,
    type: expenseForm.type,
    category: expenseForm.category,
    description: expenseForm.description.trim(),
    amount: Number(expenseForm.amount),
    paymentMode: expenseForm.paymentMode,
    reference: expenseForm.reference.trim(),
    notes: expenseForm.notes.trim(),
  };

  const updatedRecords = [...records, newExpense];

  setRecords(updatedRecords);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedRecords)
  );

setExpenseForm({
  date: new Date().toISOString().split("T")[0],
  type: "Expense",
  category: "Transport",
  description: "",
  amount: "",
  paymentMode: "Cash",
  reference: "",
  notes: "",
});
  setShowExpenseForm(false);
};

return (
  <>
    <Header />

    <div className="expense-profit-page">
      <div className="expense-profit-container">

        <div className="expense-profit-top">
          <Link to="/accounts" className="erp-back-button">
            <ArrowLeft size={16} />
            Back
          </Link>

          <div className="expense-profit-heading">
            <h1>Expense &amp; Profit</h1>
            <p>
              Track expenses, income and profitability
            </p>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="expense-profit-summary">

          <div className="expense-profit-summary-card">
            <span className="summary-label">
              TOTAL EXPENSE
            </span>

            <strong className="summary-value">
              {formatAmount(totalExpense)}
            </strong>
          </div>

          <div className="expense-profit-summary-card">
            <span className="summary-label">
              TOTAL INCOME
            </span>

            <strong className="summary-value">
              {formatAmount(totalIncome)}
            </strong>
          </div>

          <div className="expense-profit-summary-card">
            <span className="summary-label">
              NET PROFIT
            </span>

            <strong
              className={`summary-value ${
                netProfit < 0 ? "loss-value" : "profit-value"
              }`}
            >
              {formatAmount(netProfit)}
            </strong>
          </div>

        </div>

        {/* EXPENSE SUMMARY */}
        <div className="expense-profit-section">
          <div className="expense-profit-section-header">
            <h2>Expense Summary</h2>
          </div>

          <div className="expense-summary-table-wrapper">
            <table className="expense-summary-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {[
                  "Purchase",
                  "Transport",
                  "Salary",
                  "Rent",
                  "Electricity",
                  "Maintenance",
                  "Office",
                  "Other",
                ].map((category) => {
                  const categoryTotal = records
                    .filter(
                      (record) =>
                        record.type === "Expense" &&
                        record.category === category
                    )
                    .reduce(
                      (total, record) =>
                        total + Number(record.amount || 0),
                      0
                    );

                  return (
                    <tr key={category}>
                      <td>{category}</td>
                      <td>{formatAmount(categoryTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PROFIT SUMMARY */}
        <div className="expense-profit-section">
          <div className="expense-profit-section-header">
            <h2>Profit Summary</h2>
          </div>

          <div className="profit-summary-grid">
            <div>
              <span>Total Income</span>
              <strong>{formatAmount(totalIncome)}</strong>
            </div>

            <div>
              <span>Total Expenses</span>
              <strong>{formatAmount(totalExpense)}</strong>
            </div>

            <div>
              <span>Net Profit</span>
              <strong
                className={
                  netProfit < 0 ? "loss-value" : "profit-value"
                }
              >
                {formatAmount(netProfit)}
              </strong>
            </div>
          </div>
        </div>
{/* ADD EXPENSE FORM */}
{showExpenseForm && (
  <div className="expense-profit-section">
    <div className="expense-profit-section-header">
      <h2>Add Expense</h2>

      <button
        type="button"
        className="expense-form-cancel"
        onClick={() => setShowExpenseForm(false)}
      >
        Cancel
      </button>
    </div>

    <form
      className="expense-form"
      onSubmit={handleSaveExpense}
    >
      <div className="expense-form-grid">

        {/* DATE */}
        <label className="expense-form-field">
          <span>
            Date <b>*</b>
          </span>

          <input
            type="date"
            value={expenseForm.date}
            onChange={(e) =>
              handleExpenseChange("date", e.target.value)
            }
          />
        </label>

        <label className="expense-form-field">
  <span>
    Transaction Type <b>*</b>
  </span>

  <select
    value={expenseForm.type}
    onChange={(e) =>
      handleExpenseChange("type", e.target.value)
    }
  >
    <option value="Expense">Expense</option>
    <option value="Income">Income</option>
  </select>
</label>

        {/* CATEGORY */}
        <label className="expense-form-field">
          <span>
            Category <b>*</b>
          </span>

          <select
            value={expenseForm.category}
            onChange={(e) =>
              handleExpenseChange(
                "category",
                e.target.value
              )
            }
          >
            <option value="Purchase">Purchase</option>
            <option value="Transport">Transport</option>
            <option value="Salary">Salary</option>
            <option value="Rent">Rent</option>
            <option value="Electricity">Electricity</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Office">Office</option>
            <option value="Other">Other</option>
          </select>
        </label>

        {/* DESCRIPTION */}
        <label className="expense-form-field expense-form-field-wide">
          <span>
            Description <b>*</b>
          </span>

          <input
            type="text"
            value={expenseForm.description}
            onChange={(e) =>
              handleExpenseChange(
                "description",
                e.target.value
              )
            }
            placeholder="Enter expense description"
          />
        </label>

        {/* AMOUNT */}
        <label className="expense-form-field">
          <span>
            Amount (₹) <b>*</b>
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={expenseForm.amount}
            onChange={(e) =>
              handleExpenseChange(
                "amount",
                e.target.value
              )
            }
            placeholder="0.00"
          />
        </label>

        {/* PAYMENT MODE */}
        <label className="expense-form-field">
          <span>Payment Mode</span>

          <select
            value={expenseForm.paymentMode}
            onChange={(e) =>
              handleExpenseChange(
                "paymentMode",
                e.target.value
              )
            }
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">
              Bank Transfer
            </option>
            <option value="Cheque">Cheque</option>
            <option value="Other">Other</option>
          </select>
        </label>

        {/* REFERENCE */}
        <label className="expense-form-field">
          <span>Reference</span>

          <input
            type="text"
            value={expenseForm.reference}
            onChange={(e) =>
              handleExpenseChange(
                "reference",
                e.target.value
              )
            }
            placeholder="e.g. EXP-001"
          />
        </label>

        {/* NOTES */}
        <label className="expense-form-field expense-form-field-wide">
          <span>Notes</span>

          <textarea
            value={expenseForm.notes}
            onChange={(e) =>
              handleExpenseChange(
                "notes",
                e.target.value
              )
            }
            placeholder="Additional notes..."
            rows="3"
          />
        </label>

      </div>

      <div className="expense-form-actions">
        <button
          type="button"
          className="expense-form-cancel"
          onClick={() => setShowExpenseForm(false)}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="expense-form-save"
        >
          Save Expense
        </button>
      </div>
    </form>
  </div>
)}

        {/* TRANSACTIONS */}
        <div className="expense-profit-section">
          <div className="expense-profit-section-header">
            <h2>Transactions</h2>

            <button
  type="button"
  className="add-expense-button"
  onClick={() => setShowExpenseForm(true)}
>
  + Add Transaction
</button>
          </div>

          <div className="expense-profit-table-wrapper">
            <table className="expense-profit-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Reference</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>{record.date}</td>
                    <td>
                      <span
                        className={`transaction-type ${
                          record.type === "Income"
                            ? "income-type"
                            : "expense-type"
                        }`}
                      >
                        {record.type}
                      </span>
                    </td>
                    <td>{record.category}</td>
                    <td>{record.description}</td>
                    <td>{formatAmount(record.amount)}</td>
                    <td>{record.paymentMode}</td>
                    <td>{record.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}