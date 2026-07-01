import { FiAlertCircle } from 'react-icons/fi';

interface StartContestConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  durationMinutes: number;
  isRetake?: boolean;
}

const StartContestConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  durationMinutes,
  isRetake = false,
}: StartContestConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiAlertCircle className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {isRetake ? 'Làm lại contest?' : 'Bắt đầu contest?'}
            </h3>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              {isRetake
                ? 'Bạn có chắc chắn muốn làm lại contest này không?'
                : 'Bạn có chắc chắn muốn bắt đầu contest này không?'}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Thời gian làm bài:</strong> {durationMinutes} phút
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Sau khi bắt đầu, bạn sẽ có {durationMinutes} phút để hoàn thành contest.
                {isRetake && ' Lần làm trước sẽ không được tính.'}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {isRetake ? 'Làm lại' : 'Bắt đầu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartContestConfirmModal;

