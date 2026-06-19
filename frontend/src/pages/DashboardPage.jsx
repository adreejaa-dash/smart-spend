import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { getCategorySummary, getMonthlyTrend } from '../api/analytics';
import { getExpenses } from '../api/expenses';

const CHART_COLORS = ['#6366f1', '#a78bfa', '#22d3ee', '#10b981', '#f97316', '#ef4444', '#94a3b8'];

/** Format a number as Indian Rupees: ₹1,20,000.00 */
const formatINR = (value) =>
  '₹' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Compact format for Y-axis ticks: ₹1.2L, ₹45K etc. */
const formatINRCompact = (value) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000)   return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const CATEGORY_COLORS = {
  Food: '#10b981',
  Transport: '#22d3ee',
  Bills: '#ef4444',
  Shopping: '#a78bfa',
  Entertainment: '#f97316',
  Health: '#6366f1',
  Other: '#94a3b8',
};

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}20` }}>
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: '0.85rem',
      }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label || payload[0].name}</p>
        <p style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
          {formatINR(payload[0].value ?? 0)}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [cats, monthly, exps] = await Promise.all([
          getCategorySummary(),
          getMonthlyTrend(),
          getExpenses(),
        ]);
        setCategoryData(cats);
        setMonthlyData(monthly.map((d) => ({
          ...d,
          label: d.month, // "YYYY-MM" → shown on axis
        })));
        setExpenses(exps);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = expenses.length ? totalSpend / expenses.length : 0;
  const topCategory = categoryData[0]?.category ?? '—';

  // Get current month spend
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthSpend = expenses
    .filter((e) => e.date?.startsWith(thisMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">📊 Dashboard</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <div className="loading-text" style={{ justifyContent: 'center' }}>
            <span className="spinner" style={{ color: 'var(--accent)' }} />
            Loading dashboard…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 Dashboard</h1>
        <p className="page-subtitle">Your spending at a glance.</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <StatCard icon="💰" label="Total Spend (All Time)" value={formatINR(totalSpend)} color="var(--accent-light)" />
        <StatCard icon="📅" label="This Month" value={formatINR(thisMonthSpend)} color="var(--cyan)" />
        <StatCard icon="🏆" label="Top Category" value={topCategory} color="var(--green)" />
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        <StatCard icon="🧾" label="Total Transactions" value={expenses.length} color="var(--violet)" />
        <StatCard icon="📐" label="Avg per Transaction" value={formatINR(avgExpense)} color="var(--orange)" />
      </div>

      {/* Charts */}
      {expenses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📈</div>
            <div className="empty-state-title">No data yet</div>
            <div className="empty-state-text">Add some expenses to see charts here.</div>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {/* Pie Chart */}
          <div className="chart-card">
            <div className="chart-card-title">Spending by Category</div>
            <div className="chart-card-subtitle">All-time category breakdown</div>
            {categoryData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No category data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[entry.category] || CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Line Chart */}
          <div className="chart-card">
            <div className="chart-card-title">Monthly Spending Trend</div>
            <div className="chart-card-subtitle">Last 12 months</div>
            {monthlyData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No monthly data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border-subtle)' }}
                    tickFormatter={(v) => v.slice(5)} // show "MM" only
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatINRCompact}
                    width={65}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: 'var(--accent-light)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
