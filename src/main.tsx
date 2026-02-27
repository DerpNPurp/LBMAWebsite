
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Note: index.css doesn't exist, using globals.css instead

createRoot(document.getElementById("root")!).render(<App />);
  