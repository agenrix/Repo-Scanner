import { inject, injectable } from "inversify";
import { HTTP_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { IHttpRoute } from "../route";
import type { IHttpRouter } from "../router";
import type { IHttpApp } from "../types";

@injectable()
export class AuthenticationRouter implements IHttpRouter {
  constructor(
    @inject(HTTP_SYMBOL.Route.Authentication.Root)
    private readonly authRoute: IHttpRoute,
  ) {}

  async init(path: string, app: IHttpApp): Promise<void> {
    app.route(path, await this.authRoute.init());
  }
}
