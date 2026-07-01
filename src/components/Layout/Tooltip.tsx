import { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip = ({ children, text, position = 'bottom' }: TooltipProps) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1',
  };

  const arrowBorders = {
    top: 'border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'border-l-gray-900 border-t-transparent border-r-transparent border-b-transparent',
    right: 'border-r-gray-900 border-t-transparent border-l-transparent border-b-transparent',
  };

  return (
    <span className="relative group/tooltip inline-block">
      {children}
      <span
        className={`absolute ${positionClasses[position]} z-[9999] px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg`}
      >
        {text}
        <span
          className={`absolute ${arrowClasses[position]} w-0 h-0 border-4 ${arrowBorders[position]}`}
        />
      </span>
    </span>
  );
};

export default Tooltip;

