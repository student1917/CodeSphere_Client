import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h3 className="text-white text-lg font-bold mb-2">CodeSphere</h3>
            <p className="text-sm">
              Nền tảng luyện tập lập trình hàng đầu
            </p>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link to={ROUTES.PROBLEMS} className="hover:text-white transition-colors">
              Problems
            </Link>
            <Link to={ROUTES.CONTEST} className="hover:text-white transition-colors">
              Contest
            </Link>
            <Link to={ROUTES.DISCUSS} className="hover:text-white transition-colors">
              Discuss
            </Link>
            <Link to={ROUTES.LEADERBOARD} className="hover:text-white transition-colors">
              Leaderboard
            </Link>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} CodeSphere. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
