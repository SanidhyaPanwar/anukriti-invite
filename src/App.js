import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import InvitePage from "./pages/InvitePage";
import EventPage from "./pages/EventPage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/invite/:inviteCode" element={<InvitePage />} />
        <Route path="/invite/:inviteCode/event/:eventId" element={<EventPage />} />
        <Route path="/admin" element={<AdminPage />} />  {/* NEW */}
      </Routes>
    </div>
  );
}

export default App;
