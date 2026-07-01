import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { notificationApi, type NotificationResponse } from '@/apis/notification.api';
import MainLayout from '@/components/Layout/MainLayout';
import Container from '@/components/Layout/Container';
import Avatar from '@/components/Avatar';
import { FiBell, FiCheck, FiCheckCircle, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading';

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user, currentPage]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getNotifications({
        page: currentPage,
        size: 20,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      });
      setNotifications(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
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
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Unable to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkAsRead = async (notification: NotificationResponse) => {
    if (notification.isRead) return;

    try {
      await notificationApi.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Unable to mark as read');
    }
  };

  const handleNotificationClick = async (notification: NotificationResponse) => {
    await handleMarkAsRead(notification);

    // Navigate based on notification type
    if (notification.relatedConversationId) {
      navigate(`/messages/${notification.relatedConversationId}`);
    } else if (notification.relatedPostId) {
      navigate(`/discuss/${notification.relatedPostId}`);
    } else if (notification.relatedUserId) {
      navigate(`/users/${notification.relatedUserId}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Unable to delete notification');
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

  if (!user) {
    return (
      <MainLayout>
        <Container>
          <div className="text-center py-12 text-gray-500">
            <p>Please log in to view notifications</p>
          </div>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container>
        <div className="max-w-4xl mx-auto py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiBell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-500">
                      {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiCheckCircle className="w-4 h-4" />
                {markingAll ? 'Marking...' : 'Mark all as read'}
              </button>
            )}
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      {notification.relatedUserAvatar ? (
                        <Avatar
                          src={notification.relatedUserAvatar}
                          alt={notification.relatedUserName || ''}
                          size="md"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shadow-sm">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                      {!notification.isRead && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-gray-900 leading-snug">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiBell size={32} className="text-gray-300" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</p>
              <p className="text-sm text-gray-500">You'll see notifications here when you receive them</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Container>
    </MainLayout>
  );
};

export default NotificationsPage;

