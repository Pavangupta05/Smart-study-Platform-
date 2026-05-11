import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { AIProvider } from "./context/AIContext";
import "./styles/global.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <AIProvider>
          <App />
        </AIProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);