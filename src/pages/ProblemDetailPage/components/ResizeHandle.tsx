import type { ResizeSide } from '../types';

interface ResizeHandleProps {
  side: ResizeSide;
  isResizing: ResizeSide;
  onResizeStart: (side: ResizeSide, e: React.MouseEvent) => void;
}

const ResizeHandle = ({ side, isResizing, onResizeStart }: ResizeHandleProps) => {
  if (!side) return null;

  return (
    <div
      className={`w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize transition-colors relative group ${
        isResizing === side ? 'bg-blue-500' : ''
      }`}
      onMouseDown={(e) => onResizeStart(side, e)}
    >
      <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-transparent group-hover:bg-blue-500" />
    </div>
  );
};

export default ResizeHandle;

