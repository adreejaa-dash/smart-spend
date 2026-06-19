import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/',           icon: '📊', label: 'Dashboard' },
  { to: '/add',        icon: '➕', label: 'Add Expense' },
  { to: '/expenses',   icon: '📋', label: 'Expenses' },
  { to: '/ask',        icon: '🤖', label: 'Ask SmartSpend' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💸</div>
        <span className="sidebar-logo-text">SmartSpend</span>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Navigation</span>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-link-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        AI-Powered • v1.0.0
      </div>
    </aside>
  );
}
