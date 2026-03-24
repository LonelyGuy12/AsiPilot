import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import IDEShell from './components/layout/IDEShell';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/ide" element={<IDEShell />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
