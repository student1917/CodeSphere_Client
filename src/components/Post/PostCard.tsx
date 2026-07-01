import { FiThumbsUp, FiEye, FiMessageCircle, FiMoreVertical, FiX, FiShare2, FiFlag, FiAlertTriangle, FiLink, FiArrowLeft, FiSearch } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Avatar from '@/components/Avatar';
import type { PostResponse, PostReactionUserResponse, ReactionSummaryItemResponse, PostShareUserResponse } from '@/types/post.types';
import { postApi } from '@/apis/post.api';
import { commentApi } from '@/apis/comment.api';
import { conversationApi } from '@/apis/conversation.api';
import { messageApi } from '@/apis/message.api';
import { userApi } from '@/apis/user.api';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { ConversationResponse } from '@/types/conversation.types';
import type { UserSearchResponse } from '@/types/user.types';
import type { CommentResponse } from '@/types/comment.types';

interface PostCardProps {
  post: PostResponse;
  onVoteChange?: () => void;
}

type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

type ShareRecipient = {
  key: string;
  recipientType: 'direct' | 'group';
  userId?: number;
  conversationId?: number;
  username: string;
  avatar: string | null;
};

const REPORT_REASON_TEMPLATES = [
  { code: 'SPAM', label: 'Spam' },
  { code: 'HARASSMENT', label: 'Harassment' },
  { code: 'HATE_SPEECH', label: 'Hate Speech' },
  { code: 'EXPLICIT_CONTENT', label: 'Explicit Content' },
  { code: 'ILLEGAL_CONTENT', label: 'Illegal Content' },
  { code: 'MISINFORMATION', label: 'Misinformation' },
  { code: 'COPYRIGHT_VIOLATION', label: 'Copyright Violation' },
  { code: 'OTHER', label: 'Other' },
];

const REACTIONS: Array<{ type: ReactionType; emoji: string; label: string }> = [
  { type: 'LIKE', emoji: '👍', label: 'Like' },
  { type: 'LOVE', emoji: '❤️', label: 'Love' },
  { type: 'HAHA', emoji: '😂', label: 'Haha' },
  { type: 'WOW', emoji: '😮', label: 'Wow' },
  { type: 'SAD', emoji: '😢', label: 'Sad' },
  { type: 'ANGRY', emoji: '😡', label: 'Angry' },
];

const getPostPreviewText = (content: string, maxLength = 600) => {
  const normalized = (content || '')
    .replace(/\r\n/g, '\n')
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' [image] ')
    .replace(/\[[^\]]+\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

const PostCard = ({ post, onVoteChange }: PostCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVoting, setIsVoting] = useState(false);
  const [currentVote, setCurrentVote] = useState<number | null>(post.userVote);
  const [selectedReaction, setSelectedReaction] = useState<ReactionType | null>(null);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);
  const [likeCount, setLikeCount] = useState(post.upvotes);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReactorPopover, setShowReactorPopover] = useState(false);
  const [reactorUsers, setReactorUsers] = useState<PostReactionUserResponse[]>([]);
  const [loadingReactors, setLoadingReactors] = useState(false);
  const [showCommentersPopover, setShowCommentersPopover] = useState(false);
  const [commenters, setCommenters] = useState<CommentResponse[]>([]);
  const [loadingCommenters, setLoadingCommenters] = useState(false);
  const [showSharersPopover, setShowSharersPopover] = useState(false);
  const [sharers, setSharers] = useState<PostShareUserResponse[]>([]);
  const [loadingSharers, setLoadingSharers] = useState(false);
  const [reactionSummary, setReactionSummary] = useState<ReactionSummaryItemResponse[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [quickConversations, setQuickConversations] = useState<ConversationResponse[]>([]);
  const [loadingQuickConversations, setLoadingQuickConversations] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<ShareRecipient[]>([]);
  const [showMessagePicker, setShowMessagePicker] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<UserSearchResponse[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sendingShare, setSendingShare] = useState(false);
  const [copyLinkState, setCopyLinkState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReasonCode, setReportReasonCode] = useState(REPORT_REASON_TEMPLATES[0].code);
  const [reportReasonDetail, setReportReasonDetail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const reactionPickerHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewText = getPostPreviewText(post.content);

  const reactionStorageKey = `post_reaction_${post.id}_${user?.id ?? 'guest'}`;

  const getReactionEmoji = () => {
    const activeReaction = currentVote === 1 ? (hoveredReaction || selectedReaction) : selectedReaction;
    if (!activeReaction) return '👍';
    const item = REACTIONS.find((reaction) => reaction.type === activeReaction);
    return item?.emoji || '👍';
  };

  const getReactionEmojiByType = (reactionType: string) => {
    const item = REACTIONS.find((reaction) => reaction.type === reactionType);
    return item?.emoji || '👍';
  };

  const setStoredReaction = (reaction: ReactionType | null) => {
    if (!user?.id) return;
    if (reaction) {
      localStorage.setItem(reactionStorageKey, reaction);
    } else {
      localStorage.removeItem(reactionStorageKey);
    }
  };

  const resolveServerVote = (response: any): number | null => {
    const rawVote = response?.userVote ?? response?.vote;
    if (rawVote === 1 || rawVote === -1 || rawVote === 0) {
      return rawVote;
    }
    return null;
  };

  const handleReactionAreaEnter = () => {
    if (reactionPickerHideTimeout.current) {
      clearTimeout(reactionPickerHideTimeout.current);
      reactionPickerHideTimeout.current = null;
    }
    setShowReactionPicker(true);
  };

  const handleReactionAreaLeave = () => {
    reactionPickerHideTimeout.current = setTimeout(() => {
      setShowReactionPicker(false);
      setHoveredReaction(null);
    }, 120);
  };

  // Sync state với post prop chỉ khi post.id thay đổi (post mới), không sync khi vote
  useEffect(() => {
    setCurrentVote(post.userVote);
    setLikeCount(post.upvotes);

    if (post.userVote === 1) {
      const stored = localStorage.getItem(reactionStorageKey) as ReactionType | null;
      setSelectedReaction(stored || 'LIKE');
    } else {
      setSelectedReaction(null);
    }
  }, [post.id]);

  useEffect(() => {
    const fetchReactionSummary = async () => {
      try {
        const summary = await postApi.getPostReactionSummary(post.id);
        setReactionSummary(summary.topReactions || []);
      } catch {
        setReactionSummary([]);
      }
    };

    fetchReactionSummary();
  }, [post.id]);

  useEffect(() => {
    if (!showReactorPopover || reactorUsers.length > 0) return;

    const fetchReactors = async () => {
      setLoadingReactors(true);
      try {
        const users = await postApi.getPostReactions(post.id, 25);
        setReactorUsers(users);
      } catch {
        setReactorUsers([]);
      } finally {
        setLoadingReactors(false);
      }
    };

    fetchReactors();
  }, [showReactorPopover, reactorUsers.length, post.id]);

  useEffect(() => {
    if (!showCommentersPopover || commenters.length > 0) return;

    const fetchCommenters = async () => {
      setLoadingCommenters(true);
      try {
        const page = await commentApi.getPostComments(post.id, {
          page: 0,
          size: 30,
          sortBy: 'createdAt',
          sortDir: 'DESC',
        });
        const uniqueByUser = new Map<number, CommentResponse>();
        page.content.forEach((comment) => {
          if (!uniqueByUser.has(comment.authorId)) {
            uniqueByUser.set(comment.authorId, comment);
          }
        });
        setCommenters(Array.from(uniqueByUser.values()));
      } catch {
        setCommenters([]);
      } finally {
        setLoadingCommenters(false);
      }
    };

    fetchCommenters();
  }, [showCommentersPopover, commenters.length, post.id]);

  useEffect(() => {
    if (!showSharersPopover || sharers.length > 0) return;

    const fetchSharers = async () => {
      setLoadingSharers(true);
      try {
        const users = await postApi.getPostShares(post.id, 30);
        setSharers(users);
      } catch {
        setSharers([]);
      } finally {
        setLoadingSharers(false);
      }
    };

    fetchSharers();
  }, [showSharersPopover, sharers.length, post.id]);

  useEffect(() => {
    const fetchQuickConversations = async () => {
      if (!shareModalOpen || !user?.id) return;

      setLoadingQuickConversations(true);
      try {
        const data = await conversationApi.getConversations();
        const sorted = [...data].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setQuickConversations(sorted.slice(0, 8));
      } catch {
        setQuickConversations([]);
      } finally {
        setLoadingQuickConversations(false);
      }
    };

    fetchQuickConversations();
  }, [shareModalOpen, user?.id]);

  useEffect(() => {
    if (!shareModalOpen || !showMessagePicker) return;

    if (searchUserQuery.trim().length < 2) {
      setSearchedUsers([]);
      setSearchingUsers(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const response = await userApi.searchUsers(searchUserQuery.trim(), 0, 20);
        const filtered = response.content.filter((item) => item.userId !== user?.id);
        setSearchedUsers(filtered);
      } catch {
        setSearchedUsers([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchUserQuery, shareModalOpen, showMessagePicker, user?.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoting) return;

    // Nếu đã like thì unlike (vote = 0), nếu chưa like thì like (vote = 1)
    const isCurrentlyLiked = currentVote === 1;
    const newVote = isCurrentlyLiked ? 0 : 1;

    // Optimistic update
    const previousVote = currentVote;
    const previousCount = likeCount;

    const optimisticVote = newVote === 1 ? 1 : null;
    setCurrentVote(optimisticVote);
    setSelectedReaction(newVote === 1 ? 'LIKE' : null);
    setLikeCount(prev => isCurrentlyLiked ? Math.max(0, prev - 1) : prev + 1);

    setIsVoting(true);
    try {
      const response = await postApi.votePost(post.id, newVote);
      const serverUserVote = resolveServerVote(response);

      if (serverUserVote !== null && serverUserVote !== undefined) {
        setCurrentVote(serverUserVote === 1 ? 1 : null);
        if (serverUserVote === 1) {
          setSelectedReaction((prev) => prev || 'LIKE');
          setStoredReaction('LIKE');
        } else {
          setSelectedReaction(null);
          setStoredReaction(null);
        }
      }

      setLikeCount(response.upvotes ?? previousCount);
      const summary = await postApi.getPostReactionSummary(post.id);
      setReactionSummary(summary.topReactions || []);
      onVoteChange?.();
    } catch (error: any) {
      setCurrentVote(previousVote);
      setSelectedReaction(previousVote === 1 ? selectedReaction : null);
      setLikeCount(previousCount);
      toast.error(error?.response?.data?.message || 'Error liking post');
    } finally {
      setIsVoting(false);
    }
  };

  const handleSelectReaction = async (e: React.MouseEvent, reaction: ReactionType) => {
    e.stopPropagation();
    if (isVoting) return;

    // If the user is already liked, changing the emoji should still persist to backend.
    if (currentVote === 1 && selectedReaction === reaction) {
      setShowReactionPicker(false);
      setHoveredReaction(null);
      return;
    }

    const previousVote = currentVote;
    const previousCount = likeCount;
    const previousReaction = selectedReaction;

    setShowReactionPicker(false);
    setHoveredReaction(null);
    setIsVoting(true);
    setCurrentVote(1);
    setSelectedReaction(reaction);
    setStoredReaction(reaction);
    if (previousVote !== 1) {
      setLikeCount((prev) => prev + 1);
    }

    try {
      const response = await postApi.votePost(post.id, 1, reaction);
      const serverUserVote = resolveServerVote(response);

      setCurrentVote(serverUserVote === 1 ? 1 : null);
      if (serverUserVote === 1) {
        setSelectedReaction(reaction);
        setStoredReaction(reaction);
      } else {
        setSelectedReaction(null);
        setStoredReaction(null);
      }
      setLikeCount(response.upvotes ?? previousCount);
      const summary = await postApi.getPostReactionSummary(post.id);
      setReactionSummary(summary.topReactions || []);
      setReactorUsers([]);
      onVoteChange?.();
    } catch (error: any) {
      setCurrentVote(previousVote);
      setLikeCount(previousCount);
      setSelectedReaction(previousReaction);
      toast.error(error?.response?.data?.message || 'Error reacting to post');
    } finally {
      setIsVoting(false);
    }
  };

  const handlePostClick = () => {
    navigate(`/discuss/${post.id}`);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/discuss/${post.id}#comments`);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch {
      return dateString;
    }
  };

  const getShareUrl = () => `${window.location.origin}/discuss/${post.id}`;

  const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback for browsers without Clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await copyText(getShareUrl());
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Unable to copy link');
    } finally {
      setShowMoreMenu(false);
    }
  };

  const getConversationDisplay = (conversation: ConversationResponse) => {
    if (conversation.type === 'DIRECT') {
      const other = conversation.participants.find((p) => p.userId !== user?.id);
      return {
        name: other?.username || 'Direct chat',
        avatar: other?.avatar || null,
      };
    }

    return {
      name: conversation.name || 'Group chat',
      avatar: conversation.avatar || null,
    };
  };

  const getQuickRecipients = (): ShareRecipient[] => {
    const seenDirect = new Set<number>();
    const recipients: ShareRecipient[] = [];

    quickConversations.forEach((conversation) => {
      if (conversation.type === 'DIRECT') {
        const other = conversation.participants.find((p) => p.userId !== user?.id);
        if (!other || seenDirect.has(other.userId)) return;
        seenDirect.add(other.userId);
        recipients.push({
          key: `direct-${other.userId}`,
          recipientType: 'direct',
          userId: other.userId,
          username: other.username,
          avatar: other.avatar,
        });
        return;
      }

      recipients.push({
        key: `group-${conversation.id}`,
        recipientType: 'group',
        conversationId: conversation.id,
        username: conversation.name || 'Group chat',
        avatar: conversation.avatar || null,
      });
    });

    return recipients;
  };

  const isRecipientSelected = (recipientKey: string) => selectedRecipients.some((item) => item.key === recipientKey);

  const toggleRecipient = (recipient: ShareRecipient) => {
    setSelectedRecipients((prev) => {
      const exists = prev.some((item) => item.key === recipient.key);
      if (exists) {
        return prev.filter((item) => item.key !== recipient.key);
      }
      return [...prev, recipient];
    });
  };

  const handleSendSelectedRecipients = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Please choose at least one recipient');
      return;
    }

    const shareUrl = getShareUrl();
    const intro = shareMessage.trim();
    const payload = `${intro ? `${intro}\n\n` : ''}[${post.title}](${shareUrl})`;

    setSendingShare(true);
    let successCount = 0;

    try {
      await Promise.all(
        selectedRecipients.map(async (recipient) => {
          try {
            let conversationId: number;

            if (recipient.recipientType === 'group' && recipient.conversationId) {
              conversationId = recipient.conversationId;
            } else if (recipient.userId) {
              const conversation = await conversationApi.createOrGetDirectConversation(recipient.userId);
              conversationId = conversation.id;
            } else {
              return;
            }

            await messageApi.sendMessage(conversationId, {
              content: payload,
              messageType: 'TEXT',
            });
            successCount += 1;
          } catch {
            // Ignore per-recipient errors; summary shown after loop
          }
        })
      );

      if (successCount === selectedRecipients.length) {
        toast.success(`Sent to ${successCount} recipient${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0) {
        toast.success(`Sent to ${successCount}/${selectedRecipients.length} recipients`);
      } else {
        toast.error('Unable to send message');
        return;
      }

      setShareModalOpen(false);
      setSelectedRecipients([]);
      setShowMessagePicker(false);
      setSearchUserQuery('');
      setSearchedUsers([]);
    } finally {
      setSendingShare(false);
    }
  };

  const buildShareTargetUrl = (target: 'facebook' | 'whatsapp' | 'telegram' | 'twitter') => {
    const url = getShareUrl();
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent((shareMessage.trim() || `Check out this post: ${post.title}`).trim());

    if (target === 'facebook') {
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    }
    if (target === 'whatsapp') {
      return `https://wa.me/?text=${encodeURIComponent(`${shareMessage.trim() || post.title} ${url}`)}`;
    }
    if (target === 'telegram') {
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    }
    return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
  };

  const handleShareToWeb = (target: 'facebook' | 'whatsapp' | 'telegram' | 'twitter') => {
    const shareUrl = buildShareTargetUrl(target);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLinkInModal = async () => {
    try {
      await copyText(getShareUrl());
      setCopyLinkState('copied');
      setTimeout(() => setCopyLinkState('idle'), 1800);
    } catch {
      setCopyLinkState('failed');
      setTimeout(() => setCopyLinkState('idle'), 1800);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.id) {
      try {
        await postApi.markPostShared(post.id);
        setSharers([]);
      } catch {
        // Ignore share tracking errors to avoid blocking share UX
      }
    }
    setShareMessage('');
    setSelectedRecipients([]);
    setShowMessagePicker(false);
    setSearchUserQuery('');
    setSearchedUsers([]);
    setCopyLinkState('idle');
    setShareModalOpen(true);
    setShowMoreMenu(false);
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setShowMessagePicker(false);
    setSearchUserQuery('');
    setSearchedUsers([]);
    setSelectedRecipients([]);
  };

  const pickerRecipients: ShareRecipient[] = searchUserQuery.trim().length >= 2
    ? searchedUsers.map((userItem) => ({
      key: `direct-${userItem.userId}`,
      recipientType: 'direct',
      userId: userItem.userId,
      username: userItem.username,
      avatar: userItem.avatar,
    }))
    : getQuickRecipients();

  const handleOpenReport = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!user) {
      toast.error('Please login to report this post');
      navigate('/login');
      return;
    }

    if (user.id === post.authorId) {
      toast.error('You cannot report your own post');
      return;
    }

    setReportReasonCode(REPORT_REASON_TEMPLATES[0].code);
    setReportReasonDetail('');
    setShowMoreMenu(false);
    setReportModalOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReasonCode.trim()) {
      toast.error('Please choose a report reason');
      return;
    }

    if (!reportReasonDetail.trim()) {
      toast.error('Please enter report detail');
      return;
    }

    setIsSubmittingReport(true);
    try {
      await postApi.reportPost(post.id, {
        reasonCode: reportReasonCode,
        reasonDetail: reportReasonDetail.trim(),
      });
      toast.success('Report submitted successfully');
      setReportModalOpen(false);
      setReportReasonDetail('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-visible">
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (!post.isAnonymous && post.authorId) navigate(`/users/${post.authorId}`);
            }}
            className={`${!post.isAnonymous && post.authorId ? 'cursor-pointer' : ''}`}
          >
            <Avatar
              user={{
                id: post.authorId,
                username: post.authorName,
                email: '',
                role: 'USER',
                avatar: post.authorAvatar || undefined,
              }}
              size="md"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (!post.isAnonymous && post.authorId) navigate(`/users/${post.authorId}`);
                }}
                className={`font-bold text-gray-900 ${!post.isAnonymous && post.authorId ? 'hover:underline cursor-pointer' : ''}`}
              >
                {post.isAnonymous ? 'Anonymous User' : post.authorName}
              </span>
              {post.isResolved && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded">
                  Resolved
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>{formatTime(post.createdAt)}</span>
              <span>•</span>
              <FiEye className="w-3 h-3" />
              <span>{post.viewCount || 0}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreMenu((prev) => !prev);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiMoreVertical className="w-5 h-5" />
          </button>

          {showMoreMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg py-1 z-20 border border-gray-200">
                {user && user.id !== post.authorId && (
                  <button
                    onClick={handleOpenReport}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <FiFlag className="w-4 h-4" />
                    <span>Report post</span>
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiShare2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiLink className="w-4 h-4" />
                  <span>Copy link</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 pb-3">
        <h3
          onClick={handlePostClick}
          className="text-lg font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
        >
          {post.title}
        </h3>
        <p
          onClick={handlePostClick}
          className="text-gray-700 text-[15px] mb-3 line-clamp-6 cursor-pointer whitespace-pre-wrap"
        >
          {previewText}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-200 cursor-pointer transition-colors"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      {((post.images && post.images.length > 0) || post.imageUrl) && (
        <div className="border-y border-gray-100 bg-gray-50">
          {post.images && post.images.length > 0 ? (
            <div className={`grid gap-0.5 ${post.images.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {post.images.slice(0, 4).map((img, idx) => (
                <div key={idx} className="relative aspect-square overflow-hidden bg-gray-200">
                  <img
                    src={img}
                    alt={`Post image ${idx + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(img);
                    }}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  />
                  {idx === 3 && (post.images?.length ?? 0) > 4 && (
                    <div
                      className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(post.images?.[3] ?? null);
                      }}
                    >
                      <span className="text-white text-2xl font-bold">+{(post.images?.length ?? 0) - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt="Post image"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(post.imageUrl!);
              }}
              className="w-full h-auto max-h-[500px] object-cover cursor-pointer"
            />
          ) : null}
        </div>
      )}

      {/* Interaction Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 border-b border-gray-100">
        <div
          className="relative flex items-center gap-1.5"
          onMouseEnter={() => setShowReactorPopover(true)}
          onMouseLeave={() => setShowReactorPopover(false)}
        >
          <div className="flex -space-x-1">
            {reactionSummary.length > 0 ? (
              reactionSummary.slice(0, 2).map((item, index) => (
                <div
                  key={`${item.reactionType}-${index}`}
                  className="w-5 h-5 rounded-full bg-white flex items-center justify-center border-2 border-white shadow-sm"
                  title={`${item.reactionType} (${item.count})`}
                >
                  <span className="text-[11px] leading-none">{getReactionEmojiByType(item.reactionType)}</span>
                </div>
              ))
            ) : (
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-[11px] leading-none">{getReactionEmoji()}</span>
              </div>
            )}
          </div>
          <span className="hover:underline cursor-pointer">{likeCount || 0}</span>

          {showReactorPopover && (
            <div className="absolute left-0 top-full mt-2 z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
              <div className="text-xs font-semibold text-gray-500 mb-2">Người đã tương tác</div>
              {loadingReactors ? (
                <div className="text-sm text-gray-500 py-2">Đang tải...</div>
              ) : reactorUsers.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">Chưa có tương tác</div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {reactorUsers.map((reactor) => (
                    <button
                      key={reactor.userId}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/users/${reactor.userId}`);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <Avatar src={reactor.avatar || undefined} alt={reactor.username} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{reactor.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="relative"
            onMouseEnter={() => setShowCommentersPopover(true)}
            onMouseLeave={() => setShowCommentersPopover(false)}
          >
            <button
              type="button"
              onClick={handleCommentClick}
              className="hover:underline cursor-pointer"
            >
              {post.commentCount || 0} comments
            </button>

            {showCommentersPopover && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                <div className="text-xs font-semibold text-gray-500 mb-2">Người đã bình luận</div>
                {loadingCommenters ? (
                  <div className="text-sm text-gray-500 py-2">Đang tải...</div>
                ) : commenters.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2">Chưa có bình luận</div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {commenters.map((comment) => (
                      <button
                        key={`commenter-${comment.authorId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/users/${comment.authorId}`);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-left"
                      >
                        <Avatar src={comment.authorAvatar || undefined} alt={comment.authorName} size="sm" />
                        <div className="min-w-0 text-sm font-medium text-gray-900 truncate">{comment.authorName}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setShowSharersPopover(true)}
            onMouseLeave={() => setShowSharersPopover(false)}
          >
            <button
              type="button"
              onClick={handleShare}
              className="hover:underline cursor-pointer"
            >
              {sharers.length || 0} shares
            </button>

            {showSharersPopover && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                <div className="text-xs font-semibold text-gray-500 mb-2">Người đã chia sẻ</div>
                {loadingSharers ? (
                  <div className="text-sm text-gray-500 py-2">Đang tải...</div>
                ) : sharers.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2">Chưa có chia sẻ</div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {sharers.map((share) => (
                      <button
                        key={`sharer-${share.userId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/users/${share.userId}`);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-left"
                      >
                        <Avatar src={share.avatar || undefined} alt={share.username} size="sm" />
                        <div className="min-w-0 text-sm font-medium text-gray-900 truncate">{share.username}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-2 py-1 flex items-center gap-1 border-t border-gray-100">
        <div
          className="relative flex-1"
          onMouseEnter={handleReactionAreaEnter}
          onMouseLeave={handleReactionAreaLeave}
        >
          {showReactionPicker && (
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-full bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1.5 flex items-center gap-1.5 z-50"
              onMouseEnter={handleReactionAreaEnter}
              onMouseLeave={handleReactionAreaLeave}
            >
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={(e) => handleSelectReaction(e, reaction.type)}
                  onMouseEnter={() => setHoveredReaction(reaction.type)}
                  title={reaction.label}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleLike}
            disabled={isVoting}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${currentVote === 1
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            {currentVote === 1 ? (
              <span className="text-[18px] leading-none">{getReactionEmoji()}</span>
            ) : (
              <FiThumbsUp className="w-5 h-5" />
            )}
            <span className="font-semibold text-[14px]">
              {((currentVote === 1 && hoveredReaction)
                ? REACTIONS.find((reaction) => reaction.type === hoveredReaction)?.label
                : REACTIONS.find((reaction) => reaction.type === selectedReaction)?.label) || 'Like'}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleCommentClick}
          className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiMessageCircle className="w-5 h-5" />
          <span className="font-semibold text-[14px]">Comment</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiShare2 className="w-5 h-5" />
          <span className="font-semibold text-[14px]">Share</span>
        </button>
      </div>

      {/* Image Modal */}
      {selectedImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <FiX className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}

      {reportModalOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReportModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
            <div className="p-6 border-b border-gray-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                <FiAlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Report post</h3>
                <p className="text-sm text-gray-500 mt-1">Your report will be reviewed by moderators.</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Reason
                </label>
                <select
                  value={reportReasonCode}
                  onChange={(e) => setReportReasonCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                >
                  {REPORT_REASON_TEMPLATES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label} ({item.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Detail
                </label>
                <textarea
                  rows={4}
                  value={reportReasonDetail}
                  onChange={(e) => setReportReasonDetail(e.target.value)}
                  placeholder="Describe the violation to help moderation team"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setReportModalOpen(false)}
                disabled={isSubmittingReport}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isSubmittingReport}
                className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg bg-rose-600 hover:bg-rose-700"
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {shareModalOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseShareModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {showMessagePicker ? (
              <>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setShowMessagePicker(false)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
                  >
                    <FiArrowLeft className="w-6 h-6" />
                  </button>
                  <h3 className="text-2xl font-bold text-gray-900">Send to</h3>
                  <button
                    onClick={handleCloseShareModal}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-84px)]">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchUserQuery}
                      onChange={(e) => setSearchUserQuery(e.target.value)}
                      placeholder="Search people and groups"
                      className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full text-base border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    {searchingUsers && <div className="text-sm text-gray-500 py-2">Searching...</div>}
                    {!searchingUsers && pickerRecipients.length === 0 && (
                      <div className="text-sm text-gray-500 py-2">No recipients found</div>
                    )}
                    {!searchingUsers && pickerRecipients.map((recipient) => {
                      const selected = isRecipientSelected(recipient.key);
                      return (
                        <button
                          key={recipient.key}
                          onClick={() => toggleRecipient(recipient)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50"
                        >
                          <Avatar src={recipient.avatar || undefined} alt={recipient.username} size="lg" />
                          <span className="flex-1 text-left text-2xl font-semibold text-gray-900">
                            {recipient.username}
                            {recipient.recipientType === 'group' && (
                              <span className="ml-2 text-sm font-medium text-gray-500">(Group)</span>
                            )}
                          </span>
                          <span
                            className={`w-7 h-7 rounded-md border-2 flex items-center justify-center ${selected ? 'border-blue-600 bg-blue-600' : 'border-gray-400 bg-white'}`}
                          >
                            {selected && <span className="text-white text-sm font-bold">✓</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="sticky bottom-0 bg-white pt-2 border-t border-gray-100">
                    <input
                      type="text"
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      placeholder="Add a message (optional)..."
                      className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-base border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      onClick={handleSendSelectedRecipients}
                      disabled={sendingShare || selectedRecipients.length === 0}
                      className="w-full mt-3 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {sendingShare ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Share</h3>
                  <button
                    onClick={handleCloseShareModal}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="font-semibold text-gray-900 line-clamp-1">{post.title}</div>
                <div className="text-sm text-gray-500 mt-1 line-clamp-1">{getShareUrl()}</div>
                <textarea
                  rows={3}
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Say something about this post..."
                  className="mt-3 w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-sm text-gray-600">
                    {selectedRecipients.length > 0
                      ? `${selectedRecipients.length} recipient${selectedRecipients.length > 1 ? 's' : ''} selected`
                      : 'Select recipients from Messenger section'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMessagePicker(true)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                      Messages
                    </button>
                    <button
                      onClick={handleSendSelectedRecipients}
                      disabled={sendingShare || selectedRecipients.length === 0}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingShare ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-gray-900 mb-3">Send via Messenger</div>
                {loadingQuickConversations ? (
                  <div className="text-sm text-gray-500 py-2">Loading conversations...</div>
                ) : getQuickRecipients().length > 0 ? (
                  <div className="flex items-start gap-4 overflow-x-auto pb-2">
                    {getQuickRecipients().map((recipient) => {
                      const selected = isRecipientSelected(recipient.key);
                      return (
                        <button
                          key={recipient.key}
                          onClick={() => toggleRecipient(recipient)}
                          className="flex-shrink-0 w-[86px] text-center group"
                          title={recipient.username}
                        >
                          <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                            <Avatar src={recipient.avatar || undefined} alt={recipient.username} size="xl" />
                            {selected && (
                              <span className="absolute -right-0.5 -bottom-0.5 w-6 h-6 rounded-full bg-blue-600 border-2 border-white text-white text-xs font-bold flex items-center justify-center shadow-sm">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm leading-5 font-medium text-gray-800 line-clamp-2 px-1">
                            {recipient.username}
                          </div>
                          {recipient.recipientType === 'group' && (
                            <div className="text-[11px] text-gray-500">Group</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 py-2">No recent recipients</div>
                )}

                <div className="mt-3">
                  <button
                    onClick={() => setShowMessagePicker(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <FiShare2 className="w-4 h-4" />
                    <span>Messages</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-gray-900 mb-3">Share to</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCopyLinkInModal}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <FiLink className="w-4 h-4" />
                    <span>Copy link</span>
                  </button>
                  <button
                    onClick={() => handleShareToWeb('facebook')}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShareToWeb('whatsapp')}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleShareToWeb('telegram')}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Telegram
                  </button>
                  <button
                    onClick={() => handleShareToWeb('twitter')}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Twitter/X
                  </button>
                </div>
                {copyLinkState === 'copied' && (
                  <div className="text-xs text-emerald-600 mt-2">Link copied</div>
                )}
                {copyLinkState === 'failed' && (
                  <div className="text-xs text-rose-600 mt-2">Unable to copy link</div>
                )}
              </div>
            </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PostCard;

