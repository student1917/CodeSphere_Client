import { useEffect, useState, useMemo } from 'react';
import { FiUsers, FiCheckCircle, FiTrendingUp, FiClock, FiDatabase, FiBarChart2 } from 'react-icons/fi';
import { statisticsApi, type ProblemStatsResponse } from '@/apis/statistics.api';
import { leaderboardApi } from '@/apis/leaderboard.api';
import type { LeaderboardResponse } from '@/types/leaderboard.types';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';

interface ProblemStatisticsProps {
  problemId: number;
}

const ProblemStatistics = ({ problemId }: ProblemStatisticsProps) => {
  const [stats, setStats] = useState<ProblemStatsResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [statsData, leaderboardData] = await Promise.all([
          statisticsApi.getProblemStats(problemId),
          leaderboardApi.getLeaderboard(problemId),
        ]);
        setStats(statsData);
        setLeaderboard(leaderboardData);
      } catch (error: any) {
        console.error('Error fetching statistics:', error);
        toast.error('Unable to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [problemId]);

  // Tính phân bố điểm
  const scoreDistribution = useMemo(() => {
    const distribution: { [key: string]: number } = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    leaderboard.forEach((entry) => {
      const score = entry.bestScore;
      if (score <= 20) distribution['0-20']++;
      else if (score <= 40) distribution['21-40']++;
      else if (score <= 60) distribution['41-60']++;
      else if (score <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    return distribution;
  }, [leaderboard]);

  // Tính runtime và memory trung bình (chỉ tính những entry có data hợp lệ)
  const { avgRuntime, avgMemory } = useMemo(() => {
    let totalRuntime = 0;
    let countRuntime = 0;
    let totalMemoryKb = 0;
    let countMemory = 0;

    leaderboard.forEach((entry) => {
      // Parse runtime (format: "X ms")
      if (entry.statusRuntime && entry.statusRuntime !== '0 ms' && entry.statusRuntime !== 'N/A') {
        const runtimeMatch = entry.statusRuntime.match(/(\d+(?:\.\d+)?)\s*ms/i);
        if (runtimeMatch) {
          totalRuntime += parseFloat(runtimeMatch[1]);
          countRuntime++;
        }
      }

      // Parse memory (format: "X KB" or "X MB")
      if (entry.statusMemory && entry.statusMemory !== '0 KB' && entry.statusMemory !== '0 MB' && entry.statusMemory !== 'N/A') {
        const memoryMatch = entry.statusMemory.match(/(\d+(?:\.\d+)?)\s*(KB|MB)/i);
        if (memoryMatch) {
          let memoryKb = parseFloat(memoryMatch[1]);
          if (memoryMatch[2].toUpperCase() === 'MB') {
            memoryKb *= 1024;
          }
          totalMemoryKb += memoryKb;
          countMemory++;
        }
      }
    });

    return {
      avgRuntime: countRuntime > 0 ? totalRuntime / countRuntime : 0,
      avgMemory: countMemory > 0 ? totalMemoryKb / countMemory : 0,
    };
  }, [leaderboard]);

  const maxDistributionValue = Math.max(...Object.values(scoreDistribution), 1);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loading size="md" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        No statistics data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng số người đã nộp bài */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Attempts</h3>
            <FiUsers className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsersAttempted}</p>
        </div>

        {/* Tổng số người đã giải đúng */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Solved</h3>
            <FiCheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsersSolved}</p>
        </div>

        {/* Tỷ lệ giải đúng */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Solve Rate</h3>
            <FiTrendingUp className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.solveRate.toFixed(1)}%</p>
        </div>

        {/* Tổng số submissions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Submissions</h3>
            <FiBarChart2 className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiBarChart2 className="w-5 h-5" />
          Score Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(scoreDistribution).map(([range, count]) => {
            const percentage = (count / maxDistributionValue) * 100;
            return (
              <div key={range}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{range} points</span>
                  <span className="text-sm text-gray-600">{count} users</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Average Runtime & Memory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Average Runtime */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <FiClock className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Average Runtime</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {avgRuntime > 0 ? `${Math.round(avgRuntime)} ms` : 'N/A'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Calculated from {leaderboard.length} users in leaderboard
          </p>
        </div>

        {/* Average Memory */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <FiDatabase className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Average Memory</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {avgMemory > 0
              ? avgMemory >= 1024
                ? `${(avgMemory / 1024).toFixed(2)} MB`
                : `${Math.round(avgMemory)} KB`
              : 'N/A'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Calculated from {leaderboard.length} users in leaderboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProblemStatistics;

