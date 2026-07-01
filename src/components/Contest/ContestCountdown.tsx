import { useEffect, useState, useRef } from 'react';

interface ContestCountdownProps {
  targetTime: string; // ISO string
  onComplete?: () => void;
  showDays?: boolean; // Hiển thị ngày (mặc định true)
}

const ContestCountdown = ({ targetTime, onComplete, showDays = true }: ContestCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);
  const onCompleteCalledRef = useRef(false);

  useEffect(() => {
    // Reset onComplete flag when targetTime changes
    onCompleteCalledRef.current = false;
    setIsExpired(false);

    const calculateTimeLeft = () => {
      const target = new Date(targetTime).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        // Chỉ gọi onComplete một lần
        if (onComplete && !onCompleteCalledRef.current) {
          onCompleteCalledRef.current = true;
          onComplete();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
      setIsExpired(false);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  if (isExpired) {
    return (
      <div className="text-center py-4">
        <div className="text-lg font-semibold text-gray-500">Ended</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {showDays && timeLeft.days > 0 && (
        <>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{timeLeft.days}</div>
            <div className="text-xs text-gray-500">Ngày</div>
          </div>
          <div className="text-2xl font-bold text-gray-400">:</div>
        </>
      )}
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600">{String(timeLeft.hours).padStart(2, '0')}</div>
        <div className="text-xs text-gray-500">Giờ</div>
      </div>
      <div className="text-2xl font-bold text-gray-400">:</div>
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600">{String(timeLeft.minutes).padStart(2, '0')}</div>
        <div className="text-xs text-gray-500">Phút</div>
      </div>
      <div className="text-2xl font-bold text-gray-400">:</div>
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600">{String(timeLeft.seconds).padStart(2, '0')}</div>
        <div className="text-xs text-gray-500">Giây</div>
      </div>
    </div>
  );
};

export default ContestCountdown;

