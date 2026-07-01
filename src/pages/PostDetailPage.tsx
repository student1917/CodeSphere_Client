import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@/components/Layout/Container';
import Avatar from '@/components/Avatar';
import PostCommentList from '@/components/Post/PostCommentList';
import { FiHeart, FiMessageCircle, FiArrowLeft, FiCheckCircle, FiEye, FiX, FiFlag, FiAlertTriangle } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { postApi } from '@/apis/post.api';
import type { PostDetailResponse } from '@/types/post.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { createPortal } from 'react-dom';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

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

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<PostDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReasonCode, setReportReasonCode] = useState(REPORT_REASON_TEMPLATES[0].code);
  const [reportReasonDetail, setReportReasonDetail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const postData = await postApi.getPostById(Number(id));
      setPost(postData);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tải bài viết');
      navigate('/discuss');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post || isVoting) return;

    setIsVoting(true);
    try {
      // Nếu đã like thì unlike (vote = 0), nếu chưa like thì like (vote = 1)
      const voteType = post.userVote === 1 ? 0 : 1;
      const response = await postApi.votePost(post.id, voteType);
      setPost({
        ...post,
        totalVotes: response.totalVotes,
        upvotes: response.upvotes,
        downvotes: response.downvotes,
        userVote: response.userVote,
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi like');
    } finally {
      setIsVoting(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch {
      return dateString;
    }
  };

  const handleOpenReportModal = () => {
    if (!user) {
      toast.error('Vui long dang nhap de bao cao bai viet');
      navigate('/login');
      return;
    }

    setReportReasonCode(REPORT_REASON_TEMPLATES[0].code);
    setReportReasonDetail('');
    setReportModalOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!post || isSubmittingReport) return;
    if (!reportReasonCode.trim()) {
      toast.error('Vui long chon ly do bao cao');
      return;
    }
    if (!reportReasonDetail.trim()) {
      toast.error('Vui long nhap mo ta ly do bao cao');
      return;
    }

    setIsSubmittingReport(true);
    try {
      await postApi.reportPost(post.id, {
        reasonCode: reportReasonCode,
        reasonDetail: reportReasonDetail.trim(),
      });
      toast.success('Da gui bao cao bai viet');
      setReportModalOpen(false);
      setReportReasonDetail('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Khong the gui bao cao luc nay');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <Container>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        </Container>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Back Button */}
        <button
          onClick={() => navigate('/discuss')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Quay lại</span>
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Post Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
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
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {post.isAnonymous ? 'Anonymous User' : post.authorName}
                    </span>
                    {post.isResolved && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                        <FiCheckCircle className="w-3 h-3" />
                        Resolved
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{formatTime(post.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

            {/* Content */}
            <div className="prose max-w-none mb-4" data-color-mode="light">
              <MDEditor.Markdown source={post.content} />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Images */}
            {((post.images && post.images.length > 0) || post.imageUrl) && (
              <div className="mb-6 rounded-lg overflow-hidden">
                {post.images && post.images.length > 0 ? (
                  post.images.length === 1 ? (
                    <img
                      src={post.images[0]}
                      alt="Post image"
                      onClick={() => setSelectedImage(post.images[0])}
                      className="w-full h-auto max-h-[600px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  ) : post.images.length === 2 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {post.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Post image ${idx + 1}`}
                          onClick={() => setSelectedImage(img)}
                          className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      ))}
                    </div>
                  ) : post.images.length === 3 ? (
                    <div className="grid grid-cols-2 gap-1">
                      <img
                        src={post.images[0]}
                        alt="Post image 1"
                        onClick={() => setSelectedImage(post.images[0])}
                        className="w-full h-64 object-cover row-span-2 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <img
                        src={post.images[1]}
                        alt="Post image 2"
                        onClick={() => setSelectedImage(post.images[1])}
                        className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <img
                        src={post.images[2]}
                        alt="Post image 3"
                        onClick={() => setSelectedImage(post.images[2])}
                        className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {post.images.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={img}
                            alt={`Post image ${idx + 1}`}
                            onClick={() => setSelectedImage(img)}
                            className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          />
                          {idx === 3 && post.images.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer" onClick={() => setSelectedImage(post.images[0])}>
                              <span className="text-white text-2xl font-bold">
                                +{post.images.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ) : post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt="Post image"
                    onClick={() => setSelectedImage(post.imageUrl!)}
                    className="w-full h-auto max-h-[600px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ) : null}
              </div>
            )}

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

            {/* Footer - Actions */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleLike}
                disabled={isVoting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  post.userVote === 1
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FiHeart className={`w-5 h-5 ${post.userVote === 1 ? 'fill-current' : ''}`} />
                <span className="font-medium">{post.upvotes || 0}</span>
              </button>

              <div className="flex items-center gap-2 text-gray-600">
                <FiEye className="w-5 h-5" />
                <span className="font-medium">{post.viewCount || 0} lượt xem</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <FiMessageCircle className="w-5 h-5" />
                <span className="font-medium">{post.commentCount || 0} bình luận</span>
              </div>

              {user && user.id !== post.authorId && (
                <button
                  onClick={handleOpenReportModal}
                  className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <FiFlag className="w-4 h-4" />
                  <span className="text-sm font-semibold">Bao cao</span>
                </button>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Bình luận ({post.commentCount || 0})
              </h2>
            </div>
            <div className="p-6">
              <PostCommentList postId={post.id} />
            </div>
          </div>
        </div>

        {reportModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReportModalOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
              <div className="p-6 border-b border-gray-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                  <FiAlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Bao cao bai viet</h3>
                  <p className="text-sm text-gray-500 mt-1">Thong tin bao cao se duoc gui den he thong moderation.</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Ly do
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
                    Mo ta chi tiet
                  </label>
                  <textarea
                    rows={4}
                    value={reportReasonDetail}
                    onChange={(e) => setReportReasonDetail(e.target.value)}
                    placeholder="Nhap mo ta de admin de danh gia noi dung vi pham"
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
                  Huy
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={isSubmittingReport}
                  className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg bg-rose-600 hover:bg-rose-700"
                >
                  {isSubmittingReport ? 'Dang gui...' : 'Gui bao cao'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </Container>
    </div>
  );
};

export default PostDetailPage;

