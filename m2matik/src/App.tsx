import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FrontPage from "./pages/FrontPage";
import GroundType from "./pages/GroundType";
import Apartment from "./pages/Apartment";
import Addition from "./pages/Addition";
import Renovation from "./pages/Renovation";
import NewHouse from "./pages/NewHouse";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Front page collects basics, then routes to GroundType */}
        <Route path="/" element={<FrontPage />} />
        {/* New canonical paths */}
        <Route path="/groundtype" element={<GroundType />} />
        <Route path="/apartment" element={<Apartment />} />
        <Route path="/groundtype/addition" element={<Addition />} />
        <Route path="/groundtype/renovation" element={<Renovation />} />
        <Route path="/groundtype/newhouse" element={<NewHouse />} />
        {/* Back-compat aliases for old /house URLs */}
        <Route path="/house" element={<GroundType />} />
        <Route path="/house/addition" element={<Addition />} />
        <Route path="/house/renovation" element={<Renovation />} />
        <Route path="/house/newhouse" element={<NewHouse />} />
      </Routes>
    </Router>
  );
}
