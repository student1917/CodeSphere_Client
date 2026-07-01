// ...existing code...
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/Avatar';
import { ROUTES } from '@/utils/constants';
import { FiSettings, FiUsers, FiLogOut, FiHome } from 'react-icons/fi';

const AdminUserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((s) => !s)}
        className="flex items-center space-x-2 focus:outline-none rounded-xl p-1 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
        aria-label="Admin menu"
      >
        <Avatar user={user} size="sm" />
        <span className="hidden md:block text-[13px] font-bold text-slate-700">{user.username}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none">
          <path stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl py-2 z-50 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-50 mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
            <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
          </div>

          <Link 
            to="/" 
            className="flex items-center gap-3 px-4 py-3 text-sm text-blue-600 font-bold hover:bg-blue-50 transition-colors group/item" 
            onClick={() => setIsOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center transition-transform group-hover/item:scale-110">
              <FiHome size={18} />
            </div>
            <div className="flex flex-col">
              <span className="leading-none">User View</span>
              <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider mt-1">Back to site</span>
            </div>
          </Link>

          <div className="h-px bg-slate-50 my-1" />

          <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors" onClick={() => setIsOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <FiUsers size={16} />
            </div>
            Admin Dashboard
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors" onClick={() => setIsOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <FiSettings size={16} />
            </div>
            System Settings
          </Link>
          
          <div className="h-px bg-slate-50 my-1" />
          
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-rose-600 font-bold hover:bg-rose-50 flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <FiLogOut size={16} />
            </div>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUserMenu;
// ...existing code...