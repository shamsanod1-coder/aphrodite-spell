type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV === "development";

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ` ${JSON.stringify(data)}` : ""}`;
}

export const logger = {
  debug(message: string, data?: unknown) {
    if (isDev) {
      console.debug(formatMessage("debug", message, data));
    }
  },

  info(message: string, data?: unknown) {
    console.info(formatMessage("info", message, data));
  },

  warn(message: string, data?: unknown) {
    console.warn(formatMessage("warn", message, data));
  },

  error(message: string, error?: unknown) {
    console.error(formatMessage("error", message, error));
  },
};
