import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import AI from "./pages/AI";

function App() {
  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        <Topbar />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/ai" element={<AI />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;