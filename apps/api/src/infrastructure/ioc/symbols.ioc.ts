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
      Root: Symbol.for("IntegrationsRoute"),
      Github: {
        Root: Symbol.for("GithubIntegrationRoute"),
        Callback: Symbol.for("GithubIntegrationCallbackRoute"),
      },
    },

    RepoScans: {
      Root: Symbol.for("RepoScansRoute"),
    },

    Organization: {
      Root: Symbol.for("OrganizationRoute"),
    },
  },

  Router: {
    Bootstrap: Symbol.for("BootstrapRouter"),
    User: Symbol.for("UserRouter"),
    Integrations: Symbol.for("IntegrationsRouter"),
    Authentication: Symbol.for("AuthenticationRouter"),
    Organization: Symbol.for("OrganizationRouter"),
  },

  Middleware: {
    RequestId: Symbol.for("RequestIdMiddleware"),
    Authentication: Symbol.for("AuthenticationMiddleware"),
  },

  Server: Symbol.for("HttpServer"),
} as const;
