import { Link, useLocation } from 'react-router-dom';
import { FiSearch, FiChevronRight } from 'react-icons/fi';
import AdminUserMenu from './AdminUserMenu';
import NotificationDropdown from './NotificationDropdown';

const AdminHeader = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <header className="h-16 border-b bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-6 shadow-sm">
      <div className="flex items-center justify-between w-full">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/admin" className="text-slate-400 hover:text-blue-600 transition-colors font-medium text-xs uppercase tracking-wider">
            Admin
          </Link>
          {pathnames.length > 1 && (
            <>
              <FiChevronRight className="text-slate-300" />
              <span className="text-slate-900 font-bold capitalize">
                {pathnames[pathnames.length - 1].replace(/-/g, ' ')}
              </span>
            </>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative hidden tablet:block small_desktop:block desktop:block group">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" size={18} />
            <input 
              type="text" 
              placeholder="Search in admin panel..." 
              className="pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white w-72 transition-all duration-200"
            />
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden tablet:block small_desktop:block desktop:block" />

          <NotificationDropdown />
          
          <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
            <AdminUserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
