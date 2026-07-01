import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAward, FiClock, FiDatabase, FiTrendingUp } from 'react-icons/fi';
import { leaderboardApi } from '@/apis/leaderboard.api';
import type { LeaderboardResponse } from '@/types/leaderboard.types';
import Loading from '@/components/Loading';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Avatar from '@/components/Avatar';

interface LeaderboardTableProps {
  problemId: number;
  highlightUserId?: number;
  compact?: boolean;
}

const LeaderboardTable = ({ problemId, highlightUserId, compact = false }: LeaderboardTableProps) => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const data = await leaderboardApi.getLeaderboard(problemId);
        setLeaderboard(data);
      } catch (error: any) {
        console.error('Error fetching leaderboard:', error);
        toast.error('Unable to load leaderboard');
        setLeaderboard([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [problemId]);

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

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1">
          <span className="text-lg">🥇</span>
          <span className="font-bold text-yellow-600">1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1">
          <span className="text-lg">🥈</span>
          <span className="font-bold text-gray-400">2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1">
          <span className="text-lg">🥉</span>
          <span className="font-bold text-orange-600">3</span>
        </div>
      );
    }
    return <span className="font-medium text-gray-700">{rank}</span>;
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: enUS });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loading size="md" />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <FiAward className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No one has submitted this problem yet</p>
        <p className="text-sm text-gray-400 mt-1">Be the first one!</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Rank</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">User</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Score</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((entry) => {
                const isHighlighted = highlightUserId && entry.userId === highlightUserId;
                return (
                  <tr
                    key={entry.userId}
                    className={`hover:bg-gray-50 transition-colors ${
                      isHighlighted ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      {getRankBadge(entry.rank)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => navigate(`/users/${entry.userId}`)}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        <Avatar src={entry.avatar} size="sm" alt={entry.username} />
                        <span className="text-sm font-medium text-gray-900">{entry.username}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`text-sm font-semibold ${entry.isAccepted ? 'text-green-600' : 'text-gray-600'}`}>
                        {entry.bestScore}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-xs text-gray-500">{formatTime(entry.bestSubmissionTime)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Best Score
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Runtime
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Memory
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Submissions
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboard.map((entry) => {
              const isHighlighted = highlightUserId && entry.userId === highlightUserId;
              return (
                <tr
                  key={entry.userId}
                  className={`hover:bg-gray-50 transition-colors ${
                    isHighlighted ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getRankBadge(entry.rank)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/users/${entry.userId}`)}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors group"
                    >
                      <Avatar src={entry.avatar} size="sm" alt={entry.username} />
                      <span className="text-sm font-medium text-gray-900 group-hover:underline">
                        {entry.username}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className={`text-sm font-semibold ${entry.isAccepted ? 'text-green-600' : 'text-gray-600'}`}>
                      {entry.bestScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 text-sm text-gray-600">
                      <FiClock className="w-4 h-4" />
                      <span>{formatRuntime(entry.statusRuntime)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 text-sm text-gray-600">
                      <FiDatabase className="w-4 h-4" />
                      <span>{formatMemory(entry.statusMemory)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 text-sm text-gray-600">
                      <FiTrendingUp className="w-4 h-4" />
                      <span>{entry.totalSubmissions}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-500">{formatTime(entry.bestSubmissionTime)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;

