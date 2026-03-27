import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: isProd ? "info" : "debug",
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }),
});
