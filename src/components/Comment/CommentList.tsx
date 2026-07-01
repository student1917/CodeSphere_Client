import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import Loading from '@/components/Loading';
import { commentApi } from '@/apis/comment.api';
import type { Comment, CommentResponse } from '@/types/comment.types';
import toast from 'react-hot-toast';
import { FiMessageCircle } from 'react-icons/fi';

interface CommentListProps {
  problemId: number;
}

const CommentList = ({ problemId }: CommentListProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Chuyển đổi CommentResponse thành Comment với cấu trúc nested
  const buildCommentTree = (commentList: CommentResponse[]): Comment[] => {
    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];

    // Tạo map tất cả comments - nếu đã có replies từ backend thì giữ nguyên
    commentList.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: comment.replies ? comment.replies.map(r => ({ ...r, replies: r.replies || [] })) : [],
      });
    });

    // Xây dựng cây comments - chỉ xử lý nếu chưa có replies từ backend
    commentList.forEach((comment) => {
      const commentNode = commentMap.get(comment.id)!;
      
      // Nếu backend đã trả về replies, không cần build tree nữa
      if (comment.replies && comment.replies.length > 0) {
        // Đã có replies từ backend, chỉ cần đảm bảo là root comment
        if (!comment.parentCommentId) {
          rootComments.push(commentNode);
        }
      } else {
        // Nếu chưa có replies, build tree như cũ
        if (comment.parentCommentId) {
          const parent = commentMap.get(comment.parentCommentId);
          if (parent) {
            if (!parent.replies) {
              parent.replies = [];
            }
            parent.replies.push(commentNode);
          } else {
            // Nếu không tìm thấy parent, coi như root comment
            rootComments.push(commentNode);
          }
        } else {
          rootComments.push(commentNode);
        }
      }
    });

    return rootComments;
  };

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await commentApi.getComments(problemId, {
        page: currentPage,
        size: 20,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      });
      
      const commentTree = buildCommentTree(response.content);
      setComments(commentTree);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      // Không hiển thị error nếu là 401 (chưa đăng nhập)
      if (error.response?.status !== 401) {
        toast.error('Unable to load comments');
      }
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [problemId, currentPage]);

  const handleSubmit = async (content: string) => {
    try {
      setIsSubmitting(true);
      await commentApi.createComment({
        problemId,
        content,
        parentId: null,
      });
      toast.success('Comment sent');
      // Refresh comments
      await fetchComments();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error sending comment';
      toast.error(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FiMessageCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <CommentForm
        problemId={problemId}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FiMessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No comments yet</p>
          <p className="text-sm mt-1">Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              problemId={problemId}
              onUpdate={fetchComments}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentList;

