import { inject, injectable } from "inversify";
import { HTTP_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { IHttpRoute } from "../route";
import type { IHttpRouter } from "../router";
import type { IHttpApp } from "../types";

@injectable()
export class IntegrationsRouter implements IHttpRouter {
  constructor(
    @inject(HTTP_SYMBOL.Route.Integrations.Root)
    private readonly integrationsRoute: IHttpRoute,
    @inject(HTTP_SYMBOL.Route.Integrations.Github.Root)
    private readonly githubIntegrationRoute: IHttpRoute,
    @inject(HTTP_SYMBOL.Route.Integrations.Github.Callback)
    private readonly githubIntegrationCallbackRoute: IHttpRoute,
  ) {}

  async init(path: string, app: IHttpApp): Promise<void> {
    app.route(`${path}`, await this.integrationsRoute.init());
    app.route(`${path}/github`, await this.githubIntegrationRoute.init());
    app.route(
      `${path}/github/callback`,
      await this.githubIntegrationCallbackRoute.init(),
    );
  }
}
