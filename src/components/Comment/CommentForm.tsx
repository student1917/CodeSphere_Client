import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/Avatar';
import { FiSend } from 'react-icons/fi';
import Button from '@/components/Button';

interface CommentFormProps {
  problemId?: number;
  postId?: number;
  parentId?: number | null;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  isSubmitting?: boolean;
}

const CommentForm = ({ 
  problemId,
  postId,
  parentId = null, 
  onSubmit, 
  onCancel,
  placeholder = 'Write a comment...',
  isSubmitting = false
}: CommentFormProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    try {
      await onSubmit(content);
      setContent('');
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      // Error đã được xử lý trong parent component
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
        <p>Please log in to comment</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Avatar user={user} size="md" />
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-end gap-2 mt-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            className="flex items-center gap-2"
          >
            <FiSend className="w-4 h-4" />
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;

