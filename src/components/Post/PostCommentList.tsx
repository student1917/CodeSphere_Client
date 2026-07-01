import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import CommentForm from '@/components/Comment/CommentForm';
import CommentItem from '@/components/Comment/CommentItem';
import { commentApi } from '@/apis/comment.api';
import type { Comment, CommentResponse } from '@/types/comment.types';
import toast from 'react-hot-toast';
import { FiMessageCircle } from 'react-icons/fi';

interface PostCommentListProps {
  postId: number;
}

const PostCommentList = ({ postId }: PostCommentListProps) => {
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

    commentList.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: comment.replies ? comment.replies.map(r => ({ ...r, replies: r.replies || [] })) : [],
      });
    });

    commentList.forEach((comment) => {
      const commentNode = commentMap.get(comment.id)!;
      
      if (comment.replies && comment.replies.length > 0) {
        if (!comment.parentCommentId) {
          rootComments.push(commentNode);
        }
      } else {
        if (comment.parentCommentId) {
          const parent = commentMap.get(comment.parentCommentId);
          if (parent) {
            if (!parent.replies) {
              parent.replies = [];
            }
            parent.replies.push(commentNode);
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
      const response = await commentApi.getPostComments(postId, {
        page: currentPage,
        size: 20,
        sortBy: 'createdAt',
        sortDir: 'ASC',
      });

      const commentList = response.content || [];
      const tree = buildCommentTree(commentList);
      
      if (currentPage === 0) {
        setComments(tree);
      } else {
        setComments((prev) => [...prev, ...tree]);
      }
      
      setTotalPages(response.totalPages || 0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tải bình luận');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, currentPage]);

  const handleSubmit = async (content: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }

    setIsSubmitting(true);
    try {
      await commentApi.createPostComment(postId, { content });
      toast.success('Bình luận thành công!');
      setCurrentPage(0);
      await fetchComments();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentUpdate = () => {
    fetchComments();
  };

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Đang tải bình luận...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {user && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <CommentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      )}

      {/* Comments Count */}
      <div className="flex items-center gap-2 text-gray-700">
        <FiMessageCircle className="w-5 h-5" />
        <span className="font-semibold">{comments.length} bình luận</span>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onUpdate={handleCommentUpdate}
              onDelete={handleCommentUpdate}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {currentPage < totalPages - 1 && (
        <div className="text-center">
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={isLoading}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Đang tải...' : 'Tải thêm bình luận'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PostCommentList;

