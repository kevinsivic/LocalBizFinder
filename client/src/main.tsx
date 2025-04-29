import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import 3rd party styles
import "leaflet/dist/leaflet.css";

// Initialize analytics
import { startPageLoadTracking } from "./lib/analytics";
startPageLoadTracking();

createRoot(document.getElementById("root")!).render(<App />);
