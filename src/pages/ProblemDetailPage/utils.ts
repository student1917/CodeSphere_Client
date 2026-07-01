export const formatTimer = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const getLevelBadge = (level: string) => {
  const colors = {
    EASY: 'text-green-600 bg-green-50 border-green-200',
    MEDIUM: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    HARD: 'text-red-600 bg-red-50 border-red-200',
  };
  const labels = {
    EASY: 'Dễ',
    MEDIUM: 'Trung bình',
    HARD: 'Khó',
  };
  return {
    className: colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-50',
    label: labels[level as keyof typeof labels] || level,
  };
};

