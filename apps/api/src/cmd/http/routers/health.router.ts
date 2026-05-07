import { inject, injectable } from "inversify";
import { HTTP_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { IHttpRoute } from "../route";
import type { IHttpRouter } from "../router";
import type { IHttpApp } from "../types";

@injectable()
export class HealthRouter implements IHttpRouter {
  constructor(
    @inject(HTTP_SYMBOL.Route.Health) private readonly healthRoute: IHttpRoute,
  ) {}
  async init(path: string, app: IHttpApp): Promise<void> {
    app.route(`${path}`, await this.healthRoute.init());
  }
}
