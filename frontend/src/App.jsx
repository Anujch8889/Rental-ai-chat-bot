import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div style={{ height: '100dvh', overflow: 'hidden' }}>  {/* ← YEH ADD KARO */}
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>  {/* ← CLOSING TAG */}
    </BrowserRouter>
  );
}

export default App;
