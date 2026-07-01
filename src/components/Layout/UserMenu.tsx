import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/Avatar';
import { ROUTES } from '@/utils/constants';
import Tooltip from './Tooltip';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
    setIsOpen(false);
  };

  if (!user) return null;

  // Kiểm tra nếu user là admin
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : undefined);
  const isAdmin =
    role === 'ROLE_ADMIN' ||
    role === 'ADMIN' ||
    (Array.isArray(user?.roles) && user.roles.includes('ROLE_ADMIN'));

  return (
    <div className="relative" ref={menuRef}>
      <Tooltip text="Tài khoản">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 hover:bg-gray-100 transition-colors duration-200"
        >
          <Avatar user={user} size="sm" />
          <span className="hidden md:block text-sm font-medium text-gray-700">
            {user.username}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
          <Link
            to={ROUTES.PROFILE}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
          <Link
            to={ROUTES.CHANGE_PASSWORD}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Đổi mật khẩu
          </Link>
          <Link
            to={ROUTES.SUBMISSIONS}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            My Submissions
          </Link>
          {isAdmin && (
            <>
              <hr className="my-1" />
              <Link
                to="/admin"
                className="block px-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50"
                onClick={() => setIsOpen(false)}
              >
                Admin Dashboard
              </Link>
            </>
          )}
          <hr className="my-1" />
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

