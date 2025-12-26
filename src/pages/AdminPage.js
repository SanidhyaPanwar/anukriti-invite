import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  Box,
  IconButton,
  Chip,
  Typography,
} from "@mui/material";
import { Delete, Edit, Add, Login } from "@mui/icons-material";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

function AdminPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("adminToken"));
  const [activeTab, setActiveTab] = useState(0);
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [loginOpen, setLoginOpen] = useState(!token);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: "",
    id: "",
  });
  const [loading, setLoading] = useState(false);
  const [newGuest, setNewGuest] = useState({
    fullName: "",
    gender: "male",
    withFamily: false,
    inviteType: "wedding",
    side: "bride",
  });
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    venue: "",
    description: "",
    locationLink: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (token && !loginOpen) {
      loadData();
    }
  }, [token, loginOpen]);

  useEffect(() => {
    if (searchQuery && token) {
      const searchGuests = async () => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/admin/guests/search?q=${searchQuery}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setSearchResults(res.data);
        } catch (err) {
          console.error("Search error:", err);
        }
      };
      const timeoutId = setTimeout(searchGuests, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, token]);

  const [loginCredentials, setLoginCredentials] = useState({
    email: "admin@panwarwedding.com",
    password: "",
  });

  const loadData = async () => {
    try {
      const [guestsRes, eventsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/guests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/admin/events`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setGuests(guestsRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      if (err.response?.status === 403) {
        localStorage.removeItem("adminToken");
        setToken(null);
        setLoginOpen(true);
      }
    }
  };

  const handleLogin = async () => {
    console.log("Login clicked!", loginCredentials);
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/login`,
        loginCredentials
      );
      console.log("Login success!", res.data);
      localStorage.setItem("adminToken", res.data.token);
      setToken(res.data.token);
      setLoginOpen(false);
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      alert("Login failed: " + (err.response?.data?.message || "Try again"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setToken(null);
    setLoginOpen(true);
  };

  const handleAddGuest = async () => {
    try {
      console.log("Adding guest:", newGuest); // DEBUG

      const guestData = {
        fullName: newGuest.fullName.trim(),
        gender: newGuest.gender,
        withFamily: !!newGuest.withFamily,
        inviteType: newGuest.inviteType, // ← EXPLICIT
        side: newGuest.side,
      };

      console.log("Sending to backend:", guestData); // DEBUG

      await axios.post(`${API_BASE_URL}/api/admin/guests`, guestData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNewGuest({
        fullName: "",
        gender: "male",
        withFamily: false,
        inviteType: "wedding",
        side: "bride",
      });

      loadData();
      alert("Guest added successfully!");
    } catch (err) {
      console.error("Admin add guest error:", err);
      console.error("Error response:", err.response?.data);
      alert(
        "Error: " + (err.response?.data?.error || err.message || "Try again")
      );
    }
  };

  const handleAddEvent = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/events`, newEvent, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewEvent({
        title: "",
        date: "",
        time: "",
        venue: "",
        description: "",
        locationLink: ""
      });
      loadData();
    } catch (err) {
      alert("Error adding event");
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteDialog.type === "guest") {
        await axios.delete(
          `${API_BASE_URL}/api/admin/guests/${deleteDialog.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.delete(
          `${API_BASE_URL}/api/admin/events/${deleteDialog.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      setDeleteDialog({ open: false, type: "", id: "" });
      loadData();
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loginOpen) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
        <Paper elevation={12} sx={{ p: 6, maxWidth: 400, mx: "auto" }}>
          <Login sx={{ fontSize: 80, color: "#AB47BC", mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
            Admin Login
          </Typography>
          <TextField
            label="Email"
            type="email"
            fullWidth
            sx={{ mb: 2 }}
            value={loginCredentials.email}
            onChange={(e) =>
              setLoginCredentials({
                ...loginCredentials,
                email: e.target.value,
              })
            }
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            sx={{ mb: 3 }}
            value={loginCredentials.password}
            onChange={(e) =>
              setLoginCredentials({
                ...loginCredentials,
                password: e.target.value,
              })
            }
            placeholder="password"
          />
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleLogin}
            disabled={loading}
            sx={{ px: 4, bgcolor: "#AB47BC", py: 1.5 }}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
          <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
            Email: admin@panwarwedding.com <br /> Password: password
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 8 }}>
      <Paper elevation={4} sx={{ p: 4, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4">Admin Dashboard</Typography>
          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          centered
          sx={{ mb: 4 }}
        >
          <Tab label="Guests" />
          <Tab label="Events" />
        </Tabs>

        {/* GUESTS TAB */}
        {activeTab === 0 && (
          <Box sx={{ mb: 4 }}>
            {/* ADD GUEST FORM - NEW 5-FIELD */}
            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Add Guest
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  alignItems: "end",
                }}
              >
                <TextField
                  label="Full Name *"
                  value={newGuest.fullName}
                  onChange={(e) =>
                    setNewGuest({ ...newGuest, fullName: e.target.value })
                  }
                  sx={{ flex: 1, minWidth: 200 }}
                />

                <TextField
                  select
                  label="Gender *"
                  value={newGuest.gender}
                  onChange={(e) =>
                    setNewGuest({ ...newGuest, gender: e.target.value })
                  }
                  sx={{ minWidth: 120 }}
                  SelectProps={{ native: true }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </TextField>

                <TextField
                  select
                  label="Side *"
                  value={newGuest.side}
                  onChange={(e) =>
                    setNewGuest({ ...newGuest, side: e.target.value })
                  }
                  sx={{ minWidth: 120 }}
                  SelectProps={{ native: true }}
                >
                  <option value="bride">Bride</option>
                  <option value="groom">Groom</option>
                </TextField>

                <TextField
                  select
                  label="Invite Type *"
                  value={newGuest.inviteType}
                  onChange={(e) =>
                    setNewGuest({ ...newGuest, inviteType: e.target.value })
                  }
                  sx={{ minWidth: 140 }}
                  SelectProps={{ native: true }}
                >
                  <option value="wedding">Wedding Only</option>
                  <option value="complete">Complete Events</option>
                </TextField>

                <TextField
                  select
                  label="Family"
                  value={newGuest.withFamily ? "yes" : "no"}
                  onChange={(e) =>
                    setNewGuest({
                      ...newGuest,
                      withFamily: e.target.value === "yes",
                    })
                  }
                  sx={{ minWidth: 120 }}
                  SelectProps={{ native: true }}
                >
                  <option value="no">Single</option>
                  <option value="yes">With Family</option>
                </TextField>

                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddGuest}
                  disabled={!newGuest.fullName.trim()}
                >
                  Add Guest
                </Button>
              </Box>
            </Paper>

            {/* SEARCH GUEST */}
            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Search Guest
              </Typography>
              <TextField
                label="Search by name (partial match)"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 3 }}
              />
              {searchResults.length > 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Found {searchResults.length} guest(s)
                </Alert>
              ) : (
                searchQuery && (
                  <Alert severity="info">
                    No guests found. Try another name.
                  </Alert>
                )
              )}
              {searchResults.map((guest) => (
                <Paper key={guest._id} sx={{ p: 3, mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="h6">{guest.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {guest.inviteCode} | {guest.gender} | {guest.side} side
                        {guest.withFamily && " | With Family"}
                      </Typography>
                      {guest.phone && (
                        <Typography variant="body2">
                          📞 {guest.phone}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={guest.inviteCode}
                      size="small"
                      clickable
                      component="a"
                      href={`/invite/${guest.inviteCode}`}
                      target="_blank"
                      sx={{ bgcolor: "#AB47BC", color: "white" }}
                    />
                  </Box>
                </Paper>
              ))}
            </Paper>

            {/* ALL GUESTS TABLE - NEW COLUMNS */}
            <Paper>
              <Typography variant="h6" sx={{ p: 3 }}>
                All Guests ({guests.length})
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell>Invite Type</TableCell>
                    <TableCell>Family</TableCell>
                    <TableCell>Invite Code</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guests.map((guest) => (
                    <TableRow key={guest._id}>
                      <TableCell>{guest.fullName}</TableCell>
                      <TableCell>{guest.gender}</TableCell>
                      <TableCell>{guest.side}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            guest.inviteType === "complete"
                              ? "All Events"
                              : "Wedding Only"
                          }
                          size="small"
                          color={
                            guest.inviteType === "complete"
                              ? "primary"
                              : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={guest.withFamily ? "Yes" : "No"}
                          size="small"
                          color="secondary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={guest.inviteCode} size="small" />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              type: "guest",
                              id: guest._id,
                            })
                          }
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* EVENTS TAB */}
        {activeTab === 1 && (
          <>
            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Add Event
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
                  gap: 2,
                }}
              >
                <TextField
                  label="Title"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                />
                <TextField
                  label="Date"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                />
                <TextField
                  label="Time"
                  value={newEvent.time}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, time: e.target.value })
                  }
                />
                <TextField
                  label="Venue"
                  value={newEvent.venue}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, venue: e.target.value })
                  }
                />
                {/* ← NEW: Google Maps Link */}
                <TextField
                  label="Google Maps Link"
                  placeholder="https://maps.app.goo.gl/abc123"
                  value={newEvent.locationLink}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, locationLink: e.target.value })
                  }
                  sx={{ gridColumn: "span 2" }}
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddEvent}
                >
                  Add
                </Button>
              </Box>
            </Paper>

            <Paper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Venue</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event._id}>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell>{event.time}</TableCell>
                      <TableCell>
                        {event.locationLink ? (
                          <a
                            href={event.locationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {event.venue}
                          </a>
                        ) : (
                          event.venue
                        )}
                      </TableCell>

                      <TableCell>
                        <IconButton
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              type: "event",
                              id: event._id,
                            })
                          }
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}
      </Paper>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this {deleteDialog.type}?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
          >
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminPage;
