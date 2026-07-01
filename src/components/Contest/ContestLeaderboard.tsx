import type { ContestLeaderboardResponse } from '@/types/contest.types';
import { FiUser } from 'react-icons/fi';

interface ContestLeaderboardProps {
  leaderboard: ContestLeaderboardResponse[];
  problemOrders: string[]; // ['A', 'B', 'C', ...]
}

const ContestLeaderboard = ({ leaderboard, problemOrders }: ContestLeaderboardProps) => {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const formatCompletionTime = (seconds: number | null | undefined): string => {
    if (seconds === null || seconds === undefined) return '-';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Format: "00:04:53" (giờ:phút:giây với 2 chữ số mỗi phần)
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-sm font-semibold text-gray-700">Rank</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-700">User</th>
            <th className="p-3 text-center text-sm font-semibold text-gray-700">Total</th>
            {problemOrders.map((order) => (
              <th key={order} className="p-3 text-center text-sm font-semibold text-gray-700">
                {order}
              </th>
            ))}
            <th className="p-3 text-left text-sm font-semibold text-gray-700">Completion Time</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.length === 0 ? (
            <tr>
              <td colSpan={4 + problemOrders.length} className="p-8 text-center text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            leaderboard.map((entry) => (
              <tr key={entry.userId} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{getRankBadge(entry.rank)}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <FiUser className="text-gray-400" />
                    <span className="font-medium">{entry.username}</span>
                  </div>
                </td>
                <td className="p-3 text-center font-bold text-blue-600">{entry.totalScore}</td>
                {problemOrders.map((order) => (
                  <td key={order} className="p-3 text-center text-sm">
                    {entry.problemScores[order] !== undefined ? (
                      <span className="font-medium">{entry.problemScores[order]}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                ))}
                <td className="p-3 text-sm text-gray-600">
                  {entry.completionTimeSeconds !== null && entry.completionTimeSeconds !== undefined ? (
                    // PRACTICE: hiển thị thời gian đã dùng (ví dụ: 02:00:00 = 120 phút)
                    <span>{formatCompletionTime(entry.completionTimeSeconds)}</span>
                  ) : entry.completedAt ? (
                    // OFFICIAL: hiển thị thời gian nộp (ví dụ: 11:35:30)
                    <span>{new Date(entry.completedAt).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    })}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ContestLeaderboard;

