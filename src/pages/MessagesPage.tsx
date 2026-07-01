import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Avatar from '@/components/Avatar';
import { conversationApi } from '@/apis/conversation.api';
import { messageApi } from '@/apis/message.api';
import { postApi } from '@/apis/post.api';
import { fileApi } from '@/apis/file.api';
import { authApi } from '@/apis/auth.api';
import { followApi } from '@/apis/follow.api';
import { userApi } from '@/apis/user.api';
import type { FollowResponse } from '@/types/follow.types';
import type { UserSearchResponse } from '@/types/user.types';
import type { PostDetailResponse } from '@/types/post.types';
import { messageWebSocketService } from '@/services/messageWebSocket.service';
import type { ConversationResponse, MessageResponse, CreateConversationRequest } from '@/types/conversation.types';
import { useAuth } from '@/hooks/useAuth';
import { FiSend, FiMessageSquare, FiPlus, FiMoreVertical, FiTrash2, FiImage, FiX, FiCheckCircle, FiSearch, FiUsers, FiUserPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

const MessagesPage = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
  const initialLoadRef = useRef(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [followingUsers, setFollowingUsers] = useState<FollowResponse[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [searchFollowingQuery, setSearchFollowingQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<UserSearchResponse[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<number[]>([]);
  const [showUserListToAdd, setShowUserListToAdd] = useState(false);
  const [searchAddMemberQuery, setSearchAddMemberQuery] = useState('');
  const [searchedUsersToAdd, setSearchedUsersToAdd] = useState<UserSearchResponse[]>([]);
  const [loadingSearchToAdd, setLoadingSearchToAdd] = useState(false);
  const [searchTimeoutToAdd, setSearchTimeoutToAdd] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [addingMembers, setAddingMembers] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [transferringAdminId, setTransferringAdminId] = useState<number | null>(null);
  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false);
  const [selectedNewAdminId, setSelectedNewAdminId] = useState<number | null>(null);
  const [sharedPostPreviews, setSharedPostPreviews] = useState<Record<number, PostDetailResponse | null>>({});

  useEffect(() => {
    const prefillMessage = (location.state as { prefillMessage?: string } | null)?.prefillMessage;
    if (typeof prefillMessage === 'string' && prefillMessage.trim()) {
      setMessageContent(prefillMessage);
    }
  }, [location.state]);

  // Đảm bảo container MessagesPage không scroll - scroll to top và disable body scroll
  useEffect(() => {
    // Scroll to top ngay lập tức khi vào MessagesPage
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Lưu overflow ban đầu của html và body
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlPosition = document.documentElement.style.position;
    const originalBodyPosition = document.body.style.position;
    
    // Disable scroll trên html và body
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    // Đảm bảo không có scroll
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    return () => {
      // Restore overflow và position khi rời khỏi page
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.position = originalHtmlPosition;
      document.documentElement.style.width = '';
      document.body.style.position = originalBodyPosition;
      document.body.style.width = '';
    };
  }, []);

  // Connect WebSocket on mount
  useEffect(() => {
    if (user?.id) {
      messageWebSocketService.connect(
        user.id.toString(),
        () => {
          setIsConnected(true);
          console.log('WebSocket connected');
        },
        (error) => {
          setIsConnected(false);
          console.error('WebSocket error:', error);
        }
      );
    }

    return () => {
      messageWebSocketService.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Load following users when opening create group modal
  useEffect(() => {
    const loadFollowingUsers = async () => {
      if (showCreateGroup && user?.id && followingUsers.length === 0) {
        setLoadingFollowing(true);
        try {
          const data = await followApi.getFollowing(user.id);
          setFollowingUsers(data);
        } catch (error) {
          console.error('Error loading following users:', error);
          toast.error('Error loading user list');
        } finally {
          setLoadingFollowing(false);
        }
      }
    };

    loadFollowingUsers();
  }, [showCreateGroup, user?.id]);

  // Load following users when opening add member modal
  useEffect(() => {
    const loadFollowingUsersForAdd = async () => {
      if (showAddMember && user?.id && followingUsers.length === 0) {
        setLoadingFollowing(true);
        try {
          const data = await followApi.getFollowing(user.id);
          setFollowingUsers(data);
        } catch (error) {
          console.error('Error loading following users:', error);
          toast.error('Error loading user list');
        } finally {
          setLoadingFollowing(false);
        }
      }
    };

    loadFollowingUsersForAdd();
  }, [showAddMember, user?.id]);

  // Search users with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchFollowingQuery.trim().length >= 2) {
      const timeout = setTimeout(async () => {
        setLoadingSearch(true);
        try {
          const response = await userApi.searchUsers(searchFollowingQuery.trim(), 0, 20);
          // Filter out current user and already selected users
          const filtered = response.content.filter(
            (u) => u.userId !== user?.id && !selectedUsers.includes(u.userId)
          );
          setSearchedUsers(filtered);
        } catch (error) {
          console.error('Error searching users:', error);
          setSearchedUsers([]);
        } finally {
          setLoadingSearch(false);
        }
      }, 500); // Debounce 500ms

      setSearchTimeout(timeout);
    } else {
      setSearchedUsers([]);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchFollowingQuery]);

  // Search users for add member with debounce
  useEffect(() => {
    if (searchTimeoutToAdd) {
      clearTimeout(searchTimeoutToAdd);
    }

    if (searchAddMemberQuery.trim().length >= 2) {
      const timeout = setTimeout(async () => {
        setLoadingSearchToAdd(true);
        try {
          const response = await userApi.searchUsers(searchAddMemberQuery.trim(), 0, 20);
          // Filter out current user, already selected users, and existing participants
          const existingParticipantIds = selectedConversation?.participants.map(p => p.userId) || [];
          const filtered = response.content.filter(
            (u) => u.userId !== user?.id && 
                   !selectedUsersToAdd.includes(u.userId) &&
                   !existingParticipantIds.includes(u.userId)
          );
          setSearchedUsersToAdd(filtered);
        } catch (error) {
          console.error('Error searching users:', error);
          setSearchedUsersToAdd([]);
        } finally {
          setLoadingSearchToAdd(false);
        }
      }, 500); // Debounce 500ms

      setSearchTimeoutToAdd(timeout);
    } else {
      setSearchedUsersToAdd([]);
    }

    return () => {
      if (searchTimeoutToAdd) {
        clearTimeout(searchTimeoutToAdd);
      }
    };
  }, [searchAddMemberQuery, selectedConversation, user?.id]);

  useEffect(() => {
    if (conversationId) {
      loadConversation(Number(conversationId));
    }
  }, [conversationId]);

  useEffect(() => {
    if (selectedConversation && user?.id) {
      // Reset messages when switching conversation
      setMessages([]);
      setCurrentPage(0);
      setHasMore(true);
      initialLoadRef.current = true;
      fetchMessages(selectedConversation.id, 0, true);
      
      // Subscribe to WebSocket for this conversation
      if (isConnected) {
        messageWebSocketService.subscribeToConversation(
          selectedConversation.id,
          (newMessage: MessageResponse) => {
            setMessages((prev) => {
              // Check if message already exists by ID (tránh duplicate)
              const existingMessage = prev.find((m) => m.id === newMessage.id);
              if (existingMessage) {
                return prev; // Message đã tồn tại, không thêm lại
              }
              
              // Check duplicate by content + sender + time (trong vòng 2 giây)
              // Tránh trường hợp WebSocket gửi 2 lần
              const messageTime = new Date(newMessage.createdAt).getTime();
              const duplicate = prev.find((m) => {
                const mTime = new Date(m.createdAt).getTime();
                const timeDiff = Math.abs(messageTime - mTime);
                return (
                  m.senderId === newMessage.senderId &&
                  m.content === newMessage.content &&
                  m.imageUrl === newMessage.imageUrl &&
                  timeDiff < 2000 // Trong vòng 2 giây
                );
              });
              
              if (duplicate) {
                // Nếu có duplicate, replace message cũ bằng message mới (có ID thật)
                return prev.map((m) => 
                  m.id === duplicate.id ? newMessage : m
                );
              }
              
              // Thêm message mới
              return [...prev, newMessage];
            });
            
            // Update conversation last message
            setConversations((prev) =>
              prev.map((c) =>
                c.id === selectedConversation.id
                  ? { ...c, lastMessage: newMessage, updatedAt: newMessage.createdAt }
                  : c
              )
            );
          }
        );
        
        // Join conversation
        messageWebSocketService.joinConversation(selectedConversation.id, user.id);
      }
    }

    return () => {
      if (selectedConversation) {
        messageWebSocketService.unsubscribeFromConversation(selectedConversation.id);
      }
    };
  }, [selectedConversation, isConnected, user?.id]);

  // KHÔNG tự động scroll khi load messages - để user tự scroll
  // useEffect(() => {
  //   if (initialLoadRef.current && messages.length > 0) {
  //     scrollToBottom();
  //     initialLoadRef.current = false;
  //   }
  // }, [messages]);

  // Handle scroll to load more messages
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop === 0 && hasMore && !loadingMore && selectedConversation) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore, selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await conversationApi.getConversations();
      setConversations(data);
      
      if (conversationId) {
        const conv = data.find((c) => c.id === Number(conversationId));
        if (conv) {
          setSelectedConversation(conv);
        }
      }
    } catch (error: any) {
      toast.error('Error loading messages');
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id: number) => {
    try {
      const conv = await conversationApi.getConversationById(id);
      setSelectedConversation(conv);
      
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = conv;
          return updated;
        }
        return [conv, ...prev];
      });
    } catch (error: any) {
      toast.error('Error loading conversation');
    }
  };

  const fetchMessages = async (convId: number, page: number = 0, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // Load tất cả tin nhắn ban đầu (size lớn), sau đó load thêm khi scroll
      const size = reset ? 1000 : 20; // Load 1000 tin nhắn đầu tiên, sau đó 20 mỗi lần
      
      // Sort DESC để lấy tin nhắn mới nhất trước (page 0 = tin nhắn mới nhất)
      const response = await messageApi.getMessages(convId, {
        page,
        size,
        sortBy: 'createdAt',
        sortDir: 'DESC', // Lấy tin nhắn mới nhất trước
      });
      
      // Reverse để hiển thị từ cũ đến mới (tin nhắn cũ ở trên, mới ở dưới)
      const newMessages = [...response.content].reverse();
      
      if (reset) {
        setMessages(newMessages);
        // Kiểm tra xem còn tin nhắn cũ hơn không (tức là còn page tiếp theo)
        // Với DESC, page 0 là mới nhất, nếu totalPages > 1 thì còn tin nhắn cũ hơn
        setHasMore(response.totalPages > 1);
        setCurrentPage(0);
      } else {
        // Khi load thêm, thêm vào đầu danh sách (tin nhắn cũ hơn)
        setMessages((prev) => [...newMessages, ...prev]);
        // Nếu load được đủ 20 tin nhắn và còn page tiếp theo thì còn tin nhắn cũ hơn
        setHasMore(response.content.length === 20 && response.number < response.totalPages - 1);
        setCurrentPage(page);
      }
    } catch (error: any) {
      toast.error('Error loading messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedConversation || loadingMore || !hasMore) return;
    // Load page tiếp theo (tin nhắn cũ hơn)
    // Với DESC sort, page 0 là mới nhất, page 1 là cũ hơn, page 2 cũ hơn nữa...
    await fetchMessages(selectedConversation.id, currentPage + 1, false);
  };

  const handleSendMessage = async (content?: string, imageUrl?: string) => {
    if (!selectedConversation || sending) return;
    
    // Nếu chỉ có imageUrl mà không có content, chỉ gửi image
    const textContent = imageUrl ? (content || '') : (content || messageContent.trim());
    if (!textContent && !imageUrl) return;

    try {
      setSending(true);
      
      if (isConnected && user?.id) {
        // Send via WebSocket - message sẽ được thêm tự động qua WebSocket subscription
        messageWebSocketService.sendMessage(
          selectedConversation.id,
          user.id,
          textContent || undefined,
          imageUrl || undefined
        );
        
        // Scroll to bottom sau khi gửi tin nhắn
        scrollToBottom();
        
        // Không thêm optimistic message để tránh duplicate
        // Message sẽ được thêm tự động khi nhận từ WebSocket
      } else {
        // Fallback to REST API
        const newMessage = await messageApi.sendMessage(selectedConversation.id, {
          content: textContent || undefined,
          messageType: imageUrl ? 'IMAGE' : 'TEXT',
          imageUrl: imageUrl || undefined,
        });
        
        setMessages((prev) => [...prev, newMessage]);
        
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id
              ? { ...c, lastMessage: newMessage, updatedAt: newMessage.createdAt }
              : c
          )
        );
        
        // Scroll to bottom sau khi gửi tin nhắn
        scrollToBottom();
      }
      
      setMessageContent('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error sending message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    // Check if image
    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for files
    
    if (file.size > maxSize) {
      toast.error(`File quá lớn. Tối đa ${isImage ? '5MB' : '10MB'}`);
      return;
    }

    try {
      setUploading(true);
      
      // Try to upload via file API, fallback to avatar API if file API doesn't exist
      let fileUrl: string;
      try {
        const response = isImage 
          ? await fileApi.uploadImage(file)
          : await fileApi.uploadFile(file);
        fileUrl = response.fileUrl;
      } catch (error) {
        // Fallback: use avatar upload endpoint
        const userResponse = await authApi.uploadAvatar(file);
        fileUrl = userResponse.avatar || '';
      }
      
      if (fileUrl) {
        // Nếu là image, chỉ gửi image không có text
        await handleSendMessage(undefined, fileUrl);
      } else {
        toast.error('Không thể upload file');
      }
    } catch (error: any) {
      toast.error('Error uploading file');
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!selectedConversation || deletingMessageId === messageId) return;
    
    if (!window.confirm('Are you sure you want to recall this message?')) {
      return;
    }

    try {
      setDeletingMessageId(messageId);
      await messageApi.deleteMessage(selectedConversation.id, messageId);
      
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: 'Message recalled' } : m
        )
      );
      
      toast.success('Message recalled');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error recalling message');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error('Please enter group name and select at least 1 member');
      return;
    }

    try {
      const request: CreateConversationRequest = {
        type: 'GROUP',
        name: groupName.trim(),
        participantIds: selectedUsers,
      };
      
      const newConversation = await conversationApi.createConversation(request);
      setConversations((prev) => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
      setShowCreateGroup(false);
      setGroupName('');
      setSelectedUsers([]);
      setShowUserList(false);
      setSearchFollowingQuery('');
      setSearchedUsers([]);
      navigate(`/messages/${newConversation.id}`);
      toast.success('Group chat created');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error creating group');
    }
  };

  const handleAddMembers = async () => {
    if (!selectedConversation || selectedUsersToAdd.length === 0) {
      toast.error('Please select at least 1 member');
      return;
    }

    try {
      setAddingMembers(true);
      const updatedConversation = await conversationApi.addMember(selectedConversation.id, {
        userIds: selectedUsersToAdd,
      });
      
      // Update selected conversation and conversations list
      setSelectedConversation(updatedConversation);
      setConversations((prev) =>
        prev.map((c) => (c.id === updatedConversation.id ? updatedConversation : c))
      );
      
      setShowAddMember(false);
      setSelectedUsersToAdd([]);
      setShowUserListToAdd(false);
      setSearchAddMemberQuery('');
      setSearchedUsersToAdd([]);
      
      // Reload messages to show system messages
      setTimeout(() => {
        fetchMessages(selectedConversation.id, 0, true);
      }, 500);
      
      toast.success(`Added ${selectedUsersToAdd.length} members to group`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error adding members');
    } finally {
      setAddingMembers(false);
    }
  };

  // Check if current user is the creator of the selected conversation
  const isCurrentUserCreator = useMemo(() => {
    if (!selectedConversation || !user?.id) return false;
    return selectedConversation.createdById === user.id;
  }, [selectedConversation, user?.id]);

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedConversation || removingMemberId === memberId) return;
    
    if (!window.confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    try {
      setRemovingMemberId(memberId);
      await conversationApi.removeMember(selectedConversation.id, memberId);
      
      // Reload conversation to get updated participant list
      const updatedConversation = await conversationApi.getConversationById(selectedConversation.id);
      setSelectedConversation(updatedConversation);
      setConversations((prev) =>
        prev.map((c) => (c.id === updatedConversation.id ? updatedConversation : c))
      );
      
      // Reload messages to show system message
      fetchMessages(selectedConversation.id, 0, true);
      
      toast.success('Member removed from group');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error removing member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedConversation || leavingGroup) return;
    
    // Kiểm tra nếu là ADMIN, phải mở modal chọn admin mới
    const currentParticipant = selectedConversation.participants.find(
      (p) => p.userId === user?.id
    );
    
    if (currentParticipant?.role === 'ADMIN') {
      // Mở modal chọn admin mới
      setShowLeaveGroupModal(true);
      return;
    }
    
    // Nếu không phải ADMIN, rời nhóm bình thường
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }

    try {
      setLeavingGroup(true);
      await conversationApi.leaveGroup(selectedConversation.id);
      
      // Navigate away from conversation
      navigate('/messages');
      setSelectedConversation(null);
      
      // Refresh conversations list
      fetchConversations();
      
      toast.success('Left group');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error leaving group');
    } finally {
      setLeavingGroup(false);
    }
  };

  const handleConfirmLeaveGroup = async () => {
    if (!selectedConversation || leavingGroup) return;
    
    // Nếu là ADMIN, phải chọn admin mới
    const currentParticipant = selectedConversation.participants.find(
      (p) => p.userId === user?.id
    );
    
    if (currentParticipant?.role === 'ADMIN' && !selectedNewAdminId) {
      toast.error('Please select a member as the new group admin');
      return;
    }

    try {
      setLeavingGroup(true);
      await conversationApi.leaveGroup(selectedConversation.id, selectedNewAdminId || undefined);
      
      // Navigate away from conversation
      navigate('/messages');
      setSelectedConversation(null);
      
      // Refresh conversations list
      fetchConversations();
      
      toast.success('Đã rời nhóm');
      setShowLeaveGroupModal(false);
      setSelectedNewAdminId(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi rời nhóm');
    } finally {
      setLeavingGroup(false);
    }
  };

  const handleTransferAdmin = async (newAdminId: number) => {
    if (!selectedConversation || transferringAdminId === newAdminId) return;
    
    if (!window.confirm('Are you sure you want to appoint this person as group admin? You will become a regular member.')) {
      return;
    }

    try {
      setTransferringAdminId(newAdminId);
      const updatedConversation = await conversationApi.transferAdmin(selectedConversation.id, {
        newAdminId,
      });
      
      setSelectedConversation(updatedConversation);
      setConversations((prev) =>
        prev.map((c) => (c.id === updatedConversation.id ? updatedConversation : c))
      );
      
      // Reload messages to show system message
      setTimeout(() => {
        fetchMessages(selectedConversation.id, 0, true);
      }, 500);
      
      toast.success('Đã bổ nhiệm trưởng nhóm mới');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi bổ nhiệm trưởng nhóm');
    } finally {
      setTransferringAdminId(null);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getOtherUser = (conversation: ConversationResponse) => {
    if (conversation.type === 'DIRECT' && conversation.participants) {
      return conversation.participants.find((p) => p.userId !== user?.id);
    }
    return null;
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
      
      return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    } catch {
      return dateString;
    }
  };

  const extractDiscussPostPreview = (content?: string) => {
    if (!content) return null;

    const markdownMatch = content.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+\/discuss\/(\d+))\)/i);
    if (markdownMatch) {
      return {
        title: markdownMatch[1].trim(),
        url: markdownMatch[2],
        postId: Number(markdownMatch[3]),
        matchedToken: markdownMatch[0],
      };
    }

    const fullUrlMatch = content.match(/(https?:\/\/[^\s]+\/discuss\/(\d+))/i);
    if (fullUrlMatch) {
      return {
        title: `Post #${fullUrlMatch[2]}`,
        url: fullUrlMatch[1],
        postId: Number(fullUrlMatch[2]),
        matchedToken: fullUrlMatch[1],
      };
    }

    const relativeMatch = content.match(/(\/discuss\/(\d+))/i);
    if (relativeMatch) {
      return {
        title: `Post #${relativeMatch[2]}`,
        url: `${window.location.origin}${relativeMatch[1]}`,
        postId: Number(relativeMatch[2]),
        matchedToken: relativeMatch[1],
      };
    }

    return null;
  };

  const stripPreviewToken = (content: string, token?: string) => {
    if (!token) return content;
    return content.replace(token, '').replace(/\n{3,}/g, '\n\n').trim();
  };

  const getPreviewImage = (postPreview?: PostDetailResponse | null) => {
    if (!postPreview) return null;
    if (postPreview.images && postPreview.images.length > 0) {
      return postPreview.images[0];
    }
    return postPreview.imageUrl || null;
  };

  useEffect(() => {
    const postIds = new Set<number>();
    messages.forEach((message) => {
      const preview = extractDiscussPostPreview(message.content || undefined);
      if (preview?.postId) {
        postIds.add(preview.postId);
      }
    });

    const missingIds = Array.from(postIds).filter((id) => sharedPostPreviews[id] === undefined);
    if (missingIds.length === 0) return;

    let cancelled = false;

    const fetchPostPreviews = async () => {
      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const detail = await postApi.getPostById(id);
            return [id, detail] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );

      if (cancelled) return;

      setSharedPostPreviews((prev) => {
        const next = { ...prev };
        results.forEach(([id, detail]) => {
          next[id] = detail;
        });
        return next;
      });
    };

    fetchPostPreviews();

    return () => {
      cancelled = true;
    };
  }, [messages, sharedPostPreviews]);

  const sortedConversations = useMemo(() => {
    let filtered = [...conversations];
    
    // Filter by tab
    if (filterTab === 'unread') {
      filtered = filtered.filter(c => c.unreadCount > 0);
    } else if (filterTab === 'groups') {
      filtered = filtered.filter(c => c.type === 'GROUP');
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(conversation => {
        const otherUser = getOtherUser(conversation);
        const displayName = conversation.type === 'DIRECT' && otherUser
          ? otherUser.username
          : conversation.name || 'Group chat';
        return displayName.toLowerCase().includes(query);
      });
    }
    
    // Sort by last message time
    return filtered.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.updatedAt;
      const bTime = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [conversations, filterTab, searchQuery]);

  // Group messages by sender and time, giữ đúng thứ tự thời gian
  const groupedMessages = useMemo(() => {
    const groups: { messages: MessageResponse[]; senderId: number; time: string; isSystem?: boolean }[] = [];
    
    messages.forEach((message) => {
      const isSystemMessage = message.messageType === 'SYSTEM';
      const lastGroup = groups[groups.length - 1];
      const messageTime = new Date(message.createdAt);
      
      // System messages luôn tạo group riêng, không group với tin nhắn khác
      if (isSystemMessage) {
        groups.push({
          messages: [message],
          senderId: message.senderId || 0,
          time: message.createdAt,
          isSystem: true,
        });
      } else {
        // Regular messages: group với tin nhắn trước đó nếu cùng sender và trong 5 phút
        const timeDiff = lastGroup && !lastGroup.isSystem
          ? Math.abs(messageTime.getTime() - new Date(lastGroup.time).getTime()) / (1000 * 60)
          : Infinity;
        
        if (lastGroup && !lastGroup.isSystem && lastGroup.senderId === message.senderId && timeDiff < 5) {
          lastGroup.messages.push(message);
        } else {
          groups.push({
            messages: [message],
            senderId: message.senderId,
            time: message.createdAt,
            isSystem: false,
          });
        }
      }
    });
    
    return groups;
  }, [messages]);

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 4rem)', position: 'relative' }}>
      {/* Sidebar - Danh sách conversations */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Chats</h2>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Create group chat"
            >
              <FiPlus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search on Messenger"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>
        
        {/* Filter tabs */}
        <div className="flex border-b border-gray-200 px-4">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              filterTab === 'all'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
            {filterTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setFilterTab('unread')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              filterTab === 'unread'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread
            {filterTab === 'unread' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setFilterTab('groups')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              filterTab === 'groups'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Groups
            {filterTab === 'groups' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : sortedConversations.length > 0 ? (
            sortedConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const displayName = conversation.type === 'DIRECT' && otherUser
                ? otherUser.username
                : conversation.name || 'Group chat';
              const displayAvatar = conversation.type === 'DIRECT' && otherUser
                ? otherUser.avatar
                : conversation.avatar;
              const isSelected = selectedConversation?.id === conversation.id;
              const lastMessage = conversation.lastMessage;
              const preview = lastMessage?.isDeleted 
                ? 'Message recalled'
                : lastMessage?.imageUrl 
                  ? '📷 Image'
                  : lastMessage?.content || 'No message';

              return (
                <div
                  key={conversation.id}
                  onClick={() => {
                    navigate(`/messages/${conversation.id}`);
                    setSelectedConversation(conversation);
                  }}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="relative mr-3 flex-shrink-0">
                      <Avatar
                        src={displayAvatar || undefined}
                        alt={displayName}
                        size="md"
                      />
                      {conversation.type === 'DIRECT' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {displayName}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 flex-shrink-0 h-5 w-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {preview}
                      </p>
                      {lastMessage && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(lastMessage.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              <FiMessageSquare className="mx-auto mb-2 text-4xl text-gray-300" />
              <p>No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
              {(() => {
                const otherUser = getOtherUser(selectedConversation);
                const displayName = selectedConversation.type === 'DIRECT' && otherUser
                  ? otherUser.username
                  : selectedConversation.name || 'Nhóm chat';
                const displayAvatar = selectedConversation.type === 'DIRECT' && otherUser
                  ? otherUser.avatar
                  : selectedConversation.avatar;

                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative mr-3">
                        <Avatar
                          src={displayAvatar || undefined}
                          alt={displayName}
                          size="md"
                        />
                        {selectedConversation.type === 'DIRECT' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{displayName}</h3>
                        {selectedConversation.type === 'DIRECT' && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <p className="text-xs text-green-600 font-medium">Active</p>
                          </div>
                        )}
                        {selectedConversation.type === 'GROUP' && (
                          <p className="text-xs text-gray-500">
                            {selectedConversation.participants.length} members
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isConnected && (
                        <span className="text-xs text-red-500">Disconnected</span>
                      )}
                      {selectedConversation.type === 'GROUP' && (
                        <>
                          <button
                            onClick={() => setShowMembersList(true)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="View members"
                          >
                            <FiUsers className="w-5 h-5 text-gray-600" />
                          </button>
                          {isCurrentUserCreator && (
                            <button
                              onClick={() => setShowAddMember(true)}
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                              title="Add member"
                            >
                              <FiPlus className="w-5 h-5 text-gray-600" />
                            </button>
                          )}
                        </>
                      )}
                      <button className="p-2 hover:bg-gray-100 rounded-full">
                        <FiMoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0"
            >
              {loadingMore && (
                  <div className="text-center py-2 text-sm text-gray-500">
                  Loading more...
                </div>
              )}
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p>Loading messages...</p>
                  </div>
                </div>
              ) : groupedMessages.length > 0 ? (
                groupedMessages.map((group, groupIndex) => {
                  const isOwn = group.senderId === user?.id;
                  const isSystemGroup = group.isSystem || group.messages[0]?.messageType === 'SYSTEM';
                  const showAvatar = !isSystemGroup && (groupIndex === 0 || 
                    (groupIndex > 0 && groupedMessages[groupIndex - 1].senderId !== group.senderId));
                  
                  // System messages: render riêng, không cần avatar - thiết kế đẹp hơn
                  if (isSystemGroup) {
                    return (
                      <div key={`system-${group.time}`} className="w-full my-3">
                        {group.messages.map((message) => (
                          <div key={message.id} className="w-full flex justify-center items-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded-full shadow-sm">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              <p className="text-xs text-gray-600 font-medium text-center">
                                {message.content}
                              </p>
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={`${group.senderId}-${group.time}`}
                      className={`flex items-end gap-2 mb-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {showAvatar && !isOwn && (
                        <Avatar
                          src={group.messages[0].senderAvatar || undefined}
                          alt={group.messages[0].senderName}
                          size="sm"
                          className="mb-1"
                        />
                      )}
                      {!showAvatar && !isOwn && <div className="w-8" />}
                      
                      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`} style={{ maxWidth: '320px' }}>
                        {!isOwn && showAvatar && (
                          <span className="text-xs font-medium text-gray-600 mb-1 px-1">
                            {group.messages[0].senderName}
                          </span>
                        )}
                        
                        {group.messages.map((message) => {
                          const isDeleted = message.isDeleted;
                          const isImageOnly = message.imageUrl && !message.content;
                          const isSystemMessage = message.messageType === 'SYSTEM';
                          const discussPostPreview = !isDeleted ? extractDiscussPostPreview(message.content || '') : null;
                          const linkedPost = discussPostPreview ? sharedPostPreviews[discussPostPreview.postId] : null;
                          const previewImage = getPreviewImage(linkedPost);
                          const plainMessageContent = message.content
                            ? stripPreviewToken(message.content, discussPostPreview?.matchedToken)
                            : '';
                          
                          // System message: hiển thị centered, đẹp hơn với gradient và border
                          if (isSystemMessage) {
                            return (
                              <div key={message.id} className="w-full flex justify-center items-center my-3">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded-full shadow-sm">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <p className="text-xs text-gray-600 font-medium text-center">
                                    {message.content}
                                  </p>
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div
                              key={message.id}
                              className={`relative group mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              <div
                                className={`${isImageOnly ? 'p-0' : 'px-4 py-2'} rounded-2xl ${
                                  isDeleted
                                    ? isOwn
                                      ? 'bg-gray-200 text-gray-500 italic'
                                      : 'bg-gray-100 text-gray-500 italic'
                                    : isOwn
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-white text-gray-900 shadow-sm'
                                }`}
                                style={{ 
                                  maxWidth: message.content && message.content.length < 20 ? 'fit-content' : '280px',
                                  minWidth: '60px',
                                  wordWrap: 'break-word'
                                }}
                              >
                                {message.imageUrl && !isDeleted && (
                                  <img
                                    src={message.imageUrl}
                                    alt="Message"
                                    className={`${isImageOnly ? 'rounded-2xl' : 'rounded-lg mb-2'} cursor-pointer`}
                                    style={{ maxWidth: '250px', width: '100%', height: 'auto' }}
                                    onClick={() => window.open(message.imageUrl!, '_blank')}
                                  />
                                )}
                                
                                {plainMessageContent && !discussPostPreview && (
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {isDeleted ? 'Message recalled' : plainMessageContent}
                                  </p>
                                )}

                                {discussPostPreview && !isDeleted && (
                                  <button
                                    onClick={() => navigate(`/discuss/${discussPostPreview.postId}`)}
                                    className={`mt-2 w-full text-left rounded-2xl border overflow-hidden transition-colors ${
                                      isOwn
                                        ? 'border-blue-300 bg-blue-400/20 hover:bg-blue-400/30'
                                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                    }`}
                                  >
                                    {plainMessageContent && (
                                      <div className={`px-3 py-2 text-sm font-semibold line-clamp-2 ${
                                        isOwn
                                          ? 'text-white bg-gradient-to-r from-indigo-600 to-blue-600'
                                          : 'text-white bg-gradient-to-r from-indigo-500 to-violet-500'
                                      }`}>
                                        {plainMessageContent}
                                      </div>
                                    )}

                                    {previewImage && (
                                      <img
                                        src={previewImage}
                                        alt={linkedPost?.title || discussPostPreview.title}
                                        className="w-full h-24 object-cover"
                                      />
                                    )}

                                    <div className={`px-3 py-2 ${isOwn ? 'bg-blue-500/30' : 'bg-white'}`}>
                                      <div className={`text-base font-bold leading-6 line-clamp-2 ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                                        {linkedPost?.title || discussPostPreview.title}
                                      </div>
                                      <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                        CodeSphere Discuss
                                      </div>
                                    </div>
                                  </button>
                                )}
                                
                                {!isImageOnly && (
                                  <div className={`flex items-center justify-end mt-1 gap-1 ${
                                    isOwn ? 'text-blue-100' : 'text-gray-400'
                                  }`}>
                                    <span className="text-xs">
                                      {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
                                    </span>
                                    {isOwn && !isDeleted && (
                                      <FiCheckCircle className="w-3 h-3" />
                                    )}
                                  </div>
                                )}
                                {isImageOnly && (
                                  <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg backdrop-blur-sm ${
                                    isOwn ? 'bg-black/30 text-white' : 'bg-white/80 text-gray-700'
                                  }`}>
                                    <span className="text-xs">
                                      {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {isOwn && !isDeleted && (
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-opacity"
                                  disabled={deletingMessageId === message.id}
                                >
                                  <FiTrash2 className="w-4 h-4 text-gray-500" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <FiMessageSquare className="text-4xl text-gray-400" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">+</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No messages yet
                    </h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                      Start the conversation by sending the first message
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                  title="Send image"
                >
                  <FiImage className="w-5 h-5 text-gray-600" />
                </button>
                
                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                  type="submit"
                  disabled={(!messageContent.trim() && !uploading) || sending}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending || uploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSend className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FiMessageSquare className="mx-auto mb-4 text-6xl text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">Choose from the list on the left to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Create group chat</h3>
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setGroupName('');
                  setSelectedUsers([]);
                  setShowUserList(false);
                  setSearchFollowingQuery('');
                  setSearchedUsers([]);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Members ({selectedUsers.length})
              </label>
              <button
                onClick={() => setShowUserList(!showUserList)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <span>Select members...</span>
                <span className="text-gray-400">{showUserList ? '▲' : '▼'}</span>
              </button>
              {showUserList && (
                <div className="mt-2 border border-gray-300 rounded-lg max-h-96 overflow-hidden flex flex-col">
                  {/* Search bar */}
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchFollowingQuery}
                        onChange={(e) => setSearchFollowingQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                  
                  {/* User list */}
                  <div className="overflow-y-auto max-h-80">
                    {/* Suggested users (following) - only show when search is empty */}
                    {searchFollowingQuery.trim().length < 2 && (
                      <>
                        {loadingFollowing ? (
                          <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
                        ) : followingUsers.length > 0 ? (
                          <>
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                              <p className="text-xs font-semibold text-gray-600">Đề xuất (Đang theo dõi)</p>
                            </div>
                            {followingUsers
                              .filter(user => !selectedUsers.includes(user.userId))
                              .map((user) => {
                                const isSelected = selectedUsers.includes(user.userId);
                                return (
                                  <div
                                    key={user.userId}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedUsers(selectedUsers.filter(id => id !== user.userId));
                                      } else {
                                        setSelectedUsers([...selectedUsers, user.userId]);
                                      }
                                    }}
                                    className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                      isSelected ? 'bg-blue-50' : ''
                                    }`}
                                  >
                                    <Avatar
                                      src={user.avatar || undefined}
                                      alt={user.username}
                                      size="sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {user.username}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <FiCheckCircle className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </>
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            <p>Bạn chưa theo dõi ai</p>
                            <p className="text-xs mt-1">Tìm kiếm để thêm thành viên vào nhóm</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Search results */}
                    {searchFollowingQuery.trim().length >= 2 && (
                      <>
                        {loadingSearch ? (
                          <div className="p-4 text-center text-sm text-gray-500">Đang tìm kiếm...</div>
                        ) : searchedUsers.length > 0 ? (
                          <>
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                              <p className="text-xs font-semibold text-gray-600">Kết quả tìm kiếm</p>
                            </div>
                            {searchedUsers.map((user) => {
                              const isSelected = selectedUsers.includes(user.userId);
                              const isFollowing = followingUsers.some(f => f.userId === user.userId);
                              return (
                                <div
                                  key={user.userId}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedUsers(selectedUsers.filter(id => id !== user.userId));
                                    } else {
                                      setSelectedUsers([...selectedUsers, user.userId]);
                                    }
                                  }}
                                  className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                    isSelected ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <Avatar
                                    src={user.avatar || undefined}
                                    alt={user.username}
                                    size="sm"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {user.username}
                                    </p>
                                    {isFollowing && (
                                      <p className="text-xs text-blue-600">Đang theo dõi</p>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                      <FiCheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            Không tìm thấy người dùng
                          </div>
                        )}
                      </>
                    )}

                    {/* Selected users summary */}
                    {selectedUsers.length > 0 && (
                      <div className="px-3 py-2 bg-blue-50 border-t border-gray-200">
                        <p className="text-xs font-semibold text-blue-600">
                          Selected: {selectedUsers.length} members
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setGroupName('');
                  setSelectedUsers([]);
                  setShowUserList(false);
                  setSearchFollowingQuery('');
                  setSearchedUsers([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Add member</h3>
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setSelectedUsersToAdd([]);
                  setShowUserListToAdd(false);
                  setSearchAddMemberQuery('');
                  setSearchedUsersToAdd([]);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thành viên ({selectedUsersToAdd.length})
              </label>
              <button
                onClick={() => setShowUserListToAdd(!showUserListToAdd)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <span>Select members...</span>
                <span className="text-gray-400">{showUserListToAdd ? '▲' : '▼'}</span>
              </button>
              {showUserListToAdd && (
                <div className="mt-2 border border-gray-300 rounded-lg max-h-96 overflow-hidden flex flex-col">
                  {/* Search bar */}
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchAddMemberQuery}
                        onChange={(e) => setSearchAddMemberQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                  
                  {/* User list */}
                  <div className="overflow-y-auto max-h-80">
                    {/* Suggested users (following) - only show when search is empty */}
                    {searchAddMemberQuery.trim().length < 2 && (
                      <>
                        {loadingFollowing ? (
                          <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
                        ) : followingUsers.length > 0 ? (
                          <>
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                              <p className="text-xs font-semibold text-gray-600">Đề xuất (Đang theo dõi)</p>
                            </div>
                            {followingUsers
                              .filter(followUser => {
                                const existingParticipantIds = selectedConversation?.participants.map(p => p.userId) || [];
                                return followUser.userId !== user?.id && 
                                       !selectedUsersToAdd.includes(followUser.userId) &&
                                       !existingParticipantIds.includes(followUser.userId);
                              })
                              .map((user) => {
                                const isSelected = selectedUsersToAdd.includes(user.userId);
                                return (
                                  <div
                                    key={user.userId}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedUsersToAdd(selectedUsersToAdd.filter(id => id !== user.userId));
                                      } else {
                                        setSelectedUsersToAdd([...selectedUsersToAdd, user.userId]);
                                      }
                                    }}
                                    className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                      isSelected ? 'bg-blue-50' : ''
                                    }`}
                                  >
                                    <Avatar
                                      src={user.avatar || undefined}
                                      alt={user.username}
                                      size="sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {user.username}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <FiCheckCircle className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </>
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            <p>You are not following anyone</p>
                            <p className="text-xs mt-1">Search to add members to the group</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Search results */}
                    {searchAddMemberQuery.trim().length >= 2 && (
                      <>
                        {loadingSearchToAdd ? (
                          <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                        ) : searchedUsersToAdd.length > 0 ? (
                          <>
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                              <p className="text-xs font-semibold text-gray-600">Search results</p>
                            </div>
                            {searchedUsersToAdd.map((user) => {
                              const isSelected = selectedUsersToAdd.includes(user.userId);
                              const isFollowing = followingUsers.some(f => f.userId === user.userId);
                              return (
                                <div
                                  key={user.userId}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedUsersToAdd(selectedUsersToAdd.filter(id => id !== user.userId));
                                    } else {
                                      setSelectedUsersToAdd([...selectedUsersToAdd, user.userId]);
                                    }
                                  }}
                                  className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                    isSelected ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <Avatar
                                    src={user.avatar || undefined}
                                    alt={user.username}
                                    size="sm"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {user.username}
                                    </p>
                                    {isFollowing && (
                                      <p className="text-xs text-blue-600">Following</p>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                      <FiCheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No users found
                          </div>
                        )}
                      </>
                    )}

                    {/* Selected users summary */}
                    {selectedUsersToAdd.length > 0 && (
                      <div className="px-3 py-2 bg-blue-50 border-t border-gray-200">
                        <p className="text-xs font-semibold text-blue-600">
                          Selected: {selectedUsersToAdd.length} members
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setSelectedUsersToAdd([]);
                  setShowUserListToAdd(false);
                  setSearchAddMemberQuery('');
                  setSearchedUsersToAdd([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembers}
                disabled={selectedUsersToAdd.length === 0 || addingMembers}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingMembers ? 'Adding...' : 'Add members'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members List Modal */}
      {showMembersList && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Group members</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedConversation.participants.length} members
                </p>
              </div>
              <button
                onClick={() => setShowMembersList(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {selectedConversation.participants.map((participant) => {
                const isCreator = participant.userId === selectedConversation.createdById;
                const isCurrentUser = participant.userId === user?.id;
                const isAdmin = participant.role === 'ADMIN';
                const canRemove = isCurrentUserCreator && !isCreator && !isCurrentUser;
                const canTransferAdmin = isCurrentUserCreator && !isAdmin && !isCurrentUser;
                
                return (
                  <div
                    key={participant.userId}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar
                        src={participant.avatar || undefined}
                        alt={participant.username}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {participant.username}
                          </p>
                          {(isCreator || isAdmin) && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                              Group admin
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                              Bạn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Tham gia {formatDistanceToNow(new Date(participant.joinedAt), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {canTransferAdmin && (
                        <button
                          onClick={() => handleTransferAdmin(participant.userId)}
                          disabled={transferringAdminId === participant.userId}
                          className="p-2 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                          title="Appoint as group admin"
                        >
                          {transferringAdminId === participant.userId ? (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiUserPlus className="w-4 h-4 text-blue-500" />
                          )}
                        </button>
                      )}
                      {canRemove && (
                        <button
                          onClick={() => handleRemoveMember(participant.userId)}
                          disabled={removingMemberId === participant.userId}
                          className="p-2 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                          title="Remove member"
                        >
                          {removingMemberId === participant.userId ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiTrash2 className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              {selectedConversation.type === 'GROUP' && (
                <button
                  onClick={handleLeaveGroup}
                  disabled={leavingGroup}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {leavingGroup ? 'Leaving group...' : 'Leave group'}
                </button>
              )}
              <button
                onClick={() => setShowMembersList(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group Modal - Chọn admin mới khi ADMIN rời nhóm */}
      {showLeaveGroupModal && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Leave group</h3>
              <button
                onClick={() => {
                  setShowLeaveGroupModal(false);
                  setSelectedNewAdminId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              You are the group admin. Please select another member as group admin before leaving.
            </p>

            <div className="max-h-64 overflow-y-auto mb-4">
              {selectedConversation.participants
                .filter((p) => p.userId !== user?.id && p.role === 'MEMBER')
                .map((participant) => (
                  <div
                    key={participant.userId}
                    onClick={() => setSelectedNewAdminId(participant.userId)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedNewAdminId === participant.userId
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <Avatar
                      src={participant.avatar || undefined}
                      alt={participant.username}
                      size="md"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {participant.username}
                      </p>
                    </div>
                    {selectedNewAdminId === participant.userId && (
                      <FiCheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                ))}
            </div>

            {selectedConversation.participants.filter((p) => p.userId !== user?.id && p.role === 'MEMBER').length === 0 && (
              <p className="text-sm text-red-600 mb-4">
                No members available to appoint as group admin.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowLeaveGroupModal(false);
                  setSelectedNewAdminId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeaveGroup}
                disabled={!selectedNewAdminId || leavingGroup}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {leavingGroup ? 'Leaving group...' : 'Confirm leave group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
