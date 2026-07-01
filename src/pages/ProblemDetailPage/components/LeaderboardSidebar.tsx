import { FiX, FiAward } from 'react-icons/fi';
import MyRankCard from '@/components/Leaderboard/MyRankCard';
import LeaderboardTable from '@/components/Leaderboard/LeaderboardTable';

interface LeaderboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: number;
  userId?: number;
}

const LeaderboardSidebar = ({ isOpen, onClose, problemId, userId }: LeaderboardSidebarProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Sidebar - Bên trái */}
      <div className="w-96 bg-white shadow-xl flex flex-col">
        {/* My Rank Card - Ở trên cùng */}
        <div className="p-4 border-b border-gray-200">
          {userId && (
            <MyRankCard problemId={problemId} userId={userId} compact={false} />
          )}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiAward className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900">Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Leaderboard Table */}
          <LeaderboardTable 
            problemId={problemId} 
            highlightUserId={userId}
            compact={true}
          />
        </div>
      </div>
      {/* Overlay - Bên phải sidebar */}
      <div
        className="flex-1 bg-black bg-opacity-50"
        onClick={onClose}
      />
    </div>
  );
};

export default LeaderboardSidebar;

