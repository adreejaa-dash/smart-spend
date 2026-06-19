import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExpenses, deleteExpense } from '../api/expenses';

const CATEGORIES = ['All', 'Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Other'];

const formatINR = (value) =>
  '₹' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function CategoryBadge({ cat }) {
  return <span className={`badge badge-${cat?.toLowerCase()}`}>{cat}</span>;
}

export default function ExpensesPage() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const [filters, setFilters] = useState({
    category: '',
    start_date: '',
    end_date: '',
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.category && filters.category !== 'All') params.category = filters.category;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date)   params.end_date   = filters.end_date;
      const data = await getExpenses(params);
      setExpenses(data);
    } catch (err) {
      setError(err.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete expense.');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (expense) => {
    navigate('/add', { state: { expense } });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', start_date: '', end_date: '' });
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📋 Expenses</h1>
          <p className="page-subtitle">View, filter, edit and delete your expense records.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/add')}>
          ➕ Add New
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filters-row">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="category" className="form-select" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {CATEGORIES.filter(c => c !== 'All').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">From</label>
            <input type="date" name="start_date" className="form-input" value={filters.start_date} onChange={handleFilterChange} />
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <input type="date" name="end_date" className="form-input" value={filters.end_date} onChange={handleFilterChange} />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={clearFilters} style={{ marginBottom: 0 }}>
            Clear
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Summary strip */}
      {!loading && expenses.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 24,
          marginBottom: 16,
          padding: '10px 16px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem',
        }}>
          <span style={{ color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{expenses.length}</strong> expenses
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            Total: <strong style={{ color: 'var(--accent-light)' }}>{formatINR(totalAmount)}</strong>
          </span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-text" style={{ justifyContent: 'center' }}>
            <span className="spinner" style={{ color: 'var(--accent)' }} />
            Loading expenses…
          </div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No expenses found</div>
            <div className="empty-state-text">Try adjusting your filters or add a new expense.</div>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {expense.date}
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {expense.description}
                    </div>
                  </td>
                  <td>
                    <CategoryBadge cat={expense.category} />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-light)', whiteSpace: 'nowrap' }}>
                    {formatINR(expense.amount)}
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(expense)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deleting === expense.id}
                        title="Delete"
                      >
                        {deleting === expense.id ? <span className="spinner" /> : '🗑️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
