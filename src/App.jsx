import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Page Imports
import Home from './pages/Home';
import WelcomeReveal from "./pages/WelcomeReveal";
import Timeline from "./pages/Timeline";
import EventDetails from "./pages/EventDetails";
import RSVP from './pages/RSVP';
import AdminDashboard from "./pages/AdminDashboard";
import { GlobalAudioProvider } from './components/GlobalAudio'; 
import BottomNav from './components/BottomNav'; 
import GlobalPetals from './components/GlobalPetals';

function App() {
  return (
    <GlobalAudioProvider>
    <GlobalPetals/>
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Guest Flow */}
          {/* 1. The entry point with unique code. They scratch to reveal the invite. */}
          <Route path="/invite/:inviteCode" element={<WelcomeReveal />} />

          {/* 2. The RSVP Section for the guest. */}
          <Route path="/invite/:inviteCode/rsvp" element={<RSVP />} />

          {/* 3. The main events timeline for that specific guest. */}
          <Route path="/invite/:inviteCode/timeline" element={<Timeline />} />

          {/* 4. Deep dive into a specific event (Maps, time, specific details). */}
          <Route
            path="/invite/:inviteCode/event/:eventId"
            element={<EventDetails />}
          />

          {/* Admin Flow */}
          {/* Protected dashboard to generate links and edit events. */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* Sticky Bottom Navigation - Placed outside Routes so it never unmounts */}
        <BottomNav />
      </div>
    </Router>
    </GlobalAudioProvider>
  );
}

export default App;
