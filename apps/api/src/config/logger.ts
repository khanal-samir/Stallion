import winston from "winston";

const isProd = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: isProd
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    : winston.format.combine(
        winston.format.colorize({all: true}),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
          const details = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
          return stack
            ? `${timestamp} ${level}: ${message}\n${stack}${details}`
            : `${timestamp} ${level}: ${message}${details}`;
        })
      ),
  transports: [new winston.transports.Console()],
});