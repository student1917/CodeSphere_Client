import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMessageSquare } from 'react-icons/fi';
import Avatar from '@/components/Avatar';
import { ROUTES } from '@/utils/constants';
import { conversationApi } from '@/apis/conversation.api';
import type { ConversationResponse } from '@/types/conversation.types';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Tooltip from './Tooltip';

const MessengerDropdown = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = location.pathname === ROUTES.MESSAGES || location.pathname.startsWith(ROUTES.MESSAGES + '/');

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await conversationApi.getConversations();
      setConversations(data);
      const totalUnread = data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast.error('Error loading messages');
    } finally {
      setLoading(false);
    }
  };

  const getOtherUser = (conversation: ConversationResponse) => {
    if (conversation.type === 'DIRECT' && conversation.participants) {
      return conversation.participants.find((p) => p.userId !== user?.id);
    }
    return null;
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: enUS });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Tooltip text="Messages">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-50 border border-transparent ${
            isActive
              ? 'text-blue-600 bg-blue-50 border-blue-100'
              : 'text-slate-500 hover:text-slate-900 hover:border-slate-200'
          }`}
        >
          <FiMessageSquare className={`w-6 h-6 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'fill-blue-600/10' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm shadow-blue-600/30">
              {unreadCount}
            </span>
          )}
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl z-50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Messages</h3>
            <Link
              to={ROUTES.MESSAGES}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
              onClick={() => setIsOpen(false)}
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Loading...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiMessageSquare size={24} className="opacity-20" />
                </div>
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              conversations.slice(0, 5).map((conversation) => {
                const otherUser = getOtherUser(conversation);
                return (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      navigate(`${ROUTES.MESSAGES}/${conversation.id}`);
                      setIsOpen(false);
                    }}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {conversation.type === 'DIRECT' && otherUser ? (
                        <Avatar
                          user={otherUser}
                          size="sm"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm">
                          {conversation.type === 'GROUP' ? 'G' : '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[13px] font-bold text-slate-900 truncate">
                            {conversation.type === 'DIRECT' && otherUser
                              ? otherUser.username
                              : conversation.name || 'Group Chat'}
                          </p>
                          {conversation.lastMessage && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs truncate ${conversation.unreadCount && conversation.unreadCount > 0 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                          {conversation.unreadCount && conversation.unreadCount > 0 && (
                            <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessengerDropdown;

