import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import Button from '@/components/Button';
import UserMenu from './UserMenu';
import NotificationDropdown from './NotificationDropdown';
import MessengerDropdown from './MessengerDropdown';
import logoImage from '@/assets/logo/logo.png';

const Header = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const navigationItems = [
    { path: ROUTES.PROBLEMS, label: 'Problems' },
    { path: ROUTES.DISCUSS, label: 'Discuss' },
    { path: ROUTES.CONTEST, label: 'Contest' },
    { path: ROUTES.LEADERBOARD, label: 'Leaderboard' },
  ];

  const isActive = (path: string) => {
    // Chỉ active khi pathname chính xác bằng path hoặc bắt đầu bằng path + '/'
    // Nhưng không active nếu pathname là '/' (home page)
    if (location.pathname === '/') return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to problems page with search query
      navigate(`${ROUTES.PROBLEMS}?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 relative">
          {/* Logo and App Name - Left */}
          <Link to={ROUTES.HOME} className="flex items-center space-x-3 flex-shrink-0 z-10 relative group">
            <div className="relative w-11 h-11 flex items-center justify-center">
              {/* Logo image */}
              <img
                src={logoImage}
                alt="CodeSphere Logo"
                className="w-11 h-11 object-contain transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
              />
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-purple-500/30 rounded-full blur-lg -z-10 group-hover:blur-xl group-hover:opacity-70 transition-all duration-300" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:via-cyan-500 group-hover:to-purple-500 transition-all duration-300">
              CodeSphere
            </span>
          </Link>

          {/* Navigation Links - Center (LeetCode style) */}
          {isAuthenticated && (
            <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2 z-0">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 whitespace-nowrap ${
                    isActive(item.path)
                      ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-md shadow-blue-500/30 scale-105'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm'
                  }`}
                >
                  {item.label}
                  {isActive(item.path) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-cyan-600/0 rounded-lg" />
                  )}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side - Search Bar and User menu */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {isAuthenticated ? (
              <>
                {/* Search Bar - LeetCode style */}
                <form onSubmit={handleSearch} className="hidden lg:block">
                  <div className="relative group">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search problems..."
                      className="w-72 px-4 py-2.5 pl-11 pr-4 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white focus:shadow-lg transition-all duration-200"
                    />
                    <svg
                      className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </form>

                <MessengerDropdown />
                <NotificationDropdown />
                <UserMenu />
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-105"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
