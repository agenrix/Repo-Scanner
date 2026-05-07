export const INFRASTRUCTURE_SYMBOL = {
  Logger: Symbol.for("Logger"),
} as const;

export const HTTP_SYMBOL = {
  Route: {
    Health: Symbol.for("HealthRoute"),
  },

  Router: {
    Bootstrap: Symbol.for("BootstrapRouter"),
    Health: Symbol.for("HealthRouter"),
  },

  Middleware: {
    RequestId: Symbol.for("RequestIdMiddleware"),
  },

  Server: Symbol.for("HttpServer"),
} as const;
