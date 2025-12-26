import React from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  const handleManualCodeSubmit = (e) => {
    e.preventDefault();
    const code = e.target.inviteCode.value.trim();
    if (!code) return;
    navigate(`/invite/${code}`);
  };

  return (
    <div style={{ padding: "1.5rem", textAlign: "center" }}>
      <h1>Welcome to the Wedding Invite</h1>
      <p>Have a link? Just open it. Otherwise you can enter your invite code below.</p>

      <form onSubmit={handleManualCodeSubmit} style={{ marginTop: "1rem" }}>
        <input
          type="text"
          name="inviteCode"
          placeholder="Enter invite code"
          style={{ padding: "0.5rem", minWidth: "250px" }}
        />
        <button
          type="submit"
          style={{ marginLeft: "0.5rem", padding: "0.5rem 1rem" }}
        >
          Go
        </button>
      </form>
    </div>
  );
}

export default HomePage;
