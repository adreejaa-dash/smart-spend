import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import AddExpensePage from './pages/AddExpensePage';
import ExpensesPage from './pages/ExpensesPage';
import AskPage from './pages/AskPage';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/"        element={<DashboardPage />} />
            <Route path="/add"     element={<AddExpensePage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/ask"     element={<AskPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
