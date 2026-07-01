import { useState } from 'react';
import type { User } from '@/types/auth.types';

interface AvatarProps {
  user?: User | null;
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar = ({ user, src, alt, size = 'md', className = '' }: AvatarProps) => {
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  // Kiểm tra imageSrc phải là string không rỗng và hợp lệ
  const imageSrc = (src && src.trim()) || (user?.avatar && user.avatar.trim());
  const displayName = alt || user?.username || user?.email || 'User';
  
  // Tạo initials an toàn, xử lý trường hợp username rỗng hoặc không có ký tự
  const getInitials = (name: string): string => {
    if (!name || !name.trim()) return 'U';
    
    // Nếu là email, lấy chữ cái đầu của phần trước @
    if (name.includes('@')) {
      const emailPart = name.split('@')[0];
      return emailPart.charAt(0).toUpperCase();
    }
    
    // Nếu là tên thường, lấy chữ cái đầu của từng từ
    const words = name.trim().split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'U';
    const initials = words
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return initials || 'U';
  };

  const initials = getInitials(displayName);
  const hasValidImage = imageSrc && !imageError;

  return (
    <div
      className={`
        ${sizes[size]} rounded-full bg-gray-300 flex items-center justify-center
        font-medium text-gray-700 overflow-hidden ${className}
      `}
    >
      {hasValidImage ? (
        <img 
          src={imageSrc} 
          alt={displayName} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;

