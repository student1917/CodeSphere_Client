export interface UserPublicProfileResponse {
  userId: number;
  username: string;
  avatar: string | null;
  dob: string | null;
  gender: string | null;
  lastOnline: string | null;
  postCount: number;
  isFollowing: boolean | null; // null nếu chưa đăng nhập hoặc chính mình
  followerCount: number;
  followingCount: number;
  createdAt: string;
}

export interface UserSearchResponse {
  userId: number;
  username: string;
  avatar: string | null;
}

