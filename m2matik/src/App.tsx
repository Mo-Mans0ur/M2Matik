import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FrontPage from './pages/FrontPage';
import House from './pages/House';
import Apartment from './pages/Apartment';
import Addition from './pages/Addition';
import Renovation from './pages/Renovation';
import NewHouse from './pages/NewHouse';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/house" element={<House />} />
        <Route path="/apartment" element={<Apartment />} />
        <Route path="/house/addition" element={<Addition />} />
        <Route path="/house/renovation" element={<Renovation />} />
        <Route path="/house/newhouse" element={<NewHouse />} />
      </Routes>
    </Router>
  );
}
