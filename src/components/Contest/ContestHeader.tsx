import { useNavigate } from 'react-router-dom';
import { FiAward } from 'react-icons/fi';
import type { ContestDetailResponse, ContestProblemResponse } from '@/types/contest.types';

interface ContestHeaderProps {
  contest: ContestDetailResponse;
  currentProblemId?: number;
  onTabChange?: (tab: 'total' | 'leaderboard' | 'overview' | number) => void;
  activeTab?: 'total' | 'leaderboard' | 'overview' | number;
  showTotal?: boolean;
  showLeaderboard?: boolean;
  compact?: boolean; // Nếu true, không có border và shadow (dùng trong ProblemDetailPage)
  hideProblemTabs?: boolean; // Nếu true, ẩn các tabs bài tập (A, B, C...)
}

const ContestHeader = ({
  contest,
  currentProblemId,
  onTabChange,
  activeTab,
  showTotal = true,
  showLeaderboard = true,
  compact = false,
  hideProblemTabs = false,
}: ContestHeaderProps) => {
  const navigate = useNavigate();

  // Tính tổng điểm của user (lấy từ bestScore)
  const calculateTotalScore = () => {
    if (!contest || !contest.problems) return 0;
    return contest.problems.reduce((total, problem) => {
      // Lấy điểm cao nhất cho mỗi problem
      return total + (problem.bestScore || 0);
    }, 0);
  };

  const totalScore = calculateTotalScore();

  const handleProblemTabClick = (problemId: number) => {
    if (onTabChange) {
      onTabChange(problemId);
    } else {
      navigate(`/problems/${problemId}?contestId=${contest.id}`);
    }
  };

  const handleTotalClick = () => {
    if (onTabChange) {
      onTabChange('total' as any);
    } else {
      navigate(`/contest/${contest.id}`);
    }
  };

  const handleLeaderboardClick = () => {
    if (onTabChange) {
      onTabChange('leaderboard' as any);
    } else {
      navigate(`/contest/${contest.id}`);
    }
  };

  if (!contest.problems || contest.problems.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white ${compact ? '' : 'rounded-lg shadow mb-6'} sticky top-0 z-10`}>
      <div className="border-b border-gray-200">
        <div className="flex gap-2 px-4 overflow-x-auto">
          {/* Tab Total */}
          {showTotal && contest.isRegistered && (
            <button
              onClick={handleTotalClick}
              className={`py-3 px-4 border-b-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'total'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiAward className="w-4 h-4" />
              <span>Total</span>
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                {totalScore} pts
              </span>
            </button>
          )}

          {/* Tabs bài tập - chỉ hiển thị nếu không ẩn */}
          {!hideProblemTabs && contest.problems.map((problem) => {
            const isActive = currentProblemId === problem.problemId || activeTab === problem.problemId;
            return (
              <button
                key={problem.problemId}
                onClick={() => handleProblemTabClick(problem.problemId)}
                className={`py-3 px-4 border-b-2 font-medium transition-colors relative whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">{problem.order}</span>
                  <span className="text-xs text-gray-500">({problem.points} điểm)</span>
                  {problem.isSolved && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold">
                      ✓
                    </span>
                  )}
                  {!problem.isSolved && problem.bestScore > 0 && (
                    <span className="text-xs text-yellow-600 font-medium">
                      {problem.bestScore}pts
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Tab Leaderboard */}
          {showLeaderboard && (
            <button
              onClick={handleLeaderboardClick}
              className={`py-3 px-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Leaderboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestHeader;

