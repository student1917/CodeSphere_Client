import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiAward, FiSearch, FiChevronDown, FiX, FiGlobe } from 'react-icons/fi';
import Container from '@/components/Layout/Container';
import Loading from '@/components/Loading';
import MyRankCard from '@/components/Leaderboard/MyRankCard';
import LeaderboardTable from '@/components/Leaderboard/LeaderboardTable';
import GlobalLeaderboardTable from '@/components/Leaderboard/GlobalLeaderboardTable';
import ProblemStatistics from '@/components/Leaderboard/ProblemStatistics';
import { problemApi } from '@/apis/problem.api';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import type { ProblemResponse } from '@/types/problem.types';
import toast from 'react-hot-toast';

type TabType = 'problem' | 'global';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [selectedProblem, setSelectedProblem] = useState<ProblemResponse | null>(null);
  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setIsLoadingProblems(true);
        const response = await problemApi.getProblems({
          page: 0,
          size: 100,
          sortBy: 'createdAt',
          sortDir: 'DESC',
        });
        setProblems(response.content);
      } catch (error) {
        console.error('Error fetching problems:', error);
        toast.error('Failed to load problems');
      } finally {
        setIsLoadingProblems(false);
      }
    };

    fetchProblems();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return problems;
    const query = searchQuery.toLowerCase().trim();
    return problems.filter((problem) => {
      return (
        problem.title.toLowerCase().includes(query) ||
        problem.code?.toLowerCase().includes(query) ||
        problem.id.toString().includes(query)
      );
    });
  }, [problems, searchQuery]);

  const getLevelBadge = (level: string) => {
    const colors = {
      EASY: 'text-green-600 bg-green-50',
      MEDIUM: 'text-yellow-600 bg-yellow-50',
      HARD: 'text-red-600 bg-red-50',
    };
    const labels = {
      EASY: 'Easy',
      MEDIUM: 'Medium',
      HARD: 'Hard',
    };
    return (
      <span className={`px-2.5 py-1 rounded text-xs font-medium ${colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-50'}`}>
        {labels[level as keyof typeof labels] || level}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FiAward className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          </div>
          <p className="text-gray-600">View leaderboards for programming problems</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('global')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'global'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FiGlobe className="w-4 h-4" />
                <span>Global Leaderboard</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('problem')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'problem'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FiAward className="w-4 h-4" />
                <span>Problem Leaderboard</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Problem Selector - Only show for problem tab */}
        {activeTab === 'problem' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Problem
            </label>
            <div className="relative max-w-2xl" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-lg transition-all ${
                  isDropdownOpen
                    ? 'border-blue-500 shadow-sm'
                    : 'border-gray-300 hover:border-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {selectedProblem ? (
                    <>
                      {getLevelBadge(selectedProblem.level)}
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {selectedProblem.title}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm">Select a problem...</span>
                  )}
                </div>
                <FiChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                  {/* Search Bar */}
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search problems..."
                        value={searchQuery}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSearchQuery(e.target.value);
                        }}
                        onFocus={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Escape') {
                            setIsDropdownOpen(false);
                          }
                        }}
                        autoFocus
                        className="w-full pl-8 pr-8 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      {searchQuery && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchQuery('');
                          }}
                          className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Problem List */}
                  <div className="overflow-y-auto max-h-80">
                    {isLoadingProblems ? (
                      <div className="flex justify-center py-8">
                        <Loading size="sm" />
                      </div>
                    ) : filteredProblems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        {searchQuery ? 'No problems found' : 'No problems available'}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredProblems.map((problem) => (
                          <button
                            key={problem.id}
                            onClick={() => {
                              setSelectedProblem(problem);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors ${
                              selectedProblem?.id === problem.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {getLevelBadge(problem.level)}
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {problem.title}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedProblem && (
              <div className="mt-2">
                <Link
                  to={`${ROUTES.PROBLEMS}/${selectedProblem.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View problem details →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {activeTab === 'problem' ? (
          selectedProblem ? (
            <div className="space-y-6">
              {/* My Rank Card */}
              {user?.id && (
                <MyRankCard problemId={selectedProblem.id} userId={user.id} compact={false} />
              )}

              {/* Leaderboard Table */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Leaderboard</h2>
                <LeaderboardTable
                  problemId={selectedProblem.id}
                  highlightUserId={user?.id}
                  compact={false}
                />
              </div>

              {/* Statistics */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
                <ProblemStatistics problemId={selectedProblem.id} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FiAward className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No problem selected</h3>
              <p className="text-gray-500">Please select a problem above to view the leaderboard</p>
            </div>
          )
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiGlobe className="w-6 h-6" />
                Global Leaderboard
              </h2>
              <p className="text-gray-600 mb-4">
                Ranking all users by solved problems with season filters, momentum tracking, and rank cards.
              </p>
              <GlobalLeaderboardTable highlightUserId={user?.id} />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default LeaderboardPage;

