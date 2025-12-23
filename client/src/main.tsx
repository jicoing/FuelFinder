import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import ReactGA from 'react-ga4';

// Initialize GA4 — only in production (optional but recommended)
if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('G-0G1F10J5Y4');
}

createRoot(document.getElementById("root")!).render(<App />);