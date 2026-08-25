import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Calendar, Power, Copy, Check, MapPin, Clock, Activity, Zap, ZapOff, Edit2, Search, PlusCircle, Crown, Image as ImageIcon, Send, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('guests');

  const API_BASE = 'http://localhost:5001/api';

  // --- GUEST STATE ---
  const initialGuestForm = { fullName: '', phone: '', gender: 'male', withFamily: false, side: 'bride', inviteType: 'wedding', familyMembers: [], photos: [] };
  const [guestForm, setGuestForm] = useState(initialGuestForm);
  const [guestsList, setGuestsList] = useState([]);
  const [guestSearch, setGuestSearch] = useState('');
  const [editingGuestId, setEditingGuestId] = useState(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // --- RSVP TAB FILTER STATE ---
  const [rsvpFilter, setRsvpFilter] = useState('all');

  // --- EVENT STATE ---
  const initialEventForm = { 
    title: '', date: '', time: '', venue: '', address: '', description: '', 
    locationLink: 'https://maps.app.goo.gl/', eventType: 'pre-wedding', themeColor: '#8c5ab9',
    dressCode: '', guidelines: '', colorPalette: [], venuePhotos: []
  };
  const [eventsList, setEventsList] = useState([]);
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [editingEventId, setEditingEventId] = useState(null);

  // Native Date/Time picker helper states
  const [nativeDate, setNativeDate] = useState('');
  const [nativeTime, setNativeTime] = useState('');

  // --- SETTINGS STATE ---
  const [keepAliveStatus, setKeepAliveStatus] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password) setIsAuthenticated(true);
  };

  // --- GUEST LOGIC ---
  const fetchGuests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/guests`, { headers: { 'x-admin-password': password } });
      setGuestsList(res.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (isAuthenticated && (activeTab === 'guests' || activeTab === 'rsvps')) fetchGuests();
    if (isAuthenticated && activeTab === 'events') fetchEvents();
  }, [isAuthenticated, activeTab]);

  const addFamilyMember = () => setGuestForm({ ...guestForm, familyMembers: [...guestForm.familyMembers, { name: '', gender: 'male' }] });
  const updateFamilyMember = (index, field, value) => {
    const updated = [...guestForm.familyMembers];
    updated[index][field] = value;
    setGuestForm({ ...guestForm, familyMembers: updated });
  };
  const removeFamilyMember = (index) => {
    const updated = guestForm.familyMembers.filter((_, i) => i !== index);
    setGuestForm({ ...guestForm, familyMembers: updated });
  };

  const addPhoto = () => setGuestForm({ ...guestForm, photos: [...(guestForm.photos || []), ''] });
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
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setGuestForm({ ...guestForm, phone: digitsOnly });
  };

  const handleSaveGuest = async (e) => {
    e.preventDefault();
    try {
      if (editingGuestId) {
        await axios.put(`${API_BASE}/admin/guest/${editingGuestId}`, guestForm, { headers: { 'x-admin-password': password } });
        alert('Guest updated successfully!');
      } else {
        const res = await axios.post(`${API_BASE}/admin/guest`, guestForm, { headers: { 'x-admin-password': password } });
        setGeneratedLink(`${window.location.origin}/invite/${res.data.inviteCode}`);
      }
      setGuestForm(initialGuestForm);
      setEditingGuestId(null);
      fetchGuests();
    } catch (error) { alert('Error saving guest.'); }
  };

  const handleEditGuestClick = (guest) => {
    setGuestForm({ ...guest, phone: guest.phone || '', photos: guest.photos || [] });
    setEditingGuestId(guest._id);
    setGeneratedLink(`${window.location.origin}/invite/${guest.inviteCode}`);
  };

  const cancelGuestEdit = () => {
    setGuestForm(initialGuestForm);
    setEditingGuestId(null);
    setGeneratedLink('');
  };

  const handleWhatsAppShare = (e, guest) => {
    e.stopPropagation();
    const inviteUrl = `${window.location.origin}/invite/${guest.inviteCode}`;
    const message = `Namaste ${guest.fullName}, 🙏\n\nYou are cordially invited to celebrate the sacred union of Anukriti & Digvijay! ✨\n\nPlease view your exclusive  invitation and timeline here:\n${inviteUrl}\n\nWe eagerly await your gracious presence! 🪔`;
    
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = guest.phone ? guest.phone.replace(/\D/g, '') : '';
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const filteredGuests = guestsList.filter(g => g.fullName.toLowerCase().includes(guestSearch.toLowerCase()));
  const filteredRsvps = guestsList.filter(g => {
    if (rsvpFilter === 'all') return true;
    return g.rsvpStatus === rsvpFilter;
  });

  const totalGuests = guestsList.length;
  const attendingCount = guestsList.filter(g => g.rsvpStatus === 'attending').length;
  const declinedCount = guestsList.filter(g => g.rsvpStatus === 'declined').length;
  const pendingCount = guestsList.filter(g => g.rsvpStatus === 'pending').length;

  // --- DATE/TIME PARSING HELPERS ---
  const parseToNativeDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch { return ''; }
  };

  const parseToNativeTime = (timeStr) => {
    if (!timeStr) return '';
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return '';
    let [_, h, m, p] = match;
    h = parseInt(h);
    if (p.toUpperCase() === 'PM' && h < 12) h += 12;
    if (p.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m}`;
  };

  const formatNativeDate = (yyyyMMdd) => {
    if (!yyyyMMdd) return '';
    const d = new Date(yyyyMMdd);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatNativeTime = (hhmm) => {
    if (!hhmm) return '';
    let [h, m] = hhmm.split(':');
    h = parseInt(h);
    const p = h >= 12 ? 'PM' : 'AM';
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

  // --- EVENT LOGIC ---
  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/events?inviteType=complete`);
      setEventsList(res.data);
    } catch (error) { console.error(error); }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEventId) {
        await axios.put(`${API_BASE}/admin/event/${editingEventId}`, eventForm, { headers: { 'x-admin-password': password } });
        alert('Event updated successfully!');
      } else {
        await axios.post(`${API_BASE}/admin/event`, eventForm, { headers: { 'x-admin-password': password } });
        alert('Event created successfully!');
      }
      setEventForm(initialEventForm);
      setNativeDate('');
      setNativeTime('');
      setEditingEventId(null);
      fetchEvents();
    } catch (error) { alert('Error saving event.'); }
  };

  const handleEditEventClick = (evt) => {
    setEventForm(evt);
    setNativeDate(parseToNativeDate(evt.date));
    setNativeTime(parseToNativeTime(evt.time));
    setEditingEventId(evt._id);
  };

  const cancelEventEdit = () => {
    setEventForm(initialEventForm);
    setNativeDate('');
    setNativeTime('');
    setEditingEventId(null);
  };

  // Event Arrays Logic
  const addEventColor = () => setEventForm({ ...eventForm, colorPalette: [...(eventForm.colorPalette || []), '#D4AF37'] });
  const updateEventColor = (index, value) => {
    const updated = [...(eventForm.colorPalette || [])];
    updated[index] = value;
    setEventForm({ ...eventForm, colorPalette: updated });
  };
  const removeEventColor = (index) => {
    const updated = (eventForm.colorPalette || []).filter((_, i) => i !== index);
    setEventForm({ ...eventForm, colorPalette: updated });
  };

  const addEventPhoto = () => setEventForm({ ...eventForm, venuePhotos: [...(eventForm.venuePhotos || []), ''] });
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
      await axios.post(`${API_BASE}/admin/toggle-keepalive`, { isEnabled: status }, { headers: { 'x-admin-password': password } });
      setKeepAliveStatus(status);
      alert(`Keep-Alive is now ${status ? 'ON' : 'OFF'}`);
    } catch (error) {
      alert('Error toggling Keep-Alive. Check password or server.');
    }
  };

  // --- RENDER LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c1238] via-[#1a0922] to-[#2c1238] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <motion.div key={i} initial={{ y: '105vh', x: `${Math.random() * 100}vw`, opacity: 0.3 }} animate={{ y: '-10vh', rotate: 360 }} transition={{ duration: Math.random() * 8 + 6, repeat: Infinity, ease: 'linear' }} className="absolute text-amber-500/30 text-xl">
              ✨
            </motion.div>
          ))}
        </div>
        
        <motion.form 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin} 
          className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-white/20 relative z-10"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-amber-300 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-[#2c1238]">
            <Crown size={28} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mb-6 text-center tracking-wide"> Admin Portal</h2>
          <input type="password" placeholder="Enter Secure Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-white/5 border border-white/20 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/10 text-white placeholder-white/50 transition-all text-center tracking-widest font-mono" />
          <button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-[#2c1238] p-4 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all uppercase tracking-widest text-sm">
            Unlock Portal
          </button>
        </motion.form>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col md:flex-row font-sans">
      
      {/* --- SIDEBAR --- */}
      <div className="w-full md:w-72 bg-[#2c1238] shadow-2xl flex flex-col md:min-h-screen z-20 shrink-0 border-r border-gold/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
        
        <div className="p-6 md:p-8 text-center md:text-left relative z-10 border-b border-white/10">
          <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500/80 font-bold mb-1 block">Control Center</span>
          <div className="font-script text-4xl text-white">Anukriti <span className="text-amber-500">&</span> Digvijay</div>
        </div>

        <nav className="flex md:flex-col overflow-x-auto p-4 gap-2 relative z-10">
          <button onClick={() => setActiveTab('guests')} className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'guests' ? 'bg-amber-500 text-[#2c1238] shadow-lg scale-105' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <Users size={18} /> <span>Manage Guests</span>
          </button>
          <button onClick={() => setActiveTab('rsvps')} className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'rsvps' ? 'bg-amber-500 text-[#2c1238] shadow-lg scale-105' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <MessageSquare size={18} /> <span>RSVP Responses</span>
          </button>
          <button onClick={() => setActiveTab('events')} className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'events' ? 'bg-amber-500 text-[#2c1238] shadow-lg scale-105' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <Calendar size={18} /> <span>Event Timeline</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'settings' ? 'bg-amber-500 text-[#2c1238] shadow-lg scale-105' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <Power size={18} /> <span>Server Settings</span>
          </button>
        </nav>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 p-4 md:p-10 w-full overflow-y-auto relative">
        <div className="fixed top-0 left-1/2 w-full h-96 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

        <AnimatePresence mode="wait">
          
          {/* --- GUESTS TAB --- */}
          {activeTab === 'guests' && (
            <motion.div key="guests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto relative z-10">
              {/* Form Column */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#2c1238]">{editingGuestId ? 'Edit  Guest' : 'Draft New Invitation'}</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Generate access credentials</p>
                  </div>
                  {editingGuestId && <button onClick={cancelGuestEdit} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-bold hover:bg-red-100 transition">Cancel Edit</button>}
                </div>
                
                <form onSubmit={handleSaveGuest} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input type="text" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-medium text-gray-900" value={guestForm.fullName} onChange={e => setGuestForm({...guestForm, fullName: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number (Digits Only for WhatsApp)</label>
                    <input type="tel" placeholder="919876543210" value={guestForm.phone || ''} onChange={handlePhoneChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-medium text-gray-900" />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Gender</label>
                      <select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium text-gray-900" value={guestForm.gender} onChange={e => setGuestForm({...guestForm, gender: e.target.value})}>
                        <option value="male">Male</option><option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Side</label>
                      <select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium text-gray-900" value={guestForm.side} onChange={e => setGuestForm({...guestForm, side: e.target.value})}>
                        <option value="bride">Team Bride</option><option value="groom">Team Groom</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Access Tier</label>
                    <select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium text-gray-900" value={guestForm.inviteType} onChange={e => setGuestForm({...guestForm, inviteType: e.target.value})}>
                      <option value="wedding">Wedding Only (Main Event)</option><option value="complete">Complete (All Events)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input type="checkbox" id="family" checked={guestForm.withFamily} onChange={e => setGuestForm({...guestForm, withFamily: e.target.checked})} className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500 accent-amber-500" />
                    <label htmlFor="family" className="text-gray-700 font-medium cursor-pointer select-none">Include Family Members?</label>
                  </div>

                  {guestForm.withFamily && (
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-gold/30 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-[#2c1238] text-sm uppercase tracking-wider">Family Roster</h3>
                        <button type="button" onClick={addFamilyMember} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[#2c1238] font-bold hover:border-amber-500 transition shadow-sm flex items-center gap-1"><PlusCircle size={14}/> Add Member</button>
                      </div>
                      {guestForm.familyMembers.map((member, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" placeholder="Member Name" required className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500" value={member.name} onChange={e => updateFamilyMember(idx, 'name', e.target.value)} />
                          <select className="w-28 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500" value={member.gender} onChange={e => updateFamilyMember(idx, 'gender', e.target.value)}>
                            <option value="male">Male</option><option value="female">Female</option>
                          </select>
                          <button type="button" onClick={() => removeFamilyMember(idx)} className="text-gray-400 hover:text-red-500 p-2 transition">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Photos Section */}
                  <div className="bg-[#2c1238]/5 p-5 rounded-2xl border border-[#2c1238]/10 space-y-4 mt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-[#2c1238] text-sm uppercase tracking-wider flex items-center gap-1.5"><ImageIcon size={16} className="text-amber-600"/> Cherished Memories</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Paste direct image URLs</p>
                      </div>
                      <button type="button" onClick={addPhoto} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[#2c1238] font-bold hover:border-amber-500 transition shadow-sm">+ Add Photo</button>
                    </div>
                    {(guestForm.photos || []).map((photo, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input type="url" placeholder="https://example.com/image.jpg" required className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500" value={photo} onChange={e => updatePhoto(idx, e.target.value)} />
                        <button type="button" onClick={() => removePhoto(idx)} className="text-gray-400 hover:text-red-500 p-2 transition">&times;</button>
                      </div>
                    ))}
                  </div>

                  <button type="submit" className="w-full bg-[#2c1238] text-white p-4 rounded-xl font-bold hover:bg-[#1a0922] transition-colors shadow-lg uppercase tracking-widest text-sm mt-4 border border-[#4b1d5e]">
                    {editingGuestId ? 'Save Guest Updates' : 'Generate Secure Link'}
                  </button>
                </form>

                {generatedLink && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between shadow-inner">
                    <span className="text-sm font-medium text-amber-900 truncate flex-1 mr-4 select-all">{generatedLink}</span>
                    <button onClick={() => { navigator.clipboard.writeText(generatedLink); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }} className="bg-amber-100 p-2 rounded-lg text-amber-700 hover:bg-amber-200 transition">
                      {isCopied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </motion.div>
                )}
              </div>

              {/* List & Search Column */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col h-[850px] relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#2c1238]">Guest Directory</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Total Invites: {guestsList.length}</p>
                  </div>
                </div>
                <div className="relative mb-6">
                  <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                  <input type="text" placeholder="Search by name..." className="w-full pl-12 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium" value={guestSearch} onChange={e => setGuestSearch(e.target.value)} />
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {filteredGuests.map(guest => (
                    <div 
                      key={guest._id} 
                      onClick={() => handleEditGuestClick(guest)} 
                      className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-amber-400 hover:shadow-md flex justify-between items-center transition cursor-pointer group"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-lg group-hover:text-[#2c1238] transition-colors">{guest.fullName}</h4>
                          <span className="text-xs text-gray-400 font-mono">({guest.phone || 'No phone'})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${guest.side === 'bride' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{guest.side}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{guest.inviteType}</span>
                          {guest.withFamily && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">+{guest.familyMembers?.length || 0} Family</span>}
                          {guest.photos?.length > 0 && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">📸 {guest.photos.length}</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleWhatsAppShare(e, guest)}
                        title="Share Invite via WhatsApp"
                        className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition shadow-sm shrink-0"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- RSVP RESPONSES TAB --- */}
          {activeTab === 'rsvps' && (
            <motion.div key="rsvps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8 relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-3xl font-serif font-bold text-[#2c1238]">RSVP Responses & Guest Notes</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Live tracking of attendance and fun polls</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-lavender-100 text-[#2c1238] flex items-center justify-center font-bold">
                    <Users size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total Invitees</p>
                    <h3 className="text-2xl font-bold text-gray-900">{totalGuests}</h3>
                  </div>
                </div>
                {/* ... other stats ... */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Attending</p>
                    <h3 className="text-2xl font-bold text-emerald-700">{attendingCount}</h3>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <XCircle size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Declined</p>
                    <h3 className="text-2xl font-bold text-rose-700">{declinedCount}</h3>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Clock size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Pending</p>
                    <h3 className="text-2xl font-bold text-amber-700">{pendingCount}</h3>
                  </div>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2 justify-center md:justify-start">
                {['all', 'attending', 'declined', 'pending'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setRsvpFilter(tab)}
                    className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${rsvpFilter === tab ? 'bg-[#2c1238] text-white border-[#2c1238] shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
                  >
                    {tab} ({guestsList.filter(g => tab === 'all' || g.rsvpStatus === tab).length})
                  </button>
                ))}
              </div>

              {/* Table of Responses */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#2c1238] text-white text-xs uppercase tracking-wider">
                        <th className="p-4 font-bold">Guest Name</th>
                        <th className="p-4 font-bold">RSVP Status</th>
                        <th className="p-4 font-bold">Emotional Guess</th>
                        <th className="p-4 font-bold">Wedding Mood</th>
                        <th className="p-4 font-bold">Guest Note / Wish</th>
                        <th className="p-4 font-bold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredRsvps.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-gray-400 italic">
                            No RSVPs found in this category.
                          </td>
                        </tr>
                      ) : (
                        filteredRsvps.map((guest) => (
                          <tr key={guest._id} className="hover:bg-gray-50/80 transition">
                            <td className="p-4">
                              <p className="font-bold text-gray-900">{guest.fullName}</p>
                              <p className="text-xs text-gray-400">{guest.phone ? `+${guest.phone}` : 'No phone'}</p>
                            </td>

                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 text-xs uppercase font-bold px-3 py-1 rounded-full ${
                                guest.rsvpStatus === 'attending' ? 'bg-emerald-100 text-emerald-800' :
                                guest.rsvpStatus === 'declined' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {guest.rsvpStatus}
                              </span>
                            </td>

                            <td className="p-4 text-xs font-medium text-gray-700">
                              {guest.emotionalGuess ? <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">🎭 {guest.emotionalGuess}</span> : <span className="text-gray-300 italic">-</span>}
                            </td>

                            <td className="p-4 text-xs font-medium text-gray-700">
                              {guest.weddingMood ? <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">✨ {guest.weddingMood}</span> : <span className="text-gray-300 italic">-</span>}
                            </td>

                            <td className="p-4 text-xs text-gray-600 max-w-xs truncate">
                              {guest.guestNote ? (
                                <span className="italic bg-gray-50 p-2 rounded-xl block border border-gray-200">
                                  "{guest.guestNote}"
                                </span>
                              ) : (
                                <span className="text-gray-300 italic">No note left</span>
                              )}
                            </td>

                            <td className="p-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => handleWhatsAppShare(e, guest)}
                                title="Send WhatsApp Message"
                                className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition shadow-sm mx-auto"
                              >
                                <Send size={14} />
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
          {activeTab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto relative z-10">
              
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden h-[850px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#2c1238]">{editingEventId ? 'Edit Event Details' : 'Add New Event'}</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Configure timeline items</p>
                  </div>
                  {editingEventId && <button onClick={cancelEventEdit} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-bold hover:bg-red-100 transition">Cancel</button>}
                </div>

                <form onSubmit={handleSaveEvent} className="space-y-5 pb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Title</label>
                    <input type="text" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Venue Name</label>
                    <input type="text" required placeholder="e.g., The Heritage Courtyard" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" value={eventForm.venue} onChange={e => setEventForm({...eventForm, venue: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Address (Optional)</label>
                    <input type="text" placeholder="e.g., 123  Palace Road, Meerut" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" value={eventForm.address || ''} onChange={e => setEventForm({...eventForm, address: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                      <input type="date" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-700" value={nativeDate} onChange={handleNativeDateChange} />
                      <p className="text-[10px] text-gray-400 mt-1 pl-1">Will save as: <span className="font-bold text-gray-600">{eventForm.date || 'Empty'}</span></p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Time</label>
                      <input type="time" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-700" value={nativeTime} onChange={handleNativeTimeChange} />
                      <p className="text-[10px] text-gray-400 mt-1 pl-1">Will save as: <span className="font-bold text-gray-600">{eventForm.time || 'Empty'}</span></p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Google Maps Link</label>
                    <input type="url" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" value={eventForm.locationLink} onChange={e => setEventForm({...eventForm, locationLink: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Type</label>
                      <select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" value={eventForm.eventType} onChange={e => setEventForm({...eventForm, eventType: e.target.value})}>
                        <option value="pre-wedding">Pre-Wedding</option><option value="main-wedding">Main Wedding</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">App UI Accent Color (Optional)</label>
                      <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                        <input type="checkbox" checked={!!eventForm.themeColor} onChange={e => setEventForm({...eventForm, themeColor: e.target.checked ? '#8c5ab9' : ''})} className="w-5 h-5 text-amber-600 rounded cursor-pointer" title="Enable App UI Accent Color" />
                        
                        {eventForm.themeColor ? (
                          <>
                            <input type="color" className="h-9 w-12 rounded cursor-pointer border-0 p-0 bg-transparent" value={eventForm.themeColor} onChange={e => setEventForm({...eventForm, themeColor: e.target.value})} />
                            <span className="text-sm font-mono uppercase font-bold text-gray-700">{eventForm.themeColor}</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No custom accent</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Dress Code / Suggested Attire</label>
                    <input type="text" placeholder="e.g.,  Festive / Pastels" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" value={eventForm.dressCode || ''} onChange={e => setEventForm({...eventForm, dressCode: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Practical Logistics (Parking, Gifting, etc.)</label>
                    <textarea rows="2" placeholder="e.g., Valet parking available at the main gate." className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium resize-none" value={eventForm.guidelines || ''} onChange={e => setEventForm({...eventForm, guidelines: e.target.value})}></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Family Note / Description</label>
                    <textarea rows="3" placeholder="e.g., Join us for an evening of music and dance!" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium resize-none" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})}></textarea>
                  </div>

                  {/* Color Palette Array (Dress Code Swatches) */}
                  <div className="bg-[#2c1238]/5 p-5 rounded-2xl border border-[#2c1238]/10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-[#2c1238] text-sm uppercase tracking-wider">Guest Dress Code Palette (Swatches)</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Add specific hex codes for guests to match</p>
                      </div>
                      <button type="button" onClick={addEventColor} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[#2c1238] font-bold hover:border-amber-500 transition shadow-sm">+ Add Color</button>
                    </div>
                    {(eventForm.colorPalette || []).map((color, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input type="color" className="h-10 w-12 rounded cursor-pointer border-0 p-0 bg-transparent" value={color} onChange={e => updateEventColor(idx, e.target.value)} />
                        <input type="text" className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500 uppercase font-mono" value={color} onChange={e => updateEventColor(idx, e.target.value)} />
                        <button type="button" onClick={() => removeEventColor(idx)} className="text-gray-400 hover:text-red-500 p-2 transition">&times;</button>
                      </div>
                    ))}
                  </div>

                  {/* Venue Photos Array */}
                  <div className="bg-[#2c1238]/5 p-5 rounded-2xl border border-[#2c1238]/10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-[#2c1238] text-sm uppercase tracking-wider flex items-center gap-1.5"><ImageIcon size={16} className="text-[#2c1238]"/> Venue Mood Board</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Paste direct image URLs</p>
                      </div>
                      <button type="button" onClick={addEventPhoto} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[#2c1238] font-bold hover:border-amber-500 transition shadow-sm">+ Add Photo</button>
                    </div>
                    {(eventForm.venuePhotos || []).map((photo, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input type="url" placeholder="https://example.com/venue.jpg" required className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500" value={photo} onChange={e => updateEventPhoto(idx, e.target.value)} />
                        <button type="button" onClick={() => removeEventPhoto(idx)} className="text-gray-400 hover:text-red-500 p-2 transition">&times;</button>
                      </div>
                    ))}
                  </div>

                  <button type="submit" className="w-full bg-[#2c1238] text-white p-4 rounded-xl font-bold hover:bg-[#1a0922] transition-colors shadow-lg uppercase tracking-widest text-sm mt-4 border border-[#4b1d5e]">
                    {editingEventId ? 'Save Event Updates' : 'Add to Timeline'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col h-[850px]">
                <div className="mb-6">
                  <h2 className="text-2xl font-serif font-bold text-[#2c1238]">Timeline Overview</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Chronological Preview</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 pl-4 border-l-2 border-gray-100 ml-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {eventsList.map((evt) => (
                    <div key={evt._id} className="relative group cursor-pointer" onClick={() => handleEditEventClick(evt)}>
                      <div className="absolute -left-[27px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-125" style={{ backgroundColor: evt.themeColor || '#8c5ab9' }} />
                      <div className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-amber-300 hover:shadow-lg transition-all ml-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 text-lg">{evt.title}</h3>
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition">
                            <Edit2 size={14} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-2 text-xs text-gray-600 font-medium">
                          <span className="flex items-center gap-2"><Clock size={14} className="text-gray-400"/> {evt.date} • {evt.time}</span>
                          <span className="flex items-center gap-2"><MapPin size={14} className="text-gray-400"/> {evt.venue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- SETTINGS TAB --- */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto mt-10">
              <div className="bg-white rounded-3xl shadow-xl p-10 text-center border-t-4 border-amber-500 relative overflow-hidden">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600 shadow-inner border border-amber-300">
                  <Activity size={36} />
                </div>
                <h2 className="text-3xl font-serif font-bold text-[#2c1238] mb-3">Server Anti-Sleep Mechanism</h2>
                <p className="text-gray-600 mb-10 max-w-md mx-auto leading-relaxed font-medium">
                  Free hosting tiers spin down the server after 15 minutes of inactivity. Activate this mode 48 hours before the wedding to ensure lightning-fast load times for arriving guests.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button onClick={() => handleToggleKeepAlive(true)} className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-sm shadow-lg ${keepAliveStatus ? 'bg-green-500 text-white shadow-green-500/40 ring-4 ring-green-500/20 cursor-default' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-500 hover:text-green-600'}`}>
                    <Zap size={20} /> Enable Fast Mode
                  </button>
                  <button onClick={() => handleToggleKeepAlive(false)} className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-sm shadow-lg ${!keepAliveStatus ? 'bg-red-500 text-white shadow-red-500/40 ring-4 ring-red-500/20 cursor-default' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-500 hover:text-red-600'}`}>
                    <ZapOff size={20} /> Let Server Sleep
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}