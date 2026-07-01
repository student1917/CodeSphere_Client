import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { notificationApi, type NotificationResponse } from '@/apis/notification.api';
import { websocketService } from '@/services/websocket.service';
import { FiBell, FiCheck, FiMoreHorizontal, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Avatar from '@/components/Avatar';
import toast from 'react-hot-toast';
import Tooltip from './Tooltip';

const NotificationDropdown = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = location.pathname === ROUTES.NOTIFICATIONS || location.pathname.startsWith(ROUTES.NOTIFICATIONS + '/');

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchNotifications();
      connectWebSocket();
    } else {
      // Disconnect when user logs out
      websocketService.disconnect();
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      // Only disconnect on unmount, not on user change
      if (!user) {
        websocketService.disconnect();
      }
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const connectWebSocket = () => {
    if (!user?.id) {
      console.log('Cannot connect WebSocket: user not found');
      return;
    }

    console.log('Connecting WebSocket for user:', user.id);
    websocketService.connect(
      user.id.toString(),
      () => {
        console.log('WebSocket connected, subscribing to notifications...');
        // Subscribe to notifications - Spring uses /user/{userId}/queue/notifications
        const destination = `/user/${user.id}/queue/notifications`;
        const subscriptionId = websocketService.subscribe(destination, (notification: NotificationResponse) => {
          console.log('Received notification via WebSocket:', notification);
          // Add new notification to the list
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          
          // Refresh unread count
          fetchUnreadCount();
          
          // Show toast notification
          toast.success(`${notification.title}: ${notification.content}`, {
            duration: 5000,
          });
        });
        
        if (subscriptionId) {
          console.log('Subscribed to notifications:', destination);
        } else {
          console.error('Failed to subscribe to notifications');
        }
      },
      (error) => {
        console.error('WebSocket connection error:', error);
      }
    );
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch cả read và unread để hiển thị đầy đủ
      const response = await notificationApi.getNotifications({
        page: 0,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'DESC',
        // Không filter isRead để lấy cả read và unread
      });
      setNotifications(response.content);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationResponse) => {
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    // Ưu tiên kiểm tra conversationId trước (cho MESSAGE notification)
    if (notification.relatedConversationId) {
      navigate(`/messages/${notification.relatedConversationId}`);
    } else if (notification.relatedPostId) {
      navigate(`/discuss/${notification.relatedPostId}`);
    } else if (notification.relatedUserId) {
      navigate(`/users/${notification.relatedUserId}`);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await notificationApi.markAllAsRead();
      toast.success('All notifications marked as read');
      // Update all notifications to read
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Unable to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: enUS });
    } catch {
      return dateString;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'FOLLOW':
        return '👤';
      case 'FRIEND_REQUEST':
        return '🤝';
      case 'FRIEND_ACCEPTED':
        return '✅';
      case 'POST_LIKE':
        return '❤️';
      case 'POST_COMMENT':
      case 'COMMENT_REPLY':
        return '💬';
      case 'MESSAGE':
        return '📨';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Tooltip text="Notifications">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-50 border border-transparent ${
            isActive
              ? 'text-blue-600 bg-blue-50 border-blue-100'
              : 'text-slate-500 hover:text-slate-900 hover:border-slate-200'
          }`}
        >
          <FiBell className={`w-6 h-6 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'fill-blue-600/10' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm shadow-rose-500/30">
              {unreadCount}
            </span>
          )}
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl z-50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-900">Notifications</h3>
              <Link
                to={ROUTES.NOTIFICATIONS}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                View all
              </Link>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiCheckCircle className="w-3.5 h-3.5" />
                {markingAll ? 'Marking...' : 'Mark all as read'}
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Loading...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      {notification.relatedUserAvatar ? (
                        <Avatar
                          src={notification.relatedUserAvatar}
                          alt={notification.relatedUserName || ''}
                          size="sm"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg shadow-sm">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                      {!notification.isRead && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 leading-snug">{notification.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.content}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{formatTime(notification.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiBell size={24} className="opacity-20" />
                </div>
                <p className="text-sm">No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
