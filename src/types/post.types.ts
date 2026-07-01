export interface TagResponse {
  id: number;
  name: string;
  slug: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  parentName?: string;
  children?: CategoryResponse[];
}

export interface PostResponse {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null; // Deprecated, use images
  images?: string[] | null; // List of image URLs
  isAnonymous: boolean;
  isResolved: boolean;
  authorId: number;
  authorName: string;
  authorAvatar: string | null;
  totalVotes: number;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  viewCount: number;
  userVote: number | null; // null, 1 (like)
  tags: TagResponse[];
  createdAt: string;
  updatedAt: string;
}

import type { CommentResponse } from './comment.types';

export interface PostDetailResponse extends PostResponse {
  comments?: CommentResponse[]; // Comments từ backend (nếu có)
}

export interface CreatePostRequest {
  title: string;
  content: string;
  imageUrl?: string; // Deprecated, use images
  images?: string[]; // List of image URLs
  isAnonymous?: boolean;
  tagNames?: string[]; // Tên các tag (có thể tạo tag mới)
}

export interface VoteRequest {
  vote: number; // 1 (upvote), -1 (downvote), 0 (remove vote)
}

export interface VoteResponse {
  totalVotes: number;
  upvotes: number;
  downvotes: number;
  userVote: number | null;
}

export interface PostReactionUserResponse {
  userId: number;
  username: string;
  avatar: string | null;
  reactedAt: string;
}

export interface ReactionSummaryItemResponse {
  reactionType: 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY' | string;
  count: number;
}

export interface PostReactionSummaryResponse {
  postId: number;
  totalReactions: number;
  topReactions: ReactionSummaryItemResponse[];
}

export interface PostShareUserResponse {
  userId: number;
  username: string;
  avatar: string | null;
  sharedAt: string;
}

