import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  JWT_SECRET:
    process.env.JWT_SECRET ||
    (() => {
      throw new Error("JWT_SECRET is not defined in environment variables");
    })(),
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    (() => {
      throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
    })(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m", // Token de acceso corto
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "12h", // Token de refresh más largo pero no más de 12h
  POSTGRES_URL: process.env.POSTGRES_URL || undefined,
  POSTGRES_HOST:
    process.env.POSTGRES_HOST ||
    (() => {
      if (!process.env.POSTGRES_URL && !process.env.POSTGRES_HOST)
        throw new Error("POSTGRES_HOST is not defined in environment variables");
      return undefined;
    })(),
  POSTGRES_PORT:
    process.env.POSTGRES_PORT ||
    (() => {
      if (!process.env.POSTGRES_URL && !process.env.POSTGRES_PORT)
        throw new Error("POSTGRES_PORT is not defined in environment variables");
      return undefined;
    })(),
  POSTGRES_USERNAME:
    process.env.POSTGRES_USERNAME ||
    (() => {
      if (!process.env.POSTGRES_URL && !process.env.POSTGRES_USERNAME)
        throw new Error(
          "POSTGRES_USERNAME is not defined in environment variables"
        );
      return undefined;
    })(),
  POSTGRES_PASSWORD:
    process.env.POSTGRES_PASSWORD ||
    (() => {
      if (!process.env.POSTGRES_URL && !process.env.POSTGRES_PASSWORD)
        throw new Error(
          "POSTGRES_PASSWORD is not defined in environment variables"
        );
      return undefined;
    })(),
  POSTGRES_DATABASE:
    process.env.POSTGRES_DATABASE ||
    (() => {
      if (!process.env.POSTGRES_URL && !process.env.POSTGRES_DATABASE)
        throw new Error(
          "POSTGRES_DATABASE is not defined in environment variables"
        );
      return undefined;
    })(),
};
