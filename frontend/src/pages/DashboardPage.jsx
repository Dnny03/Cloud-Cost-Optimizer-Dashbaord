import React from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const nav = useNavigate();
  return (
    <div style={{padding:20}}>
      <h1>Cloud Cost Optimizer Dashboard</h1>
      <button onClick={() => { localStorage.removeItem("token"); nav("/login"); }}>
        Logout
      </button>
    </div>
  );
}