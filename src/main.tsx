import React from "react";
import ReactDOM from "react-dom/client";
import Login from "./components/Login.tsx"
import "./index.css";
import { Buffer } from 'buffer';

window.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Login/>
  </React.StrictMode>
);
