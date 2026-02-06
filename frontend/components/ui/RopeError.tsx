import React from 'react';
import toast from 'react-hot-toast';

// Keyframes styles injected for this specific component
const styles = `
  @keyframes ropeDrop {
    0% { transform: translateY(-120%); }
    60% { transform: translateY(10%); }
    80% { transform: translateY(-5%); }
    100% { transform: translateY(0); }
  }
  @keyframes ropeDrop {
    0% { transform: translateX(-50%) translateY(-120%); }
    60% { transform: translateX(-50%) translateY(10%); }
    80% { transform: translateX(-50%) translateY(-5%); }
    100% { transform: translateX(-50%) translateY(0); }
  }

  @keyframes ropeSwing {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(15deg); }
    50% { transform: rotate(-15deg); }
    75% { transform: rotate(1deg); }
    100% { transform: rotate(0deg); }
  }

  .rope-animation-container {
    animation: ropeDrop 0.8s ease-out forwards;
    transform-origin: top center;
  }

  .rope-swing {
    animation: ropeSwing 2s ease-in-out 0.8s infinite;
    transform-origin: top center;
  }
`;

interface RopeErrorProps {
  message: string;
  visible: boolean;
}

const RopeErrorComponent: React.FC<RopeErrorProps> = ({ message, visible }) => {
  return (
    <>
      <style>{styles}</style>
      <div 
        className={`fixed top-0 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center ${visible ? 'rope-animation-container' : ''}`}
      >
        {/* The Rope */}
        <div className="w-1 h-32 bg-amber-700 dark:bg-amber-600 shadow-md"></div>
        
        {/* The Knot/Connector */}
        <div className="w-3 h-3 rounded-full bg-amber-800 -mt-1 z-10"></div>

        {/* The Board (Error Box) */}
        <div className="rope-swing -mt-1">
            <div className="bg-danger text-white px-6 py-4 rounded-lg shadow-xl border-4 border-red-700 relative min-w-[300px] max-w-md text-center transform rotate-0">
                {/* Nails */}
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-red-900 shadow-inner"></div>
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-900 shadow-inner"></div>
                
                <h3 className="font-bold text-lg uppercase tracking-wider mb-1">Error</h3>
                <p className="text-sm font-medium leading-relaxed">
                    {message}
                </p>
            </div>
        </div>
      </div>
    </>
  );
};

export const showRopeError = (message: string) => {
  toast.custom(
    (t) => (
      <RopeErrorComponent message={message} visible={t.visible} />
    ),
    {
      duration: 3000,
      position: 'top-center',
      id: 'rope-error', // Prevent duplicates
    }
  );
};
