export interface Comment {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  parentCommentId?: number | null;
  replies?: Comment[];
  replyCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  problemId: number;
  parentId?: number | null;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentResponse {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  parentCommentId?: number | null;
  replyCount?: number;
  replies?: CommentResponse[];
  createdAt: string;
  updatedAt: string;
}

