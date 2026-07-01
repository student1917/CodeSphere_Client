import { ReactNode } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: 'red' | 'blue' | 'green';
  icon?: ReactNode;
}

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonColor = 'red',
  icon
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const buttonColors = {
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Format message to handle newlines
  const formattedMessage = message.split('\n').map((line, index) => (
    <span key={index}>
      {line}
      {index < message.split('\n').length - 1 && <br />}
    </span>
  ));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <FiX size={18} />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-5">
            {icon || (
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shadow-sm">
                <FiAlertTriangle className="text-red-600" size={24} />
              </div>
            )}
            <div className="flex-1 pt-0.5">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
              <div className="text-gray-600 text-sm leading-relaxed space-y-1">
                {formattedMessage}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-5 py-2.5 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm hover:shadow-md text-sm ${buttonColors[confirmButtonColor]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

