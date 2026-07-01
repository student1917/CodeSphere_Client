import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiPlay, FiLoader, FiStar, FiAward } from 'react-icons/fi';
import { ROUTES } from '@/utils/constants';
import { formatTimer } from '../utils';
import type { ContestDetailResponse } from '@/types/contest.types';

interface TopBarProps {
  onToggleProblemList: () => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  timer: number;
  isTimerRunning: boolean;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onResetTimer: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  contest?: ContestDetailResponse | null; // Contest data khi đang trong contest
  currentProblemId?: number; // Problem ID hiện tại
}

const TopBar = ({
  onToggleProblemList,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  timer,
  isTimerRunning,
  onStartTimer,
  onStopTimer,
  onResetTimer,
  isBookmarked,
  onToggleBookmark,
  contest,
  currentProblemId,
}: TopBarProps) => {
  const navigate = useNavigate();

  // Tính tổng điểm nếu có contest
  const calculateTotalScore = () => {
    if (!contest || !contest.problems) return 0;
    return contest.problems.reduce((total, problem) => {
      return total + (problem.bestScore || 0);
    }, 0);
  };

  const totalScore = contest ? calculateTotalScore() : 0;

  const handleProblemTabClick = (problemId: number) => {
    if (contest) {
      navigate(`/problems/${problemId}?contestId=${contest.id}`);
    }
  };

  const handleTotalClick = () => {
    if (contest) {
      navigate(`/contest/${contest.id}`);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center px-6 py-2 relative">
        {/* Left: Navigation hoặc Contest Tabs */}
        {contest ? (
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {/* Tab Total */}
            {contest.isRegistered && (
              <button
                onClick={handleTotalClick}
                className="py-2 px-3 border-b-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                <FiAward className="w-4 h-4" />
                <span>Total</span>
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                  {totalScore} pts
                </span>
              </button>
            )}

            {/* Tabs bài tập */}
            {contest.problems.map((problem) => {
              const isActive = currentProblemId === problem.problemId;
              return (
                <button
                  key={problem.problemId}
                  onClick={() => handleProblemTabClick(problem.problemId)}
                  className={`py-2 px-3 border-b-2 font-medium transition-colors relative whitespace-nowrap ${
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
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleProblemList}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Toggle Problem List"
            >
              <FiMenu className="w-4 h-4" />
            </button>
            <Link
              to={ROUTES.PROBLEMS}
              className="text-base font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              Problem List
            </Link>
          </div>
        )}

        {/* Center: Run/Submit + Timer (ẩn timer khi trong contest) - Absolute center */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={onRun}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <FiPlay className="w-4 h-4" />
            )}
            Run
          </button>
          <button
            onClick={onSubmit}
            disabled={isRunning || isSubmitting}
            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <FiLoader className="w-4 h-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit'
            )}
          </button>
          {/* Ẩn timer khi trong contest */}
          {!contest && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={isTimerRunning ? onStopTimer : onStartTimer}
                className="px-2.5 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                {isTimerRunning ? 'Pause' : 'Start'}
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-mono text-gray-700">{formatTimer(timer)}</span>
              </div>
              {timer > 0 && (
                <button
                  onClick={onResetTimer}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                  title="Reset timer"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Bookmark - Ẩn khi trong contest */}
        {!contest && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onToggleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiStar className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;

