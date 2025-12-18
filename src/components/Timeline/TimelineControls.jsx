import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

const TimelineControls = ({
  groupedData,
  currentPeriodIndex,
  onPeriodChange,
  isPlaying,
  onPlayPauseToggle,
  playbackSpeed = 1
}) => {
  const [speed, setSpeed] = useState(playbackSpeed);

  useEffect(() => {
    if (!isPlaying || !groupedData.length) return;

    const interval = setInterval(() => {
      onPeriodChange(prev => {
        const next = prev + 1;
        if (next >= groupedData.length) {
          onPlayPauseToggle(false);
          return 0;
        }
        return next;
      });
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, groupedData.length]);

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
  };

  const handleSkipBack = () => {
    onPeriodChange(Math.max(0, currentPeriodIndex - 1));
  };

  const handleSkipForward = () => {
    onPeriodChange(Math.min(groupedData.length - 1, currentPeriodIndex + 1));
  };

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    onPeriodChange(value);
  };

  if (!groupedData.length) return null;

  const currentPeriod = groupedData[currentPeriodIndex] || groupedData[0];

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={handleSkipBack}
          disabled={currentPeriodIndex === 0}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous period"
        >
          <SkipBack size={20} />
        </button>

        <button
          onClick={() => onPlayPauseToggle(!isPlaying)}
          className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        <button
          onClick={handleSkipForward}
          disabled={currentPeriodIndex === groupedData.length - 1}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next period"
        >
          <SkipForward size={20} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Speed:</span>
          <select
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm border-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max={groupedData.length - 1}
          value={currentPeriodIndex}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(currentPeriodIndex / (groupedData.length - 1)) * 100}%, #E5E7EB ${(currentPeriodIndex / (groupedData.length - 1)) * 100}%, #E5E7EB 100%)`
          }}
        />

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {groupedData[0]?.periodLabel}
          </div>

          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentPeriod.periodLabel}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentPeriod.listens.length.toLocaleString()} listens
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {groupedData[groupedData.length - 1]?.periodLabel}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-1">
        {groupedData.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all duration-200 ${
              idx === currentPeriodIndex
                ? 'w-8 bg-blue-600'
                : idx < currentPeriodIndex
                ? 'w-2 bg-blue-400'
                : 'w-2 bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default TimelineControls;
