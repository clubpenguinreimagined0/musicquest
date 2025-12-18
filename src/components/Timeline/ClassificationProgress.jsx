import { X, Pause, Play } from 'lucide-react';

const ClassificationProgress = ({
  current,
  total,
  currentArtist,
  isClassifying,
  onPause,
  onResume,
  onCancel,
  onRunInBackground,
  estimatedTimeRemaining
}) => {
  if (!isClassifying || total === 0) return null;

  const percentage = Math.round((current / total) * 100);
  const isPaused = !isClassifying && current < total;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Classifying Genres
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {current.toLocaleString()} / {total.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Cancel classification"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>{percentage}%</span>
            {estimatedTimeRemaining && (
              <span>{estimatedTimeRemaining} remaining</span>
            )}
          </div>

          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {currentArtist && (
          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
            <span className="font-medium">Current:</span> {currentArtist}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {isPaused ? (
            <button
              onClick={onResume}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Play size={14} />
              Resume
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Pause size={14} />
              Pause
            </button>
          )}

          <button
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onRunInBackground}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Background
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassificationProgress;
