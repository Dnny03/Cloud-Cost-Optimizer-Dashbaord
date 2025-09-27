import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const nav = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (!u || !p) return;
    localStorage.setItem("token", "demo"); // placeholder
    nav("/");
  };

  return (
    <div style={{display:"grid",placeItems:"center",height:"100vh"}}>
      <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12,minWidth:320}}>
        <h2>Sign in</h2>
        <input placeholder="Username" value={u} onChange={e=>setU(e.target.value)} />
        <input placeholder="Password" type="password" value={p} onChange={e=>setP(e.target.value)} />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}