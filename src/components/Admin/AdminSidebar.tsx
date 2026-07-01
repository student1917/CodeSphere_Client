// ...existing code...
import { NavLink } from 'react-router-dom';
import { FiGrid, FiFileText, FiTag, FiHash, FiClipboard, FiUsers, FiGlobe, FiChevronLeft, FiChevronRight, FiAward, FiSettings, FiExternalLink, FiMessageSquare, FiActivity } from 'react-icons/fi';
import { useState } from 'react';
import logoImage from '@/assets/logo/logo.png';

const items = [
  { group: 'MAIN', children: [
    { to: '/admin', label: 'Dashboard', icon: <FiGrid /> },
    { to: '/admin/users', label: 'Users', icon: <FiUsers /> },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: <FiActivity /> },
  ]},
  { group: 'CONTENT', children: [
    { to: '/admin/contests', label: 'Contests', icon: <FiAward /> },
    { to: '/admin/problems', label: 'Problems', icon: <FiFileText /> },
    { to: '/admin/posts', label: 'Posts', icon: <FiMessageSquare /> },
    { to: '/admin/testcases', label: 'Testcases', icon: <FiClipboard /> },
  ]},
  { group: 'ORGANIZATION', children: [
    { to: '/admin/languages', label: 'Languages', icon: <FiGlobe /> },
    { to: '/admin/categories', label: 'Categories', icon: <FiHash /> },
    { to: '/admin/tags', label: 'Tags', icon: <FiTag /> },
  ]},
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`flex flex-col bg-[#1e293b] text-slate-300 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'} h-screen flex-shrink-0 sticky top-0 border-r border-slate-800 shadow-xl z-50`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative w-9 h-9 flex-shrink-0 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-white/5 border border-slate-700/50">
            <img src={logoImage} alt="Logo" className="w-7 h-7 object-contain" />
          </div>

          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-[15px] font-bold text-white tracking-tight">
                CodeSphere
              </span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">
                Admin Panel
              </span>
            </div>
          )}
        </div>

        <button
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((s) => !s)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-6 custom-scrollbar">
        {items.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                {group.group}
              </h3>
            )}
            <div className="space-y-1">
              {group.children.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.to === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all duration-200 group ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`
                  }
                >
                  <div className={`text-lg transition-transform group-hover:scale-110`}>{it.icon}</div>
                  {!collapsed && <span className="font-medium whitespace-nowrap">{it.label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      {it.label}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all group"
        >
          <FiExternalLink className="text-lg" />
          {!collapsed && <span className="text-[14px] font-medium">View Website</span>}
        </NavLink>
        {!collapsed && (
          <div className="mt-4 px-3">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              System v1.0.4
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
