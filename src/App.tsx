import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* Auth and App routes will go here later */}
      <Route path="/login" element={<div style={{padding: '100px', textAlign: 'center'}}>Login Page (Placeholder)</div>} />
      <Route path="/register" element={<div style={{padding: '100px', textAlign: 'center'}}>Register Page (Placeholder)</div>} />
    </Routes>
  );
}

export default App;
