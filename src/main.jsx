import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global.css";
// import { initializeLocations } from "./utils/initializeLocations";
// import { initializeTestUsers } from "./utils/initializeTestUsers";

// Initialize is no longer needed for production with live Firebase
// initializeLocations().catch(console.error);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
