const MAX_ERRORS = 100;

class ErrorLogger {
  constructor() {
    this.errors = [];
    this.listeners = [];
  }

  log(error, context = {}) {
    const errorEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      context,
      level: context.level || 'error'
    };

    this.errors.unshift(errorEntry);

    if (this.errors.length > MAX_ERRORS) {
      this.errors = this.errors.slice(0, MAX_ERRORS);
    }

    this.notifyListeners();

    console.error('[ErrorLogger]', errorEntry);

    return errorEntry;
  }

  warn(message, context = {}) {
    this.log({ message }, { ...context, level: 'warning' });
  }

  info(message, context = {}) {
    this.log({ message }, { ...context, level: 'info' });
  }

  getErrors() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.errors);
      } catch (e) {
        console.error('Error in error logger listener:', e);
      }
    });
  }

  exportLogs() {
    return JSON.stringify(this.errors, null, 2);
  }

  downloadLogs() {
    const logs = this.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const errorLogger = new ErrorLogger();

export default errorLogger;
