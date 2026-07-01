import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowDown,
  FiArrowUp,
  FiAward,
  FiCalendar,
  FiClock,
  FiGlobe,
  FiLock,
  FiMinus,
  FiSearch,
  FiShare2,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { leaderboardApi } from '@/apis/leaderboard.api';
import { conversationApi } from '@/apis/conversation.api';
import { messageApi } from '@/apis/message.api';
import type { GlobalLeaderboardResponse, GlobalLeaderboardSeason } from '@/types/leaderboard.types';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';
import Avatar from '@/components/Avatar';

interface GlobalLeaderboardTableProps {
  highlightUserId?: number;
}

const GlobalLeaderboardTable = ({ highlightUserId }: GlobalLeaderboardTableProps) => {
  const navigate = useNavigate();
  const [season, setSeason] = useState<GlobalLeaderboardSeason>('all');
  const [scope, setScope] = useState<'global' | 'country' | 'school'>('global');
  const [searchName, setSearchName] = useState('');
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardResponse[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<GlobalLeaderboardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAllTime, setIsLoadingAllTime] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>([]);
  const [sendingShare, setSendingShare] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const data = await leaderboardApi.getGlobalLeaderboard(season);
        setLeaderboard(data);
      } catch (error: any) {
        console.error('Error fetching global leaderboard:', error);
        toast.error('Unable to load global leaderboard');
        setLeaderboard([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [season]);

  useEffect(() => {
    const fetchAllTimeLeaderboard = async () => {
      try {
        setIsLoadingAllTime(true);
        const data = await leaderboardApi.getGlobalLeaderboard('all');
        setAllTimeLeaderboard(data);
      } catch (error) {
        console.error('Error fetching all-time leaderboard:', error);
        setAllTimeLeaderboard([]);
      } finally {
        setIsLoadingAllTime(false);
      }
    };

    fetchAllTimeLeaderboard();
  }, []);

  const allTimeRankMap = useMemo(() => {
    const map = new Map<number, number>();
    allTimeLeaderboard.forEach((entry) => {
      map.set(entry.userId, entry.rank);
    });
    return map;
  }, [allTimeLeaderboard]);

  const decoratedLeaderboard = useMemo(() => {
    return leaderboard.map((entry) => {
      const allTimeRank = allTimeRankMap.get(entry.userId);
      const movement =
        season === 'all' || allTimeRank == null ? null : allTimeRank - entry.rank;

      let badge = 'Rising';
      if (entry.totalSolved >= 300 || entry.solvedHard >= 90) badge = 'Legend';
      else if (entry.totalSolved >= 180 || entry.solvedHard >= 40) badge = 'Master';
      else if (entry.totalSolved >= 90 || entry.solvedHard >= 15) badge = 'Pro';

      return {
        ...entry,
        movement,
        badge,
      };
    });
  }, [leaderboard, allTimeRankMap, season]);

  const filteredLeaderboard = useMemo(() => {
    const keyword = searchName.trim().toLowerCase();
    if (!keyword) return decoratedLeaderboard;
    return decoratedLeaderboard.filter((entry) => entry.username.toLowerCase().includes(keyword));
  }, [decoratedLeaderboard, searchName]);

  const podium = useMemo(() => filteredLeaderboard.slice(0, 3), [filteredLeaderboard]);

  const myEntry = useMemo(() => {
    if (!highlightUserId) return null;
    return filteredLeaderboard.find((entry) => entry.userId === highlightUserId) ?? null;
  }, [filteredLeaderboard, highlightUserId]);

  const shareBaseEntry = useMemo(() => {
    return myEntry ?? filteredLeaderboard[0] ?? null;
  }, [myEntry, filteredLeaderboard]);

  const quickRecipients = useMemo(() => {
    return filteredLeaderboard
      .filter((entry) => !highlightUserId || entry.userId !== highlightUserId)
      .slice(0, 12);
  }, [filteredLeaderboard, highlightUserId]);

  const recipientCandidates = useMemo(() => {
    const keyword = recipientSearch.trim().toLowerCase();
    if (!keyword) return quickRecipients;
    return quickRecipients.filter((entry) => entry.username.toLowerCase().includes(keyword));
  }, [quickRecipients, recipientSearch]);

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

  const getLevelBadge = (level: string, count: number) => {
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
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-50'}`}>
        {labels[level as keyof typeof labels] || level}: {count}
      </span>
    );
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
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <FiAward className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No data yet</h3>
        <p className="text-gray-500">No one has solved any problems in this season yet</p>
      </div>
    );
  }

  const getSeasonLabel = (value: GlobalLeaderboardSeason) => {
    if (value === 'weekly') return 'Weekly';
    if (value === 'monthly') return 'Monthly';
    return 'All-Time';
  };

  const renderMovement = (movement: number | null) => {
    if (movement == null || movement === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <FiMinus className="w-3 h-3" />
          Stable
        </span>
      );
    }

    if (movement > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
          <FiArrowUp className="w-3 h-3" />
          +{movement}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
        <FiArrowDown className="w-3 h-3" />
        {movement}
      </span>
    );
  };

  const buildRankCardMessage = (selected: (typeof filteredLeaderboard)[number]) => {
    const seasonLabel = getSeasonLabel(season);
    const movementText =
      selected.movement == null || selected.movement === 0
        ? 'Stable'
        : selected.movement > 0
          ? `Up +${selected.movement}`
          : `Down ${selected.movement}`;

    const rankBadge =
      selected.rank === 1 ? '🥇' : selected.rank === 2 ? '🥈' : selected.rank === 3 ? '🥉' : `#${selected.rank}`;

    return [
      '🏆 CodeSphere Leaderboard',
      `${rankBadge} ${selected.username} • ${seasonLabel}`,
      `Solved: ${selected.totalSolved}  •  Easy ${selected.solvedEasy} / Medium ${selected.solvedMedium} / Hard ${selected.solvedHard}`,
      `Movement: ${movementText}  •  Badge: ${selected.badge}`,
      '',
      `🔗 ${window.location.origin}/leaderboard`,
    ].join('\n');
  };

  const handleOpenShareModal = () => {
    if (!shareBaseEntry) {
      toast.error('No leaderboard data to share');
      return;
    }
    setRecipientSearch('');
    setShareMessage('');
    setSelectedRecipientIds([]);
    setShareModalOpen(true);
  };

  const toggleRecipient = (userId: number) => {
    setSelectedRecipientIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleSendInternalShare = async () => {
    if (!shareBaseEntry) {
      toast.error('No leaderboard data to share');
      return;
    }

    if (selectedRecipientIds.length === 0) {
      toast.error('Please choose at least one recipient');
      return;
    }

    const rankCard = buildRankCardMessage(shareBaseEntry);
    const customMessage = shareMessage.trim();
    const payload = customMessage ? `${customMessage}\n\n${rankCard}` : rankCard;

    setSendingShare(true);
    let successCount = 0;

    try {
      await Promise.all(
        selectedRecipientIds.map(async (recipientId) => {
          try {
            const conversation = await conversationApi.createOrGetDirectConversation(recipientId);
            await messageApi.sendMessage(conversation.id, {
              content: payload,
              messageType: 'TEXT',
            });
            successCount += 1;
          } catch {
            // Skip failed recipient but continue the rest.
          }
        }),
      );

      if (successCount > 0) {
        toast.success(`Sent rank card to ${successCount} recipient${successCount > 1 ? 's' : ''}`);
      } else {
        toast.error('Unable to send rank card');
      }

      setShareModalOpen(false);
      setSelectedRecipientIds([]);
      setShareMessage('');
      setRecipientSearch('');
    } finally {
      setSendingShare(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Global Leaderboard Arena</h3>
            <p className="text-sm text-gray-600">Track momentum, season shifts, and your neighborhood rank.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([
              { value: 'all', label: 'All-Time', icon: <FiGlobe className="w-4 h-4" /> },
              { value: 'monthly', label: 'Monthly', icon: <FiCalendar className="w-4 h-4" /> },
              { value: 'weekly', label: 'Weekly', icon: <FiClock className="w-4 h-4" /> },
            ] as const).map((item) => (
              <button
                key={item.value}
                onClick={() => setSeason(item.value)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  season === item.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            <div className="mx-1 h-6 w-px bg-gray-200" />

            {([
              { value: 'global', label: 'Global', icon: <FiUsers className="w-4 h-4" />, disabled: false },
              { value: 'country', label: 'Country', icon: <FiLock className="w-4 h-4" />, disabled: true },
              { value: 'school', label: 'School', icon: <FiLock className="w-4 h-4" />, disabled: true },
            ] as const).map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  if (item.disabled) {
                    toast('Country/School scope will unlock after profile metadata is added.');
                    return;
                  }
                  setScope(item.value);
                }}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  scope === item.value
                    ? 'bg-emerald-600 text-white'
                    : item.disabled
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            <button
              onClick={handleOpenShareModal}
              className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              <FiShare2 className="w-4 h-4" />
              Share Rank Card (Internal)
            </button>
          </div>
        </div>

        <div className="mt-3 max-w-md">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Search by name
          </label>
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Type username..."
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {filteredLeaderboard.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <FiSearch className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <h4 className="text-base font-semibold text-gray-700">No matching users</h4>
          <p className="mt-1 text-sm text-gray-500">Try another keyword for username search.</p>
        </div>
      )}

      {filteredLeaderboard.length > 0 && podium.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[0, 1, 2]
            .filter((index) => podium[index])
            .map((index) => {
              const entry = podium[index];
              const isHighlighted = highlightUserId && entry.userId === highlightUserId;
              const border = entry.rank === 1 ? 'border-yellow-300 bg-yellow-50/50' : 'border-gray-200 bg-white';

              return (
                <button
                  key={entry.userId}
                  onClick={() => navigate(`/profile/${entry.userId}`)}
                  className={`rounded-xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${border} ${
                    isHighlighted ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    {getRankBadge(entry.rank)}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      {entry.badge}
                    </span>
                  </div>
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar src={entry.avatar} alt={entry.username} size="md" />
                    <div>
                      <p className="font-semibold text-gray-900">{entry.username}</p>
                      <p className="text-xs text-gray-500">{renderMovement(entry.movement)}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 font-semibold text-gray-900">
                      <FiTrendingUp className="w-4 h-4 text-blue-500" />
                      {entry.totalSolved} solved
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {entry.solvedEasy > 0 && getLevelBadge('EASY', entry.solvedEasy)}
                      {entry.solvedMedium > 0 && getLevelBadge('MEDIUM', entry.solvedMedium)}
                      {entry.solvedHard > 0 && getLevelBadge('HARD', entry.solvedHard)}
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      )}

      {filteredLeaderboard.length > 0 && (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Total Solved</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Movement</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Badge</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">By Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredLeaderboard.map((entry) => {
                const isHighlighted = highlightUserId && entry.userId === highlightUserId;
                return (
                  <tr
                    key={entry.userId}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      isHighlighted ? 'border-l-4 border-yellow-500 bg-yellow-50' : ''
                    }`}
                    onClick={() => navigate(`/profile/${entry.userId}`)}
                  >
                    <td className="whitespace-nowrap px-6 py-4">{getRankBadge(entry.rank)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="group relative flex items-center gap-3">
                        <Avatar src={entry.avatar} alt={entry.username} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{entry.username}</span>
                            {isHighlighted && (
                              <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">#{entry.rank} in {getSeasonLabel(season)}</span>
                        </div>

                        <div className="pointer-events-none invisible absolute left-0 top-full z-20 mt-2 min-w-56 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg group-hover:visible">
                          <p className="mb-1 flex items-center gap-2 font-semibold text-gray-900">
                            <FiUser className="h-3.5 w-3.5" />
                            {entry.username}
                          </p>
                          <p className="text-gray-600">Solved: {entry.totalSolved}</p>
                          <p className="text-gray-600">Badge: {entry.badge}</p>
                          <p className="text-gray-600">Movement: {entry.movement == null ? 'Stable' : entry.movement > 0 ? `+${entry.movement}` : entry.movement}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FiTrendingUp className="h-4 w-4 text-blue-500" />
                        <span className="text-lg font-bold text-gray-900">{entry.totalSolved}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">{renderMovement(entry.movement)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {entry.badge}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {entry.solvedEasy > 0 && getLevelBadge('EASY', entry.solvedEasy)}
                        {entry.solvedMedium > 0 && getLevelBadge('MEDIUM', entry.solvedMedium)}
                        {entry.solvedHard > 0 && getLevelBadge('HARD', entry.solvedHard)}
                        {entry.solvedEasy === 0 && entry.solvedMedium === 0 && entry.solvedHard === 0 && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isLoadingAllTime && season !== 'all' && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500">
            Movement compares current {getSeasonLabel(season).toLowerCase()} rank against all-time rank.
          </div>
        )}
      </div>
      )}

      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Share Rank Card</h3>
                <p className="text-sm text-gray-500">Send leaderboard snapshot to internal messages.</p>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {shareBaseEntry && (
                <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Preview</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {shareBaseEntry.username} • #{shareBaseEntry.rank} • {shareBaseEntry.totalSolved} solved • {getSeasonLabel(season)}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Optional message
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a short note before the rank card..."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Choose recipients
                </label>
                <div className="relative mb-2">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    placeholder="Search recipients by username..."
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-2">
                  {recipientCandidates.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-500">No recipients found</div>
                  ) : (
                    recipientCandidates.map((recipient) => {
                      const selected = selectedRecipientIds.includes(recipient.userId);
                      return (
                        <button
                          key={`recipient-${recipient.userId}`}
                          onClick={() => toggleRecipient(recipient.userId)}
                          className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
                            selected
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <Avatar alt={recipient.username} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{recipient.username}</p>
                            <p className="text-xs text-gray-500">#{recipient.rank}</p>
                          </div>
                          {selected && <span className="text-xs font-semibold text-blue-700">Selected</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
              <p className="text-sm text-gray-600">{selectedRecipientIds.length} selected</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInternalShare}
                  disabled={sendingShare || selectedRecipientIds.length === 0}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingShare ? 'Sending...' : 'Send Internal Share'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalLeaderboardTable;

