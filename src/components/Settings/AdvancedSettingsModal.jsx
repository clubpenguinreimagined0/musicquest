import { useState, useEffect } from 'react';
import { X, Settings, Key, Database, Download, Upload, Trash2, Info, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  saveAPIConfig,
  getAPIConfig,
  clearGenreCache,
  exportData,
  importData,
  getGenreCacheStats
} from '../../utils/storage/indexedDB';

const AdvancedSettingsModal = ({ isOpen, onClose }) => {
  const { dispatch, actionTypes } = useData();
  const [activeTab, setActiveTab] = useState('api');
  const [lastfmApiKey, setLastfmApiKey] = useState('');
  const [cacheStats, setCacheStats] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [unknownDisplay, setUnknownDisplay] = useState('faded');
  const [gatewayThreshold, setGatewayThreshold] = useState(10);
  const [genreSignificance, setGenreSignificance] = useState(1);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadCacheStats();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const apiKey = await getAPIConfig('lastfm_api_key');
    if (apiKey) {
      setLastfmApiKey(apiKey);
    }
  };

  const loadCacheStats = async () => {
    const stats = await getGenreCacheStats();
    setCacheStats(stats);
  };

  const handleSaveApiKey = async () => {
    const success = await saveAPIConfig('lastfm_api_key', lastfmApiKey);
    if (success) {
      setSaveStatus({ type: 'success', message: 'API key saved successfully!' });
    } else {
      setSaveStatus({ type: 'error', message: 'Failed to save API key' });
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleClearCache = async () => {
    if (window.confirm('Are you sure you want to clear the genre cache? This action cannot be undone.')) {
      const success = await clearGenreCache();
      if (success) {
        setSaveStatus({ type: 'success', message: 'Cache cleared successfully!' });
        loadCacheStats();
      } else {
        setSaveStatus({ type: 'error', message: 'Failed to clear cache' });
      }
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleExportData = async () => {
    const data = await exportData();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `music-visualizer-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSaveStatus({ type: 'success', message: 'Data exported successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus({ type: 'error', message: 'Failed to export data' });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const success = await importData(data);
      if (success) {
        setSaveStatus({ type: 'success', message: 'Data imported successfully! Please refresh the page.' });
        loadCacheStats();
      } else {
        setSaveStatus({ type: 'error', message: 'Failed to import data' });
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Invalid backup file' });
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will delete ALL your data including listens, genres, and settings. This action cannot be undone. Are you absolutely sure?'
    );

    if (!confirmed) return;

    try {
      // Clear IndexedDB
      const dbNames = await indexedDB.databases();
      for (const db of dbNames) {
        if (db.name) {
          await new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(db.name);
            request.onsuccess = resolve;
            request.onerror = reject;
          });
        }
      }

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear React state
      dispatch({ type: actionTypes.CLEAR_DATA });

      setSaveStatus({ type: 'success', message: 'All data cleared successfully! Reloading page...' });

      // Reload page to reset everything
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to clear data:', error);
      setSaveStatus({ type: 'error', message: 'Failed to clear all data. Please try clearing your browser cache manually.' });
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Advanced Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'api'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Key className="w-4 h-4" />
              <span>API</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('visualization')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'visualization'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Visualization</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('cache')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'cache'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Database className="w-4 h-4" />
              <span>Cache</span>
            </div>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {saveStatus && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                saveStatus.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}
            >
              <p className="text-sm">{saveStatus.message}</p>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Last.fm API Key
                </label>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Last.fm provides high-quality genre data. Get your free API key at{' '}
                      <a
                        href="https://www.last.fm/api/account/create"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        last.fm/api
                      </a>
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  value={lastfmApiKey}
                  onChange={(e) => setLastfmApiKey(e.target.value)}
                  placeholder="Enter your Last.fm API key"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="mt-3 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Save API Key
                </button>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Genre Data Sources
                </h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Last.fm</span>
                      <span> - High-quality, user-generated tags and genres</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">ListenBrainz</span>
                      <span> - Similar artist recommendations and tags</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">MusicBrainz</span>
                      <span> - Comprehensive music database with curated tags</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5"></div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Heuristic</span>
                      <span> - Pattern-based classification fallback</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visualization' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                  Unknown Genre Display
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${unknownDisplay === 'hide' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}">
                    <input
                      type="radio"
                      name="unknownDisplay"
                      value="hide"
                      checked={unknownDisplay === 'hide'}
                      onChange={(e) => setUnknownDisplay(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">Hide completely</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Unknown genres won't be shown</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${unknownDisplay === 'faded' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}">
                    <input
                      type="radio"
                      name="unknownDisplay"
                      value="faded"
                      checked={unknownDisplay === 'faded'}
                      onChange={(e) => setUnknownDisplay(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">Show faded (20% opacity)</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Recommended - background layer</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${unknownDisplay === 'normal' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}">
                    <input
                      type="radio"
                      name="unknownDisplay"
                      value="normal"
                      checked={unknownDisplay === 'normal'}
                      onChange={(e) => setUnknownDisplay(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">Show normally</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Full opacity like other genres</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Gateway Artist Threshold
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={gatewayThreshold}
                    onChange={(e) => setGatewayThreshold(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[3rem] text-right">
                    {gatewayThreshold} listens
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Minimum listens required in first quarter for gateway artist detection
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Genre Significance Threshold
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={genreSignificance}
                    onChange={(e) => setGenreSignificance(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[3rem] text-right">
                    {genreSignificance}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Minimum percentage for a genre to be shown in visualizations
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    localStorage.setItem('viz_unknownDisplay', unknownDisplay);
                    localStorage.setItem('viz_gatewayThreshold', gatewayThreshold.toString());
                    localStorage.setItem('viz_genreSignificance', genreSignificance.toString());
                    setSaveStatus({ type: 'success', message: 'Visualization preferences saved!' });
                    setTimeout(() => {
                      setSaveStatus(null);
                      onClose();
                    }, 1500);
                  }}
                  className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cache' && (
            <div className="space-y-6">
              {cacheStats && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    Cache Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Total Cached Artists</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {cacheStats.total.toLocaleString()}
                      </p>
                    </div>
                    {Object.keys(cacheStats.bySource).length > 0 && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">By Source</p>
                        <div className="space-y-1">
                          {Object.entries(cacheStats.bySource).map(([source, count]) => (
                            <div key={source} className="flex justify-between">
                              <span className="text-gray-700 dark:text-gray-300 capitalize">
                                {source}:
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {cacheStats.oldestCache && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      Oldest cache entry: {new Date(cacheStats.oldestCache).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Data Management
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={handleExportData}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Export All Data</span>
                  </button>

                  <label className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer text-gray-700 dark:text-gray-300">
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">Import Data</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleClearCache}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="font-medium">Clear Genre Cache</span>
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Exporting your data creates a backup that includes all your listens, cached genres, and settings.
                  You can import this backup later to restore your data.
                </p>
              </div>

              <div className="pt-6 border-t-2 border-red-200 dark:border-red-800">
                <h3 className="text-lg font-semibold mb-3 text-red-900 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </h3>
                <button
                  onClick={handleClearAllData}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Clear All Data (Nuclear Reset)</span>
                </button>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mt-3">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    This will permanently delete ALL data including listens, genres, cache, and settings.
                    Export your data first if you want to keep a backup.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettingsModal;
