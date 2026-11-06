import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Users,
  Calendar,
  Power,
  Copy,
  Check,
  MapPin,
  Clock,
  Activity,
  Zap,
  ZapOff,
  Edit2,
  Search,
  PlusCircle,
  Crown,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Trash2,
  LayoutDashboard,
  ShieldCheck,
  Lock,
  Loader2,
  Server,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // Default tab is now Overview

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // --- GUEST STATE ---
  const initialGuestForm = {
    fullName: "",
    nickname: "",
    phone: "",
    gender: "male",
    useSalutation: true, // True = Shri/Shrimati, False = None (for females)
    expectedGuests: 1,
    withFamily: false,
    side: "bride",
    inviteType: "wedding",
    familyMembers: [],
    photos: [],
  };
  const [guestForm, setGuestForm] = useState(initialGuestForm);
  const [guestsList, setGuestsList] = useState([]);
  const [guestSearch, setGuestSearch] = useState("");
  const [editingGuestId, setEditingGuestId] = useState(null);
  const [generatedLink, setGeneratedLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // --- RSVP TAB FILTER STATE ---
  const [rsvpFilter, setRsvpFilter] = useState("all");

  // --- EVENT STATE ---
  const initialEventForm = {
    title: "",
    date: "",
    time: "",
    venue: "",
    address: "",
    description: "",
    locationLink: "https://maps.app.goo.gl/",
    eventType: "pre-wedding",
    themeColor: "#8c5ab9",
    dressCode: "",
    guidelines: "",
    colorPalette: [],
    venuePhotos: [],
  };
  const [eventsList, setEventsList] = useState([]);
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [editingEventId, setEditingEventId] = useState(null);

  const [nativeDate, setNativeDate] = useState("");
  const [nativeTime, setNativeTime] = useState("");
  const [keepAliveStatus, setKeepAliveStatus] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- FINANCE / EXPENSE STATE ---
  const [isFinanceAuthenticated, setIsFinanceAuthenticated] = useState(false);
  const [financePin, setFinancePin] = useState("");
  const [financeError, setFinanceError] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingInstallment, setViewingInstallment] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [expenseData, setExpenseData] = useState({
    expenses: [],
    summary: { totalBudget: 0, totalPaid: 0, totalPending: 0 },
  });
  const [expenseForm, setExpenseForm] = useState({
    expenseName: "",
    category: "Venue",
    totalAmount: "",
    vendorContact: "",
    side: "Both",
    paymentStatus: "Paid",
    paidDate: new Date().toISOString().split("T")[0],
  });
  const [selectedExpenseForInstallment, setSelectedExpenseForInstallment] =
    useState(null);
  const [installmentForm, setInstallmentForm] = useState({
    amount: "",
    dueDate: "",
    paidDate: "",
    status: "Pending",
    note: "",
    receipt: null, // File object for upload
  });

  // --- FILTER & SEARCH STATES ---
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sideFilter, setSideFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("pending-desc");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyFinancePin = async (e) => {
    e.preventDefault();
    if (!financePin) return;
    setIsVerifyingPin(true);
    setFinanceError("");
    try {
      const res = await axios.post(`${API_BASE}/admin/finance/verify-pin`, {
        pin: financePin,
      });
      if (res.data.success) {
        setIsFinanceAuthenticated(true);
        fetchExpenses();
      }
    } catch (error) {
      setFinanceError("Invalid Financial PIN. Access Denied.");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const filteredAndSortedExpenses = useMemo(() => {
    let result = [...expenseData.expenses]; // Always create a shallow copy before sorting

    // 1. Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (exp) =>
          exp.expenseName.toLowerCase().includes(q) ||
          (exp.vendorContact && exp.vendorContact.toLowerCase().includes(q)),
      );
    }

    // 2. Category Filter
    if (categoryFilter !== "All") {
      result = result.filter((exp) => exp.category === categoryFilter);
    }

    // Helper function to find the most recent paidDate for an expense
    const getLastPaidDate = (installments) => {
      if (!installments || installments.length === 0) return 0;

      const paidDates = installments
        // Ensure status is Paid AND paidDate exists AND isn't an empty string
        .filter(
          (inst) =>
            inst.status === "Paid" &&
            inst.paidDate &&
            inst.paidDate.trim() !== "",
        )
        .map((inst) => new Date(inst.paidDate).getTime());

      return paidDates.length > 0 ? Math.max(...paidDates) : 0; // 0 if unpaid or no valid dates
    };

    // 3. Sorting
    result.sort((a, b) => {
      // Calculate pending amounts for pending sort options
      const aPaid = (a.installments || []).reduce(
        (acc, i) => (i.status === "Paid" ? acc + i.amount : acc),
        0,
      );
      const bPaid = (b.installments || []).reduce(
        (acc, i) => (i.status === "Paid" ? acc + i.amount : acc),
        0,
      );
      const aPending = a.totalAmount - aPaid;
      const bPending = b.totalAmount - bPaid;

      switch (sortBy) {
        case "pending-desc":
          return bPending - aPending;
        case "pending-asc":
          return aPending - bPending;
        case "total-desc":
          return b.totalAmount - a.totalAmount;
        case "total-asc":
          return a.totalAmount - b.totalAmount;
        case "name-asc":
          return a.expenseName.localeCompare(b.expenseName);
        case "date-desc":
          // Newest paid date first
          return (
            getLastPaidDate(b.installments) - getLastPaidDate(a.installments)
          );
        case "date-asc":
          // Oldest paid date first (excludes items with 0 / no paid dates from being at the top)
          const aDateAsc = getLastPaidDate(a.installments) || Infinity;
          const bDateAsc = getLastPaidDate(b.installments) || Infinity;
          return aDateAsc - bDateAsc;
        default:
          return 0;
      }
    });

    return result;
  }, [expenseData.expenses, searchQuery, categoryFilter, sortBy]);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/finance/expenses`, {
        headers: { "x-admin-password": password },
      });
      setExpenseData(res.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalPhotoUrls = [...(guestForm.photos || [])];

      // Step A: If new files were selected, upload them first
      if (selectedFiles.length > 0) {
        const uploadData = new FormData();
        selectedFiles.forEach((file) => {
          uploadData.append("photos", file);
        });

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok)
          throw new Error(uploadResult.error || "Upload failed");

        // Merge newly generated Cloudinary URLs
        finalPhotoUrls = [...finalPhotoUrls, ...uploadResult.urls];
      }

      // Step B: Submit Guest Object as standard JSON
      const payload = {
        ...guestForm,
        photos: finalPhotoUrls,
      };

      const isEdit = Boolean(guestForm._id);
      const endpoint = isEdit
        ? `/api/admin/guests/${guestForm._id}`
        : "/api/admin/guests";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save guest");

      setSelectedFiles([]); // Reset file state
      onSuccess();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return;
    setIsLoggingIn(true);
    setLoginError("");
    try {
      await axios.post(
        `${API_BASE}/admin/verify`,
        {},
        { headers: { "x-admin-password": password } },
      );
      setIsAuthenticated(true);
    } catch (error) {
      setLoginError("Invalid admin password. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/guests`, {
        headers: { "x-admin-password": password },
      });
      setGuestsList(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (
      isAuthenticated &&
      (activeTab === "guests" ||
        activeTab === "rsvps" ||
        activeTab === "overview")
    )
      fetchGuests();
    if (isAuthenticated && activeTab === "events") fetchEvents();
  }, [isAuthenticated, activeTab]);

  const addFamilyMember = () => {
    setGuestForm((prev) => ({
      ...prev,
      familyMembers: [...prev.familyMembers, { name: "", gender: "male" }],
      expectedGuests: prev.expectedGuests + 1,
    }));
  };

  const updateFamilyMember = (index, field, value) => {
    const updated = [...guestForm.familyMembers];
    updated[index][field] = value;
    setGuestForm({ ...guestForm, familyMembers: updated });
  };

  const removeFamilyMember = (index) => {
    const updated = guestForm.familyMembers.filter((_, i) => i !== index);
    setGuestForm((prev) => ({
      ...prev,
      familyMembers: updated,
      expectedGuests: Math.max(1, prev.expectedGuests - 1),
    }));
  };

  const exportToCSV = () => {
    const headers = [
      "Expense Name",
      "Category",
      "Side",
      "Total Amount",
      "Installment Amount",
      "Status",
      "Due Date",
      "Paid Date",
      "Note",
      "Receipt URL",
    ];
    const rows = [];

    expenseData.expenses.forEach((exp) => {
      if (!exp.installments || exp.installments.length === 0) {
        rows.push([
          `"${exp.expenseName}"`,
          `"${exp.category}"`,
          `"${exp.side || "Both"}"`,
          exp.totalAmount,
          0,
          "No Installments",
          "",
          "",
          "",
          "",
        ]);
      } else {
        exp.installments.forEach((inst) => {
          rows.push([
            `"${exp.expenseName}"`,
            `"${exp.category}"`,
            `"${exp.side || "Both"}"`,
            exp.totalAmount,
            inst.amount,
            inst.status,
            inst.dueDate ? new Date(inst.dueDate).toLocaleDateString() : "",
            inst.paidDate ? new Date(inst.paidDate).toLocaleDateString() : "",
            `"${inst.note || ""}"`,
            `"${inst.receiptUrl || ""}"`,
          ]);
        });
      }
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Wedding_Expense_Ledger_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const upcomingDues = React.useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const dues = [];
    expenseData.expenses.forEach((exp) => {
      exp.installments.forEach((inst) => {
        if (inst.status === "Pending" && inst.dueDate) {
          const dueDateObj = new Date(inst.dueDate);
          if (dueDateObj <= sevenDaysFromNow) {
            dues.push({
              expenseName: exp.expenseName,
              category: exp.category,
              amount: inst.amount,
              dueDate: inst.dueDate,
              isOverdue: dueDateObj < now,
            });
          }
        }
      });
    });
    return dues;
  }, [expenseData.expenses]);

  const handleFamilyToggle = (checked) => {
    setGuestForm((prev) => ({
      ...prev,
      withFamily: checked,
      expectedGuests: checked ? Math.max(1, prev.familyMembers.length + 1) : 1,
    }));
  };

  // Handle selecting new files from device
  const handleFileSelect = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Remove a local file that hasn't been uploaded yet
  const removeSelectedFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Remove an existing Cloudinary URL
  const removeExistingPhoto = (indexToRemove) => {
    setGuestForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== indexToRemove),
    }));
  };
  const addPhoto = () =>
    setGuestForm({ ...guestForm, photos: [...(guestForm.photos || []), ""] });
  const updatePhoto = (index, value) => {
    const updated = [...(guestForm.photos || [])];
    updated[index] = value;
    setGuestForm({ ...guestForm, photos: updated });
  };
  const removePhoto = (index) => {
    const updated = (guestForm.photos || []).filter((_, i) => i !== index);
    setGuestForm({ ...guestForm, photos: updated });
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setGuestForm({ ...guestForm, phone: digitsOnly });
  };

  const handleSaveGuest = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    try {
      let uploadedUrls = [...(guestForm.photos || [])];

      // Step 1: Upload new local files if selected
      if (selectedFiles && selectedFiles.length > 0) {
        const uploadFormData = new FormData();
        Array.from(selectedFiles).forEach((file) => {
          uploadFormData.append("photos", file);
        });

        const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Photo upload failed");
        }

        // Append newly returned Cloudinary URLs
        uploadedUrls = [...uploadedUrls, ...(uploadData.urls || [])];
      }

      // Step 2: Submit Guest details as standard JSON
      const guestPayload = {
        ...guestForm,
        photos: uploadedUrls,
      };

      const isEdit = Boolean(
        guestForm._id ||
        (typeof editingGuestId !== "undefined" && editingGuestId),
      );
      const targetId =
        guestForm._id ||
        (typeof editingGuestId !== "undefined" && editingGuestId);

      const endpoint = isEdit
        ? `${API_BASE_URL}/admin/guest/${targetId}`
        : `${API_BASE_URL}/admin/guest`;
      const method = isEdit ? "PUT" : "POST";

      const saveRes = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(guestPayload),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveData.error || "Failed to save guest");
      }

      const savedGuest = saveData.guest || saveData;

      // 1. Reset Local File Selection
      if (typeof setSelectedFiles === "function") {
        setSelectedFiles([]);
      }

      // 2. Refresh Directory List (if function exists in component)
      if (typeof fetchGuests === "function") {
        fetchGuests();
      }

      // 3. Reset Form State to Default (for Inline Form)
      if (typeof setGuestForm === "function") {
        setGuestForm({
          fullName: "",
          nickname: "",
          gender: "male",
          useSalutation: true,
          phone: "",
          expectedGuests: 1,
          side: "bride",
          inviteType: "wedding",
          withFamily: false,
          familyMembers: [],
          photos: [],
        });
      }

      // 4. Clear Editing ID state
      if (typeof setEditingGuestId === "function") {
        setEditingGuestId(null);
      }

      // 5. Generate Shareable Link Preview (if state exists)
      if (typeof setGeneratedLink === "function" && savedGuest.inviteCode) {
        const origin = window.location.origin;
        setGeneratedLink(`${origin}/welcome/${savedGuest.inviteCode}`);
      }

      // 6. Execute Modal Callbacks (if used inside a modal)
      if (typeof onSuccess === "function") {
        onSuccess(savedGuest);
      }
      if (typeof onClose === "function") {
        onClose();
      }
    } catch (error) {
      console.error("Error saving guest:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGuest = async (e, guestId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this guest?")) return;
    try {
      await axios.delete(`${API_BASE}/admin/guest/${guestId}`, {
        headers: { "x-admin-password": password },
      });
      fetchGuests();
    } catch (error) {
      alert("Error deleting guest.");
    }
  };

  const handleEditGuestClick = (guest) => {
    setGuestForm({
      ...initialGuestForm,
      ...guest,
      phone: guest.phone || "",
      nickname: guest.nickname || "",
      gender: guest.gender || "male",
      useSalutation:
        guest.useSalutation !== undefined ? guest.useSalutation : true,
      expectedGuests: guest.expectedGuests || 1,
      photos: guest.photos || [],
    });
    setEditingGuestId(guest._id);
    setGeneratedLink(`${window.location.origin}/invite/${guest.inviteCode}`);
  };

  const cancelGuestEdit = () => {
    setGuestForm(initialGuestForm);
    setEditingGuestId(null);
    setGeneratedLink("");
  };

  const handleWhatsAppShare = (e, guest) => {
    e.stopPropagation();
    const inviteUrl = `${window.location.origin}/invite/${guest.inviteCode}`;

    // Determine prefix logically
    let prefix = "";
    if (guest.gender === "male") {
      prefix = "Shri ";
    } else if (guest.gender === "female" && guest.useSalutation !== false) {
      prefix = "Shrimati ";
    }

    const message = `Namaste ${prefix}${guest.fullName}, 🙏\n\nYou are cordially invited to celebrate the sacred union of Anukriti & Digvijay! ✨\n\nPlease view your exclusive invitation and timeline here:\n${inviteUrl}\n\nWe eagerly await your gracious presence! 🪔`;
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = guest.phone ? guest.phone.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank");
  };

  // --- EXPORT DJ PLAYLIST ---
  const handleExportDJList = () => {
    // Filter guests who actually requested a song
    const guestsWithSongs = guestsList.filter(
      (g) => g.songRequest && g.songRequest.trim() !== "",
    );

    if (guestsWithSongs.length === 0) {
      alert("No song requests found yet!");
      return;
    }

    // Create CSV content
    const csvRows = ["Guest Name,Song Request"];
    guestsWithSongs.forEach((g) => {
      // Escape quotes in names or songs to prevent CSV breaking
      const safeName = g.fullName.replace(/"/g, '""');
      const safeSong = g.songRequest.replace(/"/g, '""');
      csvRows.push(`"${safeName}","${safeSong}"`);
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create an invisible link to trigger download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "DJ_Song_Requests.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search by Full Name OR Nickname
  const filteredGuests = guestsList.filter(
    (g) =>
      g.fullName.toLowerCase().includes(guestSearch.toLowerCase()) ||
      (g.nickname &&
        g.nickname.toLowerCase().includes(guestSearch.toLowerCase())),
  );

  const filteredRsvps = guestsList.filter((g) =>
    rsvpFilter === "all" ? true : g.rsvpStatus === rsvpFilter,
  );

  const totalGuests = guestsList.length;
  const totalExpectedHeadcount = guestsList.reduce(
    (acc, g) => acc + (g.expectedGuests || 1),
    0,
  );
  const attendingCount = guestsList.filter(
    (g) => g.rsvpStatus === "attending",
  ).length;
  const declinedCount = guestsList.filter(
    (g) => g.rsvpStatus === "declined",
  ).length;
  const pendingCount = guestsList.filter(
    (g) => g.rsvpStatus === "pending",
  ).length;

  const parseToNativeDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };
  const parseToNativeTime = (timeStr) => {
    if (!timeStr) return "";
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return "";
    let [_, h, m, p] = match;
    h = parseInt(h);
    if (p.toUpperCase() === "PM" && h < 12) h += 12;
    if (p.toUpperCase() === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m}`;
  };
  const formatNativeDate = (yyyyMMdd) => {
    if (!yyyyMMdd) return "";
    const d = new Date(yyyyMMdd);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  const formatNativeTime = (hhmm) => {
    if (!hhmm) return "";
    let [h, m] = hhmm.split(":");
    h = parseInt(h);
    const p = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${p}`;
  };

  const handleNativeDateChange = (e) => {
    const val = e.target.value;
    setNativeDate(val);
    setEventForm({ ...eventForm, date: formatNativeDate(val) });
  };
  const handleNativeTimeChange = (e) => {
    const val = e.target.value;
    setNativeTime(val);
    setEventForm({ ...eventForm, time: formatNativeTime(val) });
  };

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/events?inviteType=complete`);
      setEventsList(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEventId) {
        await axios.put(
          `${API_BASE}/admin/event/${editingEventId}`,
          eventForm,
          { headers: { "x-admin-password": password } },
        );
      } else {
        await axios.post(`${API_BASE}/admin/event`, eventForm, {
          headers: { "x-admin-password": password },
        });
      }
      setEventForm(initialEventForm);
      setNativeDate("");
      setNativeTime("");
      setEditingEventId(null);
      fetchEvents();
    } catch (error) {
      alert("Error saving event.");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await axios.delete(`${API_BASE}/admin/event/${eventId}`, {
        headers: { "x-admin-password": password },
      });
      fetchEvents();
    } catch (error) {
      alert("Error deleting event.");
    }
  };

  const handleEditEventClick = (evt) => {
    setEventForm(evt);
    setNativeDate(parseToNativeDate(evt.date));
    setNativeTime(parseToNativeTime(evt.time));
    setEditingEventId(evt._id);
  };

  const cancelEventEdit = () => {
    setEventForm(initialEventForm);
    setNativeDate("");
    setNativeTime("");
    setEditingEventId(null);
  };

  const addEventColor = () =>
    setEventForm({
      ...eventForm,
      colorPalette: [...(eventForm.colorPalette || []), "#D4AF37"],
    });
  const updateEventColor = (index, value) => {
    const updated = [...(eventForm.colorPalette || [])];
    updated[index] = value;
    setEventForm({ ...eventForm, colorPalette: updated });
  };
  const removeEventColor = (index) => {
    const updated = (eventForm.colorPalette || []).filter(
      (_, i) => i !== index,
    );
    setEventForm({ ...eventForm, colorPalette: updated });
  };

  const addEventPhoto = () =>
    setEventForm({
      ...eventForm,
      venuePhotos: [...(eventForm.venuePhotos || []), ""],
    });
  const updateEventPhoto = (index, value) => {
    const updated = [...(eventForm.venuePhotos || [])];
    updated[index] = value;
    setEventForm({ ...eventForm, venuePhotos: updated });
  };
  const removeEventPhoto = (index) => {
    const updated = (eventForm.venuePhotos || []).filter((_, i) => i !== index);
    setEventForm({ ...eventForm, venuePhotos: updated });
  };

  const handleToggleKeepAlive = async (status) => {
    try {
      await axios.post(
        `${API_BASE}/admin/toggle-keepalive`,
        { isEnabled: status },
        { headers: { "x-admin-password": password } },
      );
      setKeepAliveStatus(status);
    } catch (error) {
      alert("Error toggling Keep-Alive.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c1238] via-[#1a0922] to-[#2c1238] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                y: "105vh",
                x: `${Math.random() * 100}vw`,
                opacity: 0.3,
              }}
              animate={{ y: "-10vh", rotate: 360 }}
              transition={{
                duration: Math.random() * 8 + 6,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute text-amber-500/30 text-xl"
            >
              ✨
            </motion.div>
          ))}
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin}
          className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-white/20 relative z-10"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-amber-300 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-[#2c1238]">
            <Crown size={28} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mb-2 text-center tracking-wide">
            Admin Portal
          </h2>
          <p className="text-xs text-white/60 text-center mb-6">
            Enter Password
          </p>
          <input
            type="password"
            placeholder="Enter Secure Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLoginError("");
            }}
            className="w-full p-4 bg-white/5 border border-white/20 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/10 text-white placeholder-white/50 transition-all text-center tracking-widest font-mono"
          />
          {loginError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-rose-400 text-xs text-center mb-4 font-semibold"
            >
              {loginError}
            </motion.p>
          )}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-[#2c1238] p-4 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all uppercase tracking-widest text-sm disabled:opacity-50 cursor-pointer"
          >
            {isLoggingIn ? "Verifying Key..." : "Unlock Portal"}
          </button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col md:flex-row font-sans">
      <div className="w-full md:w-72 bg-[#2c1238] shadow-2xl flex flex-col md:min-h-screen z-20 shrink-0 border-r border-gold/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="p-6 md:p-8 text-center md:text-left relative z-10 border-b border-white/10">
          <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500/80 font-bold mb-1 block">
            Control Center
          </span>
          <div className="font-script text-4xl text-white">
            Anukriti <span className="text-amber-500">&</span> Digvijay
          </div>
        </div>
        <nav className="flex md:flex-col overflow-x-auto p-4 gap-2 relative z-10">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium ${
              activeTab === "overview"
                ? "bg-amber-500 text-[#2c1238] shadow-lg scale-105"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <LayoutDashboard size={18} /> <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("guests")}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium ${
              activeTab === "guests"
                ? "bg-amber-500 text-[#2c1238] shadow-lg scale-105"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Users size={18} /> <span>Manage Guests</span>
          </button>
          <button
            onClick={() => setActiveTab("rsvps")}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium ${
              activeTab === "rsvps"
                ? "bg-amber-500 text-[#2c1238] shadow-lg scale-105"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <MessageSquare size={18} /> <span>RSVP Responses</span>
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium ${
              activeTab === "events"
                ? "bg-amber-500 text-[#2c1238] shadow-lg scale-105"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Calendar size={18} /> <span>Event Timeline</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium ${
              activeTab === "settings"
                ? "bg-amber-500 text-[#2c1238] shadow-lg scale-105"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Power size={18} /> <span>Server Settings</span>
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium ${
              activeTab === "finance"
                ? "bg-amber-500 text-[#2c1238] shadow-lg scale-105"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <ShieldCheck size={18} /> <span>Expense Tracker</span>
          </button>
        </nav>
      </div>

      <div className="flex-1 p-4 md:p-10 w-full overflow-y-auto relative">
        <div className="fixed top-0 left-1/2 w-full h-96 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

        <AnimatePresence mode="wait">
          {/* --- DASHBOARD OVERVIEW TAB --- */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto space-y-8 relative z-10"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-serif font-bold text-[#2c1238]">
                  Dashboard Overview
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                  Live metrics and system status
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Invites & Headcount */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                        Total Invitations
                      </h3>
                      <p className="text-3xl font-bold text-gray-900">
                        {totalGuests}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-t border-gray-100 pt-4 mt-2">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Activity size={24} />
                    </div>
                    <div>
                      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                        Expected Guests
                      </h3>
                      <p className="text-3xl font-bold text-gray-900">
                        {totalExpectedHeadcount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* RSVP Status */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                  <h3 className="text-[#2c1238] font-bold text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                    RSVP Breakdown
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-emerald-600 font-bold">
                        <CheckCircle2 size={18} /> Attending
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        {attendingCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-rose-600 font-bold">
                        <XCircle size={18} /> Declined
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        {declinedCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-amber-600 font-bold">
                        <Clock size={18} /> Pending
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        {pendingCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Server Settings Overview */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[#2c1238] font-bold text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                      Server Status
                    </h3>
                    <div className="flex items-center gap-4 mb-6 mt-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          keepAliveStatus
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Server size={24} />
                      </div>
                      <div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                          Anti-Sleep Mode
                        </h3>
                        <p
                          className={`text-lg font-bold ${
                            keepAliveStatus ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {keepAliveStatus ? "Active ⚡" : "Inactive 💤"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase tracking-widest font-bold text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition cursor-pointer"
                  >
                    Manage Settings
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- GUESTS TAB --- */}
          {activeTab === "guests" && (
            <motion.div
              key="guests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto relative z-10"
            >
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#2c1238]">
                      {editingGuestId ? "Edit Guest" : "Draft New Invitation"}
                    </h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                      Generate access credentials
                    </p>
                  </div>
                  {editingGuestId && (
                    <button
                      onClick={cancelGuestEdit}
                      className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-bold hover:bg-red-100 transition"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveGuest} className="space-y-5">
                  {/* Row 1: Full Name & Nickname */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aakanksha"
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-900"
                        value={guestForm.fullName}
                        onChange={(e) =>
                          setGuestForm({
                            ...guestForm,
                            fullName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Nickname (Internal)
                      </label>
                      <input
                        type="text"
                        placeholder="Optional"
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-900"
                        value={guestForm.nickname}
                        onChange={(e) =>
                          setGuestForm({
                            ...guestForm,
                            nickname: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Row 2: Gender Selection & Conditional Salutation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Gender
                      </label>
                      <select
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium text-gray-900"
                        value={guestForm.gender}
                        onChange={(e) =>
                          setGuestForm({ ...guestForm, gender: e.target.value })
                        }
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    {/* If Female is selected, show option to toggle Shrimati vs None */}
                    {guestForm.gender === "female" ? (
                      <div className="pt-5">
                        <label className="flex items-center gap-3 cursor-pointer select-none bg-gray-50 p-3.5 border border-gray-200 rounded-xl">
                          <input
                            type="checkbox"
                            checked={guestForm.useSalutation !== false}
                            onChange={(e) =>
                              setGuestForm({
                                ...guestForm,
                                useSalutation: e.target.checked,
                              })
                            }
                            className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500 accent-amber-500"
                          />
                          <span className="text-sm font-bold text-gray-700">
                            Use "Shrimati" prefix?{" "}
                            <span className="text-xs font-normal text-gray-400"></span>
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Automatic Prefix
                        </label>
                        <div className="p-3.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                          Will be addressed as{" "}
                          <span className="text-[#2c1238]">Shri</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Row 2: Phone Number & Expected Guests */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={guestForm.phone || ""}
                        onChange={handlePhoneChange}
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Expected Guests Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-900"
                        value={guestForm.expectedGuests}
                        onChange={(e) =>
                          setGuestForm({
                            ...guestForm,
                            expectedGuests: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Row 3: Side & Access Tier */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Hosting Side
                      </label>
                      <select
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium text-gray-900"
                        value={guestForm.side}
                        onChange={(e) =>
                          setGuestForm({ ...guestForm, side: e.target.value })
                        }
                      >
                        <option value="bride">Team Bride</option>
                        <option value="groom">Team Groom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Access Tier
                      </label>
                      <select
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium text-gray-900"
                        value={guestForm.inviteType}
                        onChange={(e) =>
                          setGuestForm({
                            ...guestForm,
                            inviteType: e.target.value,
                          })
                        }
                      >
                        <option value="wedding">
                          Wedding Only (Main Event)
                        </option>
                        <option value="complete">Complete (All Events)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id="family"
                      checked={guestForm.withFamily}
                      onChange={(e) => handleFamilyToggle(e.target.checked)}
                      className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500 accent-amber-500"
                    />
                    <label
                      htmlFor="family"
                      className="text-gray-700 font-medium cursor-pointer select-none"
                    >
                      Include Family Members?
                    </label>
                  </div>

                  {guestForm.withFamily && (
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-gold/30 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-[#2c1238] text-sm uppercase tracking-wider">
                          Family Roster
                        </h3>
                        <button
                          type="button"
                          onClick={addFamilyMember}
                          className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[#2c1238] font-bold hover:border-amber-500 transition shadow-sm flex items-center gap-1"
                        >
                          <PlusCircle size={14} /> Add Member
                        </button>
                      </div>
                      {guestForm.familyMembers.map((member, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Member Name"
                            required
                            className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500"
                            value={member.name}
                            onChange={(e) =>
                              updateFamilyMember(idx, "name", e.target.value)
                            }
                          />
                          <select
                            className="w-28 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500"
                            value={member.gender}
                            onChange={(e) =>
                              updateFamilyMember(idx, "gender", e.target.value)
                            }
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeFamilyMember(idx)}
                            className="text-gray-400 hover:text-red-500 p-2 transition"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-[#2c1238]/5 p-5 rounded-2xl border border-[#2c1238]/10 space-y-4 mt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-[#2c1238] text-sm uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon size={16} className="text-amber-600" />{" "}
                          Cherished Memories
                        </h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                          Upload photos directly from your device
                        </p>
                      </div>

                      {/* File Input Trigger */}
                      <label className="cursor-pointer text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[#2c1238] font-bold hover:border-amber-500 transition shadow-sm inline-flex items-center gap-1">
                        + Select Photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </label>
                    </div>

                    {/* Image Previews Grid */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      {/* 1. Render Already Saved Cloudinary Photos */}
                      {(guestForm.photos || []).map((url, idx) => (
                        <div
                          key={`existing-${idx}`}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-white"
                        >
                          <img
                            src={url}
                            alt={`Saved ${idx}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingPhoto(idx)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-90 hover:bg-red-600 transition"
                          >
                            &times;
                          </button>
                        </div>
                      ))}

                      {/* 2. Render Newly Selected Local Files */}
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={`new-${idx}`}
                          className="relative group aspect-square rounded-xl overflow-hidden border-2 border-amber-500/50 bg-white"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${idx}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            New
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(idx)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-90 hover:bg-red-600 transition"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Empty State */}
                    {(guestForm.photos || []).length === 0 &&
                      selectedFiles.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">
                          No photos added yet. Click "+ Select Photos" to add
                          some.
                        </p>
                      )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#2c1238] text-white p-4 rounded-xl font-bold hover:bg-[#1a0922] transition-colors shadow-lg uppercase tracking-widest text-sm mt-4 border border-[#4b1d5e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>
                          {editingGuestId
                            ? "Saving Updates..."
                            : "Generating Link..."}
                        </span>
                      </>
                    ) : editingGuestId ? (
                      "Save Guest Updates"
                    ) : (
                      "Generate Secure Link"
                    )}
                  </button>
                </form>

                {generatedLink && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between shadow-inner"
                  >
                    <span className="text-sm font-medium text-amber-900 truncate flex-1 mr-4 select-all">
                      {generatedLink}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className="bg-amber-100 p-2 rounded-lg text-amber-700 hover:bg-amber-200 transition"
                    >
                      {isCopied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col h-[850px] relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#2c1238]">
                      Guest Directory
                    </h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                      Invites:{" "}
                      <span className="font-bold text-gray-900">
                        {totalGuests}
                      </span>{" "}
                      | Expected Headcount:{" "}
                      <span className="font-bold text-amber-600">
                        {totalExpectedHeadcount}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="relative mb-6">
                  <Search
                    size={18}
                    className="absolute left-4 top-3.5 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by name or nickname..."
                    className="w-full pl-12 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {filteredGuests.map((guest) => (
                    <div
                      key={guest._id}
                      onClick={() => handleEditGuestClick(guest)}
                      className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-amber-400 hover:shadow-md flex justify-between items-center transition cursor-pointer group"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-lg group-hover:text-[#2c1238] transition-colors">
                            {guest.fullName}{" "}
                            {guest.nickname && (
                              <span className="text-gray-400 font-normal italic">
                                ({guest.nickname})
                              </span>
                            )}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              guest.side === "bride"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {guest.side}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {guest.inviteType}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            Expected: {guest.expectedGuests || 1}
                          </span>
                          {guest.photos?.length > 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              📸 {guest.photos.length}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleWhatsAppShare(e, guest)}
                          title="Share Invite via WhatsApp"
                          className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition shadow-sm"
                        >
                          <svg
                            className="w-5 h-5 fill-current"
                            viewBox="0 0 24 24"
                          >
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteGuest(e, guest._id)}
                          title="Delete Guest"
                          className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- RSVP RESPONSES TAB --- */}
          {activeTab === "rsvps" && (
            <motion.div
              key="rsvps"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[95%] mx-auto space-y-8 relative z-10"
            >
              <div className="text-center mb-6">
                <h2 className="text-3xl font-serif font-bold text-[#2c1238]">
                  RSVP Responses & Guest Notes
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                  Live tracking of attendance and fun polls
                </p>
              </div>

              {/* Filter Pills & DJ Export Button */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2">
                  {["all", "attending", "declined", "pending"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setRsvpFilter(tab)}
                      className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                        rsvpFilter === tab
                          ? "bg-[#2c1238] text-white border-[#2c1238] shadow-md"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {tab} (
                      {
                        guestsList.filter(
                          (g) => tab === "all" || g.rsvpStatus === tab,
                        ).length
                      }
                      )
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExportDJList}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-emerald-400 cursor-pointer"
                >
                  🎵 Download DJ List (.csv)
                </button>
              </div>

              {/* Table of Responses */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-[#2c1238] text-white text-xs uppercase tracking-wider">
                        <th className="p-4 font-bold">Guest Name</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold">Team</th>
                        <th className="p-4 font-bold">Wedding Mood</th>
                        <th className="p-4 font-bold">Vibe Check</th>
                        <th className="p-4 font-bold">Song Request</th>
                        <th className="p-4 font-bold">Note</th>
                        <th className="p-4 font-bold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredRsvps.length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
                            className="p-8 text-center text-gray-400 italic"
                          >
                            No RSVPs found in this category.
                          </td>
                        </tr>
                      ) : (
                        filteredRsvps.map((guest) => (
                          <tr
                            key={guest._id}
                            className="hover:bg-gray-50/80 transition"
                          >
                            <td className="p-4">
                              <p className="font-bold text-gray-900">
                                {guest.fullName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {guest.phone ? `${guest.phone}` : "No phone"}
                              </p>
                            </td>

                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1 text-xs uppercase font-bold px-3 py-1 rounded-full ${
                                  guest.rsvpStatus === "attending"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : guest.rsvpStatus === "declined"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {guest.rsvpStatus}
                              </span>
                            </td>

                            <td className="p-4 text-xs font-medium text-gray-700">
                              {guest.emotionalGuess ? (
                                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
                                  🎭 {guest.emotionalGuess}
                                </span>
                              ) : (
                                <span className="text-gray-300 italic">-</span>
                              )}
                            </td>

                            <td className="p-4 text-xs font-medium text-gray-700">
                              {guest.weddingMood ? (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                                  ✨ {guest.weddingMood}
                                </span>
                              ) : (
                                <span className="text-gray-300 italic">-</span>
                              )}
                            </td>

                            <td className="p-4 text-xs font-medium text-gray-700 max-w-[150px] truncate">
                              {guest.vibeCheck ? (
                                <span
                                  className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100"
                                  title={guest.vibeCheck}
                                >
                                  🕺 {guest.vibeCheck}
                                </span>
                              ) : (
                                <span className="text-gray-300 italic">-</span>
                              )}
                            </td>

                            <td className="p-4 text-xs font-medium text-gray-700 max-w-[150px] truncate">
                              {guest.songRequest ? (
                                <span
                                  className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded-lg border border-pink-100 font-bold"
                                  title={guest.songRequest}
                                >
                                  🎵 {guest.songRequest}
                                </span>
                              ) : (
                                <span className="text-gray-300 italic">-</span>
                              )}
                            </td>

                            <td className="p-4 text-xs text-gray-600 max-w-[150px] truncate">
                              {guest.guestNote ? (
                                <span
                                  className="italic bg-gray-50 p-2 rounded-xl block border border-gray-200"
                                  title={guest.guestNote}
                                >
                                  "{guest.guestNote}"
                                </span>
                              ) : (
                                <span className="text-gray-300 italic">
                                  No note
                                </span>
                              )}
                            </td>

                            <td className="p-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => handleWhatsAppShare(e, guest)}
                                title="Send WhatsApp Message"
                                className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition shadow-sm mx-auto"
                              >
                                <svg
                                  className="w-4 h-4 fill-current"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- EVENTS TAB --- */}
          {activeTab === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto relative z-10"
            >
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden h-[850px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#2c1238]">
                      {editingEventId ? "Edit Event Details" : "Add New Event"}
                    </h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                      Configure timeline items
                    </p>
                  </div>
                  {editingEventId && (
                    <button
                      onClick={cancelEventEdit}
                      className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-bold hover:bg-red-100 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveEvent} className="space-y-5 pb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Event Title
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                      value={eventForm.title}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Venue Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., The Heritage Courtyard"
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                      value={eventForm.venue}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, venue: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Full Address (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 123 Palace Road, Meerut"
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                      value={eventForm.address || ""}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Date
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-700"
                        value={nativeDate}
                        onChange={handleNativeDateChange}
                      />
                      <p className="text-[10px] text-gray-400 mt-1 pl-1">
                        Will save as:{" "}
                        <span className="font-bold text-gray-600">
                          {eventForm.date || "Empty"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Time
                      </label>
                      <input
                        type="time"
                        required
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-700"
                        value={nativeTime}
                        onChange={handleNativeTimeChange}
                      />
                      <p className="text-[10px] text-gray-400 mt-1 pl-1">
                        Will save as:{" "}
                        <span className="font-bold text-gray-600">
                          {eventForm.time || "Empty"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Google Maps Link
                    </label>
                    <input
                      type="url"
                      required
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                      value={eventForm.locationLink}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          locationLink: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Event Type
                      </label>
                      <select
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                        value={eventForm.eventType}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            eventType: e.target.value,
                          })
                        }
                      >
                        <option value="pre-wedding">Pre-Wedding</option>
                        <option value="main-wedding">Main Wedding</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        App UI Accent Color (Optional)
                      </label>
                      <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                        <input
                          type="checkbox"
                          checked={!!eventForm.themeColor}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              themeColor: e.target.checked ? "#8c5ab9" : "",
                            })
                          }
                          className="w-5 h-5 text-amber-600 rounded cursor-pointer"
                          title="Enable App UI Accent Color"
                        />

                        {eventForm.themeColor ? (
                          <>
                            <input
                              type="color"
                              className="h-9 w-12 rounded cursor-pointer border-0 p-0 bg-transparent"
                              value={eventForm.themeColor}
                              onChange={(e) =>
                                setEventForm({
                                  ...eventForm,
                                  themeColor: e.target.value,
                                })
                              }
                            />
                            <span className="text-sm font-mono uppercase font-bold text-gray-700">
                              {eventForm.themeColor}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No custom accent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Dress Code / Suggested Attire
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Festive / Pastels"
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                      value={eventForm.dressCode || ""}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          dressCode: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Practical Logistics (Parking, Gifting, etc.)
                    </label>
                    <textarea
                      rows="2"
                      placeholder="e.g., Valet parking available at the main gate."
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium resize-none"
                      value={eventForm.guidelines || ""}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          guidelines: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Family Note / Description
                    </label>
                    <textarea
                      rows="3"
                      placeholder="e.g., Join us for an evening of music and dance!"
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium resize-none"
                      value={eventForm.description}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          description: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>

                  {/* Color Palette Array (Dress Code Swatches) */}
                  <div className="bg-[#2c1238]/5 p-5 rounded-2xl border border-[#2c1238]/10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-[#2c1238] text-sm uppercase tracking-wider">
                          Guest Dress Code Palette (Swatches)
                        </h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                          Add specific hex codes for guests to match
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addEventColor}
                        className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[#2c1238] font-bold hover:border-amber-500 transition shadow-sm"
                      >
                        + Add Color
                      </button>
                    </div>
                    {(eventForm.colorPalette || []).map((color, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="color"
                          className="h-10 w-12 rounded cursor-pointer border-0 p-0 bg-transparent"
                          value={color}
                          onChange={(e) =>
                            updateEventColor(idx, e.target.value)
                          }
                        />
                        <input
                          type="text"
                          className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500 uppercase font-mono"
                          value={color}
                          onChange={(e) =>
                            updateEventColor(idx, e.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removeEventColor(idx)}
                          className="text-gray-400 hover:text-red-500 p-2 transition"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Venue Photos Array */}
                  <div className="bg-[#2c1238]/5 p-5 rounded-2xl border border-[#2c1238]/10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-[#2c1238] text-sm uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon size={16} className="text-[#2c1238]" />{" "}
                          Venue Mood Board
                        </h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                          Paste direct image URLs
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addEventPhoto}
                        className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[#2c1238] font-bold hover:border-amber-500 transition shadow-sm"
                      >
                        + Add Photo
                      </button>
                    </div>
                    {(eventForm.venuePhotos || []).map((photo, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="url"
                          placeholder="https://example.com/venue.jpg"
                          required
                          className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500"
                          value={photo}
                          onChange={(e) =>
                            updateEventPhoto(idx, e.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="text-gray-400 hover:text-red-500 p-2 transition"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#2c1238] text-white p-4 rounded-xl font-bold hover:bg-[#1a0922] transition-colors shadow-lg uppercase tracking-widest text-sm mt-4 border border-[#4b1d5e]"
                  >
                    {editingEventId ? "Save Event Updates" : "Add to Timeline"}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col h-[850px]">
                <div className="mb-6">
                  <h2 className="text-2xl font-serif font-bold text-[#2c1238]">
                    Timeline Overview
                  </h2>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                    Chronological Preview
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 pl-4 border-l-2 border-gray-100 ml-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {eventsList.map((evt) => (
                    <div
                      key={evt._id}
                      className="relative group cursor-pointer"
                      onClick={() => handleEditEventClick(evt)}
                    >
                      <div
                        className="absolute -left-[27px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-125"
                        style={{ backgroundColor: evt.themeColor || "#8c5ab9" }}
                      />
                      <div className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-amber-300 hover:shadow-lg transition-all ml-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {evt.title}
                          </h3>
                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              onClick={() => handleEditEventClick(evt)}
                              className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-amber-100 hover:text-amber-600 transition cursor-pointer"
                              title="Edit Event"
                            >
                              <Edit2 size={14} />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(evt._id)}
                              className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-rose-100 hover:text-rose-600 transition cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-2 text-xs text-gray-600 font-medium">
                          <span className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />{" "}
                            {evt.date} • {evt.time}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-400" />{" "}
                            {evt.venue}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- SETTINGS TAB --- */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto mt-10"
            >
              <div className="bg-white rounded-3xl shadow-xl p-10 text-center border-t-4 border-amber-500 relative overflow-hidden">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600 shadow-inner border border-amber-300">
                  <Activity size={36} />
                </div>
                <h2 className="text-3xl font-serif font-bold text-[#2c1238] mb-3">
                  Server Anti-Sleep Mechanism
                </h2>
                <p className="text-gray-600 mb-10 max-w-md mx-auto leading-relaxed font-medium">
                  Free hosting tiers spin down the server after 15 minutes of
                  inactivity. Activate this mode 48 hours before the wedding to
                  ensure lightning-fast load times for arriving guests.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button
                    onClick={() => handleToggleKeepAlive(true)}
                    className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-sm shadow-lg ${
                      keepAliveStatus
                        ? "bg-green-500 text-white shadow-green-500/40 ring-4 ring-green-500/20 cursor-default"
                        : "bg-white text-gray-700 border-2 border-gray-200 hover:border-green-500 hover:text-green-600 cursor-pointer"
                    }`}
                  >
                    <Zap size={20} /> Enable Fast Mode
                  </button>
                  <button
                    onClick={() => handleToggleKeepAlive(false)}
                    className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-sm shadow-lg ${
                      !keepAliveStatus
                        ? "bg-red-500 text-white shadow-red-500/40 ring-4 ring-red-500/20 cursor-default"
                        : "bg-white text-gray-700 border-2 border-gray-200 hover:border-red-500 hover:text-red-600 cursor-pointer"
                    }`}
                  >
                    <ZapOff size={20} /> Let Server Sleep
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "finance" && (
            <motion.div
              key="finance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto space-y-8 relative z-10"
            >
              {!isFinanceAuthenticated ? (
                /* --- SECONDARY SECURITY PIN GATE --- */
                <div className="flex items-center justify-center min-h-[60vh]">
                  <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onSubmit={handleVerifyFinancePin}
                    className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 text-center relative overflow-hidden"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 text-[#2c1238] shadow-inner">
                      <Lock size={30} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-[#2c1238] mb-1">
                      Financial Vault
                    </h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-6">
                      Enter Secondary Security PIN
                    </p>

                    <input
                      type="password"
                      placeholder="Enter Financial PIN"
                      value={financePin}
                      onChange={(e) => {
                        setFinancePin(e.target.value);
                        setFinanceError("");
                      }}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-amber-500 text-center text-lg tracking-widest font-mono"
                    />
                    {financeError && (
                      <p className="text-rose-500 text-xs font-semibold mb-4">
                        {financeError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifyingPin}
                      className="w-full bg-[#2c1238] text-white p-4 rounded-xl font-bold hover:bg-[#1a0922] transition-colors uppercase tracking-widest text-sm shadow-lg cursor-pointer"
                    >
                      {isVerifyingPin ? "Verifying..." : "Unlock Vault"}
                    </button>
                  </motion.form>
                </div>
              ) : (
                /* --- UNLOCKED FINANCE DASHBOARD --- */
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-[#2c1238]">
                        Wedding Expense Tracker
                      </h2>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                        Manage budgets, vendor installments & receipts
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={exportToCSV}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        📥 Export CSV
                      </button>
                      <button
                        onClick={() => setIsFinanceAuthenticated(false)}
                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl font-bold transition cursor-pointer"
                      >
                        Lock Vault 🔒
                      </button>
                    </div>
                  </div>
                  {/* Upcoming Dues Alert Banner */}
                  {upcomingDues.length > 0 && (
                    <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <span className="text-lg">⚠️</span>
                        <span>
                          Payment Alerts ({upcomingDues.length} Pending Dues)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {upcomingDues.map((due, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-2xl border text-xs flex justify-between items-center ${
                              due.isOverdue
                                ? "bg-rose-50 border-rose-200 text-rose-900"
                                : "bg-white border-amber-200 text-amber-900"
                            }`}
                          >
                            <div>
                              <p className="font-bold">{due.expenseName}</p>
                              <p className="text-[10px] opacity-75">
                                Due:{" "}
                                {new Date(due.dueDate).toLocaleDateString()}{" "}
                                {due.isOverdue && "⚠️ (OVERDUE)"}
                              </p>
                            </div>
                            <span className="font-bold text-sm">
                              ₹{due.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Summary Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
                        💰
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                          Total Budget
                        </p>
                        <h3 className="text-3xl font-bold text-gray-900">
                          ₹{expenseData.summary.totalBudget.toLocaleString()}
                        </h3>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                        ✅
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                          Total Paid
                        </p>
                        <h3 className="text-3xl font-bold text-emerald-700">
                          ₹{expenseData.summary.totalPaid.toLocaleString()}
                        </h3>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xl">
                        ⏳
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                          Pending Dues
                        </p>
                        <h3 className="text-3xl font-bold text-rose-700">
                          ₹{expenseData.summary.totalPending.toLocaleString()}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Expense List & Quick Add Form Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Expense Form */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 h-fit">
                      <h3 className="text-xl font-serif font-bold text-[#2c1238] mb-4">
                        Add New Expense
                      </h3>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            const payload = { ...expenseForm };

                            // If marked as Paid, auto-generate the completed installment
                            if (payload.paymentStatus === "Paid") {
                              payload.installments = [
                                {
                                  amount: Number(payload.totalAmount),
                                  date:
                                    payload.paidDate ||
                                    new Date().toISOString().split("T")[0],
                                  status: "Paid",
                                  note: "Full payment recorded at creation",
                                  mode: "Cash/Online", // Optional default mode
                                },
                              ];
                            } else {
                              payload.installments = [];
                            }

                            // Remove UI-only state before sending to backend
                            delete payload.paymentStatus;
                            delete payload.paidDate;

                            await axios.post(
                              `${API_BASE}/admin/finance/expense`,
                              payload,
                              {
                                headers: { "x-admin-password": password },
                              },
                            );

                            // Reset form back to defaults
                            setExpenseForm({
                              expenseName: "",
                              category: "Venue",
                              totalAmount: "",
                              vendorContact: "",
                              side: "Both",
                              paymentStatus: "Paid",
                              paidDate: new Date().toISOString().split("T")[0],
                            });
                            fetchExpenses();
                          } catch (err) {
                            alert("Error adding expense");
                          }
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Expense / Vendor Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g., Grand Palace Venue"
                            value={expenseForm.expenseName}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                expenseName: e.target.value,
                              })
                            }
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Category
                          </label>
                          <select
                            value={expenseForm.category}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                category: e.target.value,
                              })
                            }
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-sm"
                          >
                            {[
                              "Venue",
                              "Food & Catering",
                              "Hotel & Stay",
                              "Transport",
                              "Gifts",
                              "Decor",
                              "Photography",
                              "Others",
                            ].map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Total Agreed Amount (₹)
                          </label>
                          <input
                            type="number"
                            required
                            placeholder="500000"
                            value={expenseForm.totalAmount}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                totalAmount: e.target.value,
                              })
                            }
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Payment Status
                          </label>
                          <select
                            value={expenseForm.paymentStatus || "Paid"}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                paymentStatus: e.target.value,
                              })
                            }
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="Paid">Fully Paid</option>
                            <option value="Pending">
                              Pending / Requires Installments
                            </option>
                          </select>
                        </div>

                        {/* Conditionally render the date picker if marked as Paid */}
                        {expenseForm.paymentStatus === "Paid" && (
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Paid Date
                            </label>
                            <input
                              type="date"
                              required
                              value={expenseForm.paidDate || ""}
                              onChange={(e) =>
                                setExpenseForm({
                                  ...expenseForm,
                                  paidDate: e.target.value,
                                })
                              }
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-sm"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Vendor Contact (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="9876543210"
                            value={expenseForm.vendorContact}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                vendorContact: e.target.value,
                              })
                            }
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-sm"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#2c1238] text-white p-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-md hover:bg-[#1a0922] transition mt-2"
                        >
                          Create Expense Ledger
                        </button>
                      </form>
                    </div>

                    {/* Expenses Table / Directory */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                      <h3 className="text-xl font-serif font-bold text-[#2c1238] mb-6">
                        Expense Records & Installments
                      </h3>
                      {/* Filter & Sort Control Bar */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                        {/* Search input */}
                        <input
                          type="text"
                          placeholder="Search vendor or expense..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                        />

                        {/* Category Filter */}
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none cursor-pointer"
                        >
                          <option value="All">All Categories</option>
                          {[
                            "Venue",
                            "Food & Catering",
                            "Hotel & Stay",
                            "Transport",
                            "Decor",
                            "Photography",
                            "Others",
                          ].map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>

                        {/* Sort By Dropdown */}
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none cursor-pointer focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="pending-desc">
                            Sort by: Pending Amount (High to Low)
                          </option>
                          <option value="pending-asc">
                            Sort by: Pending Amount (Low to High)
                          </option>
                          <option value="total-desc">
                            Sort by: Total Amount (High to Low)
                          </option>
                          <option value="total-asc">
                            Sort by: Total Amount (Low to High)
                          </option>
                          <option value="name-asc">
                            Sort by: Vendor Name (A to Z)
                          </option>
                          <option value="date-desc">
                            Sort by: Last Paid Date (Newest First)
                          </option>
                          <option value="date-asc">
                            Sort by: Last Paid Date (Oldest First)
                          </option>
                        </select>
                      </div>
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {expenseData.expenses.length === 0 ? (
                          <p className="text-gray-400 italic text-center py-10">
                            No expenses recorded yet.
                          </p>
                        ) : (
                          filteredAndSortedExpenses.map((exp) => {
                            const paidSum = exp.installments.reduce(
                              (acc, i) =>
                                i.status === "Paid" ? acc + i.amount : acc,
                              0,
                            );
                            const progress = Math.min(
                              100,
                              Math.round((paidSum / exp.totalAmount) * 100),
                            );

                            return (
                              <div
                                key={exp._id}
                                className="p-5 bg-gray-50/50 border border-gray-200 rounded-2xl space-y-3"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                                      {exp.category}
                                    </span>
                                    <h4 className="font-bold text-gray-900 text-lg mt-1">
                                      {exp.expenseName}
                                    </h4>
                                    {exp.vendorContact && (
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        📞 {exp.vendorContact}
                                      </p>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2">
                                    {/* Add Installment Button */}
                                    <button
                                      onClick={() =>
                                        setSelectedExpenseForInstallment(exp)
                                      }
                                      className="text-xs bg-amber-500 text-[#2c1238] font-bold px-3 py-1.5 rounded-xl hover:bg-amber-400 transition cursor-pointer"
                                    >
                                      + Installment
                                    </button>
                                    {/* Edit Button */}
                                    <button
                                      onClick={() => {
                                        setEditingExpenseId(exp._id);
                                        setExpenseForm({
                                          expenseName: exp.expenseName,
                                          category: exp.category,
                                          totalAmount: exp.totalAmount,
                                          vendorContact:
                                            exp.vendorContact || "",
                                          side: exp.side || "Both",
                                        });
                                        setIsEditModalOpen(true);
                                      }}
                                      className="text-xs bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-xl hover:bg-gray-200 transition cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    {/* Delete Button */}
                                    <button
                                      onClick={async () => {
                                        if (
                                          window.confirm(
                                            `Are you sure you want to delete "${exp.expenseName}"?`,
                                          )
                                        ) {
                                          try {
                                            await axios.delete(
                                              `${API_BASE}/admin/finance/expense/${exp._id}`,
                                              {
                                                headers: {
                                                  "x-admin-password": password,
                                                },
                                              },
                                            );
                                            fetchExpenses();
                                          } catch (err) {
                                            alert("Failed to delete expense");
                                          }
                                        }
                                      }}
                                      className="text-xs bg-rose-50 text-rose-600 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-100 transition cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 font-medium">
                                  <span>Paid: ₹{paidSum.toLocaleString()}</span>
                                  <span>
                                    Pending: ₹
                                    {(
                                      exp.totalAmount - paidSum
                                    ).toLocaleString()}
                                  </span>
                                </div>

                                {/* Installment Badge List */}
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                                  {exp.installments &&
                                    exp.installments.map((inst, idx) => (
                                      <button
                                        key={inst._id || idx}
                                        type="button"
                                        onClick={() =>
                                          setViewingInstallment({
                                            installment: inst,
                                            expenseName: exp.expenseName,
                                          })
                                        }
                                        className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-2 transition cursor-pointer hover:shadow-xs ${
                                          inst.status === "Paid"
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                                            : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                                        }`}
                                      >
                                        <span>
                                          ₹{inst.amount.toLocaleString()}
                                        </span>
                                        <span className="font-bold">
                                          ({inst.status})
                                        </span>

                                        {inst.receiptUrl && (
                                          <span
                                            onClick={(e) => {
                                              e.stopPropagation(); // Prevents opening the modal when just clicking the receipt link
                                              window.open(
                                                inst.receiptUrl,
                                                "_blank",
                                                "noreferrer",
                                              );
                                            }}
                                            className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5 ml-1"
                                            title="Open Receipt Directly"
                                          >
                                            📎 Receipt
                                          </span>
                                        )}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* --- INSTALLMENT DETAILS MODAL --- */}
                  {viewingInstallment && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-gray-100 space-y-5">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                              Installment Details
                            </span>
                            <h3 className="text-xl font-serif font-bold text-[#2c1238] mt-1.5">
                              {viewingInstallment.expenseName}
                            </h3>
                          </div>
                          <button
                            onClick={() => setViewingInstallment(null)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Amount Banner */}
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                            Amount
                          </span>
                          <span className="text-2xl font-bold text-[#2c1238]">
                            ₹
                            {viewingInstallment.installment.amount?.toLocaleString()}
                          </span>
                        </div>

                        {/* Status & Dates */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-400 font-semibold block mb-0.5">
                              Status
                            </span>
                            <span
                              className={`font-bold text-sm ${
                                viewingInstallment.installment.status === "Paid"
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {viewingInstallment.installment.status}
                            </span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-400 font-semibold block mb-0.5">
                              Due Date
                            </span>
                            <span className="font-bold text-gray-800 text-sm">
                              {viewingInstallment.installment.dueDate
                                ? new Date(
                                    viewingInstallment.installment.dueDate,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        {viewingInstallment.installment.paidDate && (
                          <div className="p-3 bg-gray-50 rounded-xl text-xs">
                            <span className="text-gray-400 font-semibold block mb-0.5">
                              Paid Date
                            </span>
                            <span className="font-bold text-gray-800 text-sm">
                              {new Date(
                                viewingInstallment.installment.paidDate,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {/* Note */}
                        {viewingInstallment.installment.note && (
                          <div className="p-3 bg-gray-50 rounded-xl text-xs">
                            <span className="text-gray-400 font-semibold block mb-1">
                              Note / Description
                            </span>
                            <p className="text-gray-700 font-medium">
                              {viewingInstallment.installment.note}
                            </p>
                          </div>
                        )}

                        {/* Receipt Link Button */}
                        {viewingInstallment.installment.receiptUrl ? (
                          <a
                            href={viewingInstallment.installment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-[#2c1238] text-white p-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-md hover:bg-[#1a0922] transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                          >
                            📄 View Receipt / Invoice
                          </a>
                        ) : (
                          <div className="p-3 bg-gray-100 rounded-xl text-xs text-center text-gray-400 font-medium">
                            No receipt uploaded for this payment
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isEditModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-serif font-bold text-[#2c1238]">
                            Edit Expense Details
                          </h3>
                          <button
                            onClick={() => {
                              setIsEditModalOpen(false);
                              setEditingExpenseId(null);
                              setExpenseForm({
                                expenseName: "",
                                category: "Venue",
                                totalAmount: "",
                                vendorContact: "",
                                side: "Both",
                              });
                            }}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                              await axios.put(
                                `${API_BASE}/admin/finance/expense/${editingExpenseId}`,
                                expenseForm,
                                { headers: { "x-admin-password": password } },
                              );
                              setIsEditModalOpen(false);
                              setEditingExpenseId(null);
                              setExpenseForm({
                                expenseName: "",
                                category: "Venue",
                                totalAmount: "",
                                vendorContact: "",
                                side: "Both",
                              });
                              fetchExpenses();
                            } catch (err) {
                              alert("Failed to update expense");
                            }
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Expense / Vendor Name
                            </label>
                            <input
                              type="text"
                              required
                              value={expenseForm.expenseName}
                              onChange={(e) =>
                                setExpenseForm({
                                  ...expenseForm,
                                  expenseName: e.target.value,
                                })
                              }
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Category
                            </label>
                            <select
                              value={expenseForm.category}
                              onChange={(e) =>
                                setExpenseForm({
                                  ...expenseForm,
                                  category: e.target.value,
                                })
                              }
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium"
                            >
                              {[
                                "Venue",
                                "Food & Catering",
                                "Hotel & Stay",
                                "Transport",
                                "Gifts",
                                "Decor",
                                "Photography",
                                "Others",
                              ].map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Total Agreed Amount (₹)
                            </label>
                            <input
                              type="number"
                              required
                              value={expenseForm.totalAmount}
                              onChange={(e) =>
                                setExpenseForm({
                                  ...expenseForm,
                                  totalAmount: e.target.value,
                                })
                              }
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Vendor Contact
                            </label>
                            <input
                              type="text"
                              value={expenseForm.vendorContact}
                              onChange={(e) =>
                                setExpenseForm({
                                  ...expenseForm,
                                  vendorContact: e.target.value,
                                })
                              }
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-[#2c1238] text-white p-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-md hover:bg-[#1a0922] transition mt-2 cursor-pointer"
                          >
                            Save Changes
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {selectedExpenseForInstallment && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                              {selectedExpenseForInstallment.category}
                            </span>
                            <h3 className="text-xl font-serif font-bold text-[#2c1238] mt-1">
                              {selectedExpenseForInstallment.expenseName}
                            </h3>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedExpenseForInstallment(null)
                            }
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Add Installment Form */}
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData();
                            formData.append("amount", installmentForm.amount);
                            formData.append("dueDate", installmentForm.dueDate);
                            formData.append(
                              "paidDate",
                              installmentForm.paidDate,
                            );
                            formData.append("status", installmentForm.status);
                            formData.append("note", installmentForm.note);
                            if (installmentForm.receipt) {
                              formData.append(
                                "receipt",
                                installmentForm.receipt,
                              );
                            }

                            try {
                              await axios.post(
                                `${API_BASE}/admin/finance/expense/${selectedExpenseForInstallment._id}/installment`,
                                formData,
                                {
                                  headers: {
                                    "x-admin-password": password,
                                    "Content-Type": "multipart/form-data",
                                  },
                                },
                              );
                              setInstallmentForm({
                                amount: "",
                                dueDate: "",
                                paidDate: "",
                                status: "Pending",
                                note: "",
                                receipt: null,
                              });
                              setSelectedExpenseForInstallment(null);
                              fetchExpenses();
                            } catch (err) {
                              alert("Failed to add installment");
                            }
                          }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Amount (₹)
                              </label>
                              <input
                                type="number"
                                required
                                placeholder="25000"
                                value={installmentForm.amount}
                                onChange={(e) =>
                                  setInstallmentForm({
                                    ...installmentForm,
                                    amount: e.target.value,
                                  })
                                }
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Status
                              </label>
                              <select
                                value={installmentForm.status}
                                onChange={(e) =>
                                  setInstallmentForm({
                                    ...installmentForm,
                                    status: e.target.value,
                                  })
                                }
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Due Date
                              </label>
                              <input
                                type="date"
                                value={installmentForm.dueDate}
                                onChange={(e) =>
                                  setInstallmentForm({
                                    ...installmentForm,
                                    dueDate: e.target.value,
                                  })
                                }
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Paid Date
                              </label>
                              <input
                                type="date"
                                value={installmentForm.paidDate}
                                onChange={(e) =>
                                  setInstallmentForm({
                                    ...installmentForm,
                                    paidDate: e.target.value,
                                  })
                                }
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Note / Details
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Advance payment via UPI"
                              value={installmentForm.note}
                              onChange={(e) =>
                                setInstallmentForm({
                                  ...installmentForm,
                                  note: e.target.value,
                                })
                              }
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Upload Receipt / Invoice
                            </label>
                            <input
                              type="file"
                              onChange={(e) =>
                                setInstallmentForm({
                                  ...installmentForm,
                                  receipt: e.target.files[0],
                                })
                              }
                              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-[#2c1238] text-white p-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-md hover:bg-[#1a0922] transition mt-2 cursor-pointer"
                          >
                            Save Installment
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* --- ANALYTICS GRAPHS SECTION --- */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Category Wise Spending Chart */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                      <h3 className="text-xl font-serif font-bold text-[#2c1238] mb-2">
                        Category Spending Breakdown
                      </h3>
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-6">
                        Total vs Paid vs Pending per Category
                      </p>

                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={(() => {
                              const catMap = {};
                              expenseData.expenses.forEach((exp) => {
                                if (!catMap[exp.category]) {
                                  catMap[exp.category] = {
                                    category: exp.category,
                                    Total: 0,
                                    Paid: 0,
                                    Pending: 0,
                                  };
                                }
                                catMap[exp.category].Total += exp.totalAmount;
                                const paid = exp.installments.reduce(
                                  (sum, i) =>
                                    i.status === "Paid" ? sum + i.amount : sum,
                                  0,
                                );
                                catMap[exp.category].Paid += paid;
                                catMap[exp.category].Pending +=
                                  exp.totalAmount - paid;
                              });
                              return Object.values(catMap);
                            })()}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f0f0f0"
                            />
                            <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="Total"
                              fill="#2c1238"
                              radius={[6, 6, 0, 0]}
                            />
                            <Bar
                              dataKey="Paid"
                              fill="#10b981"
                              radius={[6, 6, 0, 0]}
                            />
                            <Bar
                              dataKey="Pending"
                              fill="#f43f5e"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Payment Timeline / Cash Outflow Chart */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                      <h3 className="text-xl font-serif font-bold text-[#2c1238] mb-2">
                        Payment Timeline (Outflow)
                      </h3>
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-6">
                        Cumulative paid amounts across dates
                      </p>

                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={(() => {
                              // Gather all paid installments sorted by date
                              let timelineMap = {};
                              expenseData.expenses.forEach((exp) => {
                                exp.installments.forEach((inst) => {
                                  if (inst.status === "Paid" && inst.paidDate) {
                                    timelineMap[inst.paidDate] =
                                      (timelineMap[inst.paidDate] || 0) +
                                      inst.amount;
                                  }
                                });
                              });
                              const sortedDates =
                                Object.keys(timelineMap).sort();
                              let runningTotal = 0;
                              return sortedDates.map((date) => {
                                runningTotal += timelineMap[date];
                                return { date, Outflow: runningTotal };
                              });
                            })()}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f0f0f0"
                            />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="Outflow"
                              stroke="#2c1238"
                              strokeWidth={3}
                              dot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
