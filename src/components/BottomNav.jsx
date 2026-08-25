import { Link, useLocation, useParams } from 'react-router-dom';
import { Home, CalendarHeart, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const location = useLocation();
  // Extract the invite code from the current URL so our links work dynamically
  const pathParts = location.pathname.split('/');
  const inviteCode = pathParts.includes('invite') ? pathParts[pathParts.indexOf('invite') + 1] : null;

  if (!inviteCode) return null; // Don't show nav if we aren't in a guest's invite

  const navItems = [
    { 
      name: 'Home', 
      path: `/invite/${inviteCode}`, 
      icon: <Home size={22} />,
      // Matches exactly /invite/CODE
      isActive: location.pathname === `/invite/${inviteCode}` 
    },
    { 
      name: 'Timeline', 
      path: `/invite/${inviteCode}/timeline`, 
      icon: <CalendarHeart size={22} />,
      isActive: location.pathname.includes('/timeline')
    },
    { 
      name: 'RSVP', 
      path: `/invite/${inviteCode}/rsvp`, 
      icon: <Mail size={22} />,
      isActive: location.pathname.includes('/rsvp')
    }
  ];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.8 }}
      className="fixed bottom-0 left-0 w-full z-[9900] pb-safe"
    >
      <div className="mx-auto max-w-md px-4 pb-4 pt-2">
        <div className="bg-[#2c1238]/90 backdrop-blur-md border border-gold/30 rounded-2xl flex justify-around items-center p-2 shadow-[0_-5px_25px_rgba(0,0,0,0.3)]">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path}
              className="relative flex flex-col items-center justify-center w-20 h-14"
            >
              <div className={`transition-all duration-300 z-10 flex flex-col items-center gap-1 ${item.isActive ? 'text-gold-light scale-110' : 'text-lavender-300/60 hover:text-lavender-200'}`}>
                {item.icon}
                <span className="text-[10px] font-semibold uppercase tracking-widest">{item.name}</span>
              </div>
              
              {/* Active Indicator Dot */}
              {item.isActive && (
                <motion.div 
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-white/5 rounded-xl border border-gold/20"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}