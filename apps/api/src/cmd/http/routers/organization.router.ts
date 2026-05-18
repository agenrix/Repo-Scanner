import { inject, injectable } from "inversify";
import { HTTP_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { IHttpRoute } from "../route";
import type { IHttpRouter } from "../router";
import type { IHttpApp } from "../types";

@injectable()
export class OrganizationRouter implements IHttpRouter {
  constructor(
    @inject(HTTP_SYMBOL.Route.Organization.Root)
    private readonly organizationRoute: IHttpRoute,
  ) {}

  async init(path: string, app: IHttpApp): Promise<void> {
    app.route(`${path}`, await this.organizationRoute.init());
  }
}
