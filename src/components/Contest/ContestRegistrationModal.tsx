import { useState } from 'react';
import { FiX, FiLock } from 'react-icons/fi';

interface ContestRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (accessCode?: string) => Promise<void>;
  isPublic: boolean;
  hasAccessCode: boolean;
}

const ContestRegistrationModal = ({
  isOpen,
  onClose,
  onRegister,
  isPublic,
  hasAccessCode,
}: ContestRegistrationModalProps) => {
  const [accessCode, setAccessCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      await onRegister(hasAccessCode && !isPublic ? accessCode : undefined);
      setAccessCode('');
      onClose();
    } catch (error) {
      // Error đã được xử lý trong parent
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Đăng ký Contest</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <FiX />
          </button>
        </div>

        {!isPublic && hasAccessCode && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <FiLock className="text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              Contest này yêu cầu mã truy cập. Vui lòng nhập mã để đăng ký.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isPublic && hasAccessCode && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã truy cập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mã truy cập"
                required
              />
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isRegistering}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isRegistering ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContestRegistrationModal;

