import { useState, useEffect } from 'react';
import { X, Download, Trash2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import errorLogger from '../../utils/errorLogger';

const ErrorLogViewer = ({ isOpen, onClose }) => {
  const [errors, setErrors] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setErrors(errorLogger.getErrors());

    const unsubscribe = errorLogger.subscribe((updatedErrors) => {
      setErrors(updatedErrors);
    });

    return unsubscribe;
  }, []);

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all error logs?')) {
      errorLogger.clearErrors();
    }
  };

  const handleDownload = () => {
    errorLogger.downloadLogs();
  };

  const filteredErrors = errors.filter(error => {
    if (filter === 'all') return true;
    return error.level === filter;
  });

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Error Logs</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredErrors.length} {filteredErrors.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close error log"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({errors.length})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'error'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Errors ({errors.filter(e => e.level === 'error').length})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'warning'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Warnings ({errors.filter(e => e.level === 'warning').length})
            </button>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredErrors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-lg font-medium">No errors logged</p>
              <p className="text-sm">Errors will appear here when they occur</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredErrors.map((error) => (
                <div
                  key={error.id}
                  className={`border rounded-lg p-4 ${getLevelColor(error.level)}`}
                >
                  <div className="flex items-start gap-3">
                    {getLevelIcon(error.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                        {error.context?.file && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {error.context.file}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                        {error.message}
                      </p>
                      {error.context?.details && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {error.context.details}
                        </p>
                      )}
                      {error.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                            Stack trace
                          </summary>
                          <pre className="text-xs mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorLogViewer;
