import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Fade,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const EVENT_THEMES = {
  haldi: {
    color: "#FBC02D",
    bg: "linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 50%, #F9A825 100%)",
  },
  mehndi: {
    color: "#66BB6A",
    bg: "linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 50%, #43A047 100%)",
  },
  wedding: {
    color: "#F48FB1",
    bg: "linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 50%, #C2185B 100%)",
  },
  sangeet: {
    color: "#42A5F5",
    bg: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #1976D2 100%)",
  },
};

function EventPage() {
  const { inviteCode, eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const eventsRes = await axios.get(`${API_BASE_URL}/api/events`);
        const foundEvent = eventsRes.data.find(
          (e) => e._id === eventId || e.title.toLowerCase().includes(eventId)
        );
        setEvent(foundEvent);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <Backdrop open sx={{ zIndex: 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  if (!event) {
    return <Typography>Event not found</Typography>;
  }

  const theme = EVENT_THEMES[event.title.toLowerCase()] || EVENT_THEMES.sangeet;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), ${theme.bg}`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Back Button */}
      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 10,
          bgcolor: theme.color + "33",
          backdropFilter: "blur(10px)",
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/invite/${inviteCode}`)}
          sx={{ color: theme.color }}
        >
          Back to Invite
        </Button>
      </Paper>

      <Container maxWidth="md" sx={{ pt: 12, pb: 8 }}>
        <Fade in timeout={1000}>
          <Paper
            elevation={12}
            sx={{
              p: 4,
              mb: 4,
              bgcolor: theme.bg,
              border: `3px solid ${theme.color}`,
              borderRadius: 4,
            }}
          >
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Chip
                label={event.title}
                size="large"
                sx={{
                  bgcolor: theme.color,
                  color: "white",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  mb: 2,
                }}
              />
              <Typography variant="h3" sx={{ color: theme.color, mb: 1 }}>
                {event.title}
              </Typography>
            </Box>

            {/* Date & Time */}
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
                {event.date}
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                sx={{ fontSize: "1.8rem" }}
              >
                {event.time}
              </Typography>
            </Box>

            {/* ✅ CORRECTED Venue + Google Maps */}
            <Box
              sx={{
                textAlign: "center",
                p: 4,
                bgcolor: theme.color + "15",
                borderRadius: 3,
                mb: 4,
                border: `2px dashed ${theme.color}50`,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: theme.color }}>
                📍 {event.venue}
              </Typography>

              {event.locationLink ? (
                <Button
                  variant="outlined"
                  href={event.locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon="🗺️"
                  sx={{
                    color: theme.color,
                    borderColor: theme.color,
                    "&:hover": {
                      bgcolor: theme.color,
                      color: "white",
                    },
                  }}
                >
                  Open in Google Maps
                </Button>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  Location link coming soon
                </Typography>
              )}
            </Box>

            {event.description && (
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: "text.primary" }}
              >
                {event.description}
              </Typography>
            )}
          </Paper>
        </Fade>
      </Container>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
      `}</style>
    </Box>
  );
}

export default EventPage;
