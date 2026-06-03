import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { TimerProvider } from "./context/TimerContext";
import { AIProvider } from "./context/AIContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/global.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <UserProvider>
          <TimerProvider>
            <AIProvider>
              <App />
            </AIProvider>
          </TimerProvider>
        </UserProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);