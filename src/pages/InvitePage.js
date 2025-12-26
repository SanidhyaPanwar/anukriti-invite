import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Tabs,
  Tab,
  AppBar,
  Fade,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import ProgrammesTab from "../components/ProgrammesTab";
import GalleryTab from "../components/GalleryTab";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

function getHonorific(gender) {
  return gender === "female" ? "Shrimati" : "Shri";
}

function InvitePage() {
  const { inviteCode } = useParams();
  const [guest, setGuest] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [guestRes, eventsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/invite/${inviteCode}`),
          axios.get(`${API_BASE_URL}/api/events`),
        ]);
        setGuest(guestRes.data);
        setEvents(eventsRes.data || []);
      } catch (err) {
        setError("Could not load your invite.");
      } finally {
        setLoading(false);
      }
    }
    if (inviteCode) fetchData();
  }, [inviteCode]);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !guest) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          {error || "Guest not found"}
        </Typography>
      </Container>
    );
  }

  const honorific = getHonorific(guest.gender);
  const guestName = `${honorific} ${guest.fullName}${
    guest.withFamily ? " and Family" : ""
  }`;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "linear-gradient(135deg, #FAF5FF 0%, #F3E5F5 100%)", // ← Lavender background
      }}
    >
      {/* ELEGANT LAVENDER WEDDING CARD */}
      <Paper
        elevation={24}
        sx={{
          mx: 4,
          mt: 4,
          mb: 0,
          borderRadius: 8,
          overflow: "hidden",
          maxWidth: 600,
          mx: "auto",
        }}
      >
        {/* 🌸 LAVENDER GOLDEN HEADER */}
        <Box
          sx={{
            bgcolor:
              "linear-gradient(135deg, #E1BEE7 0%, #CE93D8 50%, #BA68C8 100%)", // ← Lavender gradient
            color: "#2c1810",
            p: 6,
            textAlign: "center",
            position: "relative",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily: 'Playfair Display, "Great Vibes", cursive',
              fontSize: "2.5rem",
              fontWeight: 700,
              mb: 1,
              textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            Wedding Invitation
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: "Playfair Display, serif",
              fontSize: "1.3rem",
              mb: 3,
              fontStyle: "italic",
            }}
          >
            With the blessings of our elders
          </Typography>
        </Box>

        {/* 👤 GUEST NAME - LIGHT LAVENDER BOX */}
        <Box sx={{ p: 6, textAlign: "center", bgcolor: "#F3E5F5" }}>
          {" "}
          {/* ← Light lavender */}
          <Typography
            variant="h4"
            sx={{
              fontFamily: "Playfair Display, serif",
              fontSize: "1.8rem",
              fontWeight: 600,
              mb: 2,
              color: "#6A1B9A", // ← Deep lavender
            }}
          >
            {guestName}
          </Typography>
        </Box>

        {/* 💍 MAIN INVITATION TEXT */}
        <Box sx={{ p: 6, textAlign: "center" }}>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 2,
              fontSize: "1.1rem",
              mb: 4,
              color: "text.primary",
            }}
          >
            It gives us <strong>immense pleasure</strong> to invite you
            <br />
            to grace the wedding ceremony of
          </Typography>
          <Divider
            sx={{ my: 3, mx: "auto", width: "80%", bgcolor: "#AB47BC" }}
          />{" "}
          {/* ← Lavender pink */}
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Playfair Display, "Great Vibes", cursive',
              fontSize: "3rem",
              fontWeight: 700,
              mb: 2,
              color: "#AB47BC", // ← Lavender pink
              lineHeight: 1.1,
            }}
          >
            Anukriti & Prashant
          </Typography>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 2,
              fontSize: "1.1rem",
              mb: 4,
              color: "text.primary",
            }}
          >
            and bless the couple on this <strong>auspicious occasion</strong>.
            <br />
            We seek your <strong>presence and blessings</strong>.
          </Typography>
          <Divider
            sx={{ my: 3, mx: "auto", width: "60%", bgcolor: "#CE93D8" }}
          />{" "}
          {/* ← Medium lavender */}
          <Typography
            variant="h6"
            sx={{
              fontFamily: "Playfair Display, serif",
              fontWeight: 600,
              color: "#6A1B9A", // ← Deep lavender
            }}
          >
            On behalf of the Panwar Family
          </Typography>
        </Box>
      </Paper>

      {/* 📱 TABS BELOW CARD */}
      <Container maxWidth="md" sx={{ mt: 8, pb: 8 }}>
        <AppBar
          position="static"
          color="default"
          elevation={0}
          sx={{ borderRadius: 2 }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            centered
          >
            <Tab label="📅 Programmes" />
            <Tab label="🖼️ Photos With Us" />
          </Tabs>
        </AppBar>

        {activeTab === 0 && (
          <ProgrammesTab
            events={events}
            guest={guest}
            inviteCode={inviteCode}
          />
        )}
        {activeTab === 1 && <GalleryTab photos={guest.photos || []} />}
      </Container>
    </Box>
  );
}

export default InvitePage;
