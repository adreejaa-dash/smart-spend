import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createExpense, updateExpense } from '../api/expenses';
import { categorize } from '../api/ai';

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Other'];

const today = new Date().toISOString().split('T')[0];

function CategoryBadge({ cat }) {
  return (
    <span className={`badge badge-${cat?.toLowerCase()}`}>{cat}</span>
  );
}

export default function AddExpensePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const editExpense = location.state?.expense ?? null;
  const isEdit = Boolean(editExpense);

  const [form, setForm] = useState({
    amount: '',
    description: '',
    date: today,
    category: 'Other',
  });

  const [categorizing, setCategorizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [aiSuggested, setAiSuggested] = useState(false);

  useEffect(() => {
    if (editExpense) {
      setForm({
        amount: editExpense.amount,
        description: editExpense.description,
        date: editExpense.date,
        category: editExpense.category,
      });
    }
  }, [editExpense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name !== 'category') setAiSuggested(false);
    setError('');
    setSuccess('');
  };

  const handleDescriptionBlur = async () => {
    if (!form.description.trim() || form.description.trim().length < 3) return;
    try {
      setCategorizing(true);
      const { category } = await categorize(form.description);
      setForm((prev) => ({ ...prev, category }));
      setAiSuggested(true);
    } catch {
      // fail silently — user can still pick category manually
    } finally {
      setCategorizing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!form.description.trim()) {
      setError('Please enter a description.');
      return;
    }
    if (!form.date) {
      setError('Please select a date.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        amount: parseFloat(form.amount),
        description: form.description.trim(),
        date: form.date,
        category: form.category,
      };

      if (isEdit) {
        await updateExpense(editExpense.id, payload);
        setSuccess('Expense updated successfully!');
      } else {
        await createExpense(payload);
        setSuccess('Expense added successfully!');
        setForm({ amount: '', description: '', date: today, category: 'Other' });
        setAiSuggested(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to save expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '✏️ Edit Expense' : '➕ Add Expense'}</h1>
        <p className="page-subtitle">
          {isEdit ? 'Update the details of this expense.' : 'Log a new expense. AI will suggest a category as you type.'}
        </p>
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                id="description"
                name="description"
                type="text"
                className="form-input"
                placeholder="e.g. Lunch at cafe, Uber ride, Netflix..."
                value={form.description}
                onChange={handleChange}
                onBlur={handleDescriptionBlur}
                required
              />
              {categorizing && (
                <div className="loading-text" style={{ marginTop: 6 }}>
                  <span className="spinner" style={{ color: 'var(--accent)' }} />
                  AI is suggesting a category…
                </div>
              )}
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                className="form-input"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Category
                {aiSuggested && (
                  <span style={{
                    fontSize: '0.68rem',
                    background: 'rgba(99,102,241,0.15)',
                    color: 'var(--accent-light)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 100,
                    padding: '1px 8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    letterSpacing: 0,
                  }}>
                    ✨ AI suggested
                  </span>
                )}
              </label>
              <select
                id="category"
                name="category"
                className="form-select"
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {form.category && (
                <div style={{ marginTop: 6 }}>
                  <CategoryBadge cat={form.category} />
                </div>
              )}
            </div>

            {/* Error / Success */}
            {error && (
              <div className="alert alert-error">
                <span>⚠️</span> {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <span>✅</span> {success}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={saving || categorizing}>
                {saving ? (
                  <><span className="spinner" /> Saving…</>
                ) : (
                  isEdit ? '💾 Save Changes' : '➕ Add Expense'
                )}
              </button>
              {isEdit && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/expenses')}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
