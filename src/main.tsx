import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { NotFound } from "./components/NotFound";
import { SiteProvider } from "./context/SiteProvider";
import "./styles/global.css";

const missing = window.location.pathname !== "/" && window.location.pathname !== "";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {missing ? (
      <SiteProvider>
        <NotFound />
      </SiteProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
);
