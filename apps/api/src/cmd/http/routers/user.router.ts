import { inject, injectable } from "inversify";
import { HTTP_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { IHttpRoute } from "../route";
import type { IHttpRouter } from "../router";
import type { IHttpApp } from "../types";

@injectable()
export class UserRouter implements IHttpRouter {
  constructor(
    @inject(HTTP_SYMBOL.Route.User.Authentication)
    private readonly userProfileRoute: IHttpRoute,
  ) {}

  async init(path: string, app: IHttpApp): Promise<void> {
    app.route(`${path}/session`, await this.userProfileRoute.init());
  }
}
