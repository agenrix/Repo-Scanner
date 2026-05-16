export const INFRASTRUCTURE_SYMBOL = {
  Logger: Symbol.for("Logger"),
  Postgres: Symbol.for("Postgres"),
} as const;

export const HTTP_SYMBOL = {
  Route: {
    User: {
      Authentication: Symbol.for("AuthenticationUserRoute"),
    },

    Authentication: {
      Root: Symbol.for("AuthenticationRootRoute"),
    },

    Integrations: {
      Github: {
        Root: Symbol.for("GithubIntegrationRoute"),
        Callback: Symbol.for("GithubIntegrationCallbackRoute"),
      },
    },
  },

  Router: {
    Bootstrap: Symbol.for("BootstrapRouter"),
    User: Symbol.for("UserRouter"),
    Integrations: Symbol.for("IntegrationsRouter"),
    Authentication: Symbol.for("AuthenticationRouter"),
  },

  Middleware: {
    RequestId: Symbol.for("RequestIdMiddleware"),
    Authentication: Symbol.for("AuthenticationMiddleware"),
  },

  Server: Symbol.for("HttpServer"),
} as const;
