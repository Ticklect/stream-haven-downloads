export class ErrorReportingService {
  private static instance: ErrorReportingService;

  private constructor() {}

  static getInstance() {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  captureError(error: Error, context?: object) {
    // Log locally
    console.error('[ErrorReportingService]', error, context);
    // TODO: Integrate with external error reporting service (e.g., Sentry, Bugsnag)
  }
}

// Optionally, a React context/provider can be added in a separate step if needed. 