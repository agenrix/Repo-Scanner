export const INFRASTRUCTURE_SYMBOL = {
  Logger: Symbol.for("Logger"),
} as const;

export const HTTP_SYMBOL = {
  Route: {
    User: {
      Authentication: Symbol.for("AuthenticationUserRoute"),
    },
  },

  Router: {
    Bootstrap: Symbol.for("BootstrapRouter"),
    User: Symbol.for("UserRotuer"),
  },

  Middleware: {
    RequestId: Symbol.for("RequestIdMiddleware"),
    Authentication: Symbol.for("AuthenticationMiddleware"),
  },

  Server: Symbol.for("HttpServer"),
} as const;
