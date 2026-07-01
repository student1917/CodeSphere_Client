import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAward, FiTrendingUp, FiClock, FiDatabase } from 'react-icons/fi';
import { leaderboardApi } from '@/apis/leaderboard.api';
import type { LeaderboardResponse } from '@/types/leaderboard.types';
import Loading from '@/components/Loading';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface MyRankCardProps {
  problemId: number;
  userId?: number;
  compact?: boolean;
}

const MyRankCard = ({ problemId, userId, compact = false }: MyRankCardProps) => {
  const navigate = useNavigate();
  const [myRank, setMyRank] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchMyRank = async () => {
      try {
        setIsLoading(true);
        const rank = await leaderboardApi.getMyRank(problemId);
        setMyRank(rank);
      } catch (error: any) {
        console.error('Error fetching my rank:', error);
        toast.error('Không thể tải xếp hạng của bạn');
        setMyRank(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyRank();
  }, [problemId, userId]);

  if (!userId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-white rounded-lg border border-gray-200`}>
        <Loading size="sm" />
      </div>
    );
  }

  if (!myRank) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-gray-50 rounded-lg border border-gray-200`}>
        <div className="flex items-center gap-2 text-gray-600">
          <FiTrendingUp className="w-4 h-4" />
          <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
            Bạn chưa submit bài này
          </p>
        </div>
      </div>
    );
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥇</span>
          <span className="font-bold text-yellow-600">#1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥈</span>
          <span className="font-bold text-gray-400">#2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥉</span>
          <span className="font-bold text-orange-600">#3</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <FiAward className="w-5 h-5 text-gray-400" />
        <span className="font-bold text-gray-700">#{rank}</span>
      </div>
    );
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch {
      return dateString;
    }
  };

  const formatRuntime = (runtime: string | null | undefined) => {
    if (!runtime || !runtime.trim() || runtime === '0 ms' || runtime === '0ms') {
      return 'N/A';
    }
    return runtime;
  };

  const formatMemory = (memory: string | null | undefined) => {
    if (!memory || !memory.trim() || memory === '0 KB' || memory === '0KB' || memory === '0 MB' || memory === '0MB') {
      return 'N/A';
    }
    return memory;
  };

  if (compact) {
    return (
      <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
        {/* Rank section - nổi bật ở trên */}
        <div className="flex flex-col items-center justify-center mb-3 pb-3 border-b border-blue-200/60">
          {getRankBadge(myRank.rank)}
          <span className="text-xs font-semibold text-blue-700 mt-1">Xếp hạng của bạn</span>
        </div>

        {/* Score and details */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <FiAward className="w-3 h-3" />
            <span>Score:</span>
          </div>
          <span className={`text-base font-bold ${myRank.isAccepted ? 'text-green-600' : 'text-gray-600'}`}>
            {myRank.bestScore}
          </span>
        </div>

        {/* Runtime */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <FiClock className="w-3 h-3" />
            Runtime
          </span>
          <span className="font-semibold text-gray-700">{formatRuntime(myRank.statusRuntime)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getRankBadge(myRank.rank)}
          <div>
            <h3 className="font-semibold text-gray-900">Xếp hạng của bạn</h3>
            <p className="text-sm text-gray-600">Best Score: {myRank.bestScore}</p>
          </div>
        </div>
        <div className={`text-2xl font-bold ${myRank.isAccepted ? 'text-green-600' : 'text-gray-600'}`}>
          {myRank.bestScore}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        <div className="bg-white/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
            <FiClock className="w-3 h-3" />
            Runtime
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {formatRuntime(myRank.statusRuntime)}
          </div>
        </div>
        <div className="bg-white/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
            <FiDatabase className="w-3 h-3" />
            Memory
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {formatMemory(myRank.statusMemory)}
          </div>
        </div>
        <div className="bg-white/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
            <FiTrendingUp className="w-3 h-3" />
            Submissions
          </div>
          <div className="text-sm font-semibold text-gray-900">{myRank.totalSubmissions}</div>
        </div>
        <div className="bg-white/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
            <FiClock className="w-3 h-3" />
            Thời gian
          </div>
          <div className="text-sm font-semibold text-gray-900">{formatTime(myRank.bestSubmissionTime)}</div>
        </div>
      </div>

      {myRank.bestSubmissionId && (
        <button
          onClick={() => navigate(`/problems/${problemId}?submission=${myRank.bestSubmissionId}`)}
          className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Xem submission chi tiết →
        </button>
      )}
    </div>
  );
};

export default MyRankCard;

