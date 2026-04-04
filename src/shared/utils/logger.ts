declare const __DEV__: boolean;

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info:  (message: string, context?: LogContext) => void;
  warn:  (message: string, context?: LogContext) => void;
  error: (message: string, error?: unknown, context?: LogContext) => void;
};

const formatMessage = (level: LogLevel, message: string): string =>
  `[${level.toUpperCase()}] ${message}`;

const createLogger = (): Logger => ({
  debug: (message, context) => {
    if (!__DEV__) return;
    console.log(formatMessage("debug", message), context ?? "");
  },
  info: (message, context) => {
    if (!__DEV__) return;
    console.info(formatMessage("info", message), context ?? "");
  },
  warn: (message, context) => {
    if (!__DEV__) return;
    console.warn(formatMessage("warn", message), context ?? "");
  },
  error: (message, error, context) => {
    if (__DEV__) {
      console.error(formatMessage("error", message), error ?? "", context ?? "");
    }
    // Production: replace the block below with your error reporting service
    // Example Sentry integration:
    // if (!__DEV__) {
    //   Sentry.captureException(error instanceof Error ? error : new Error(message), {
    //     extra: context,
    //   });
    // }
  },
});

export const logger = createLogger();
