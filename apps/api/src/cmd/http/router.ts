import { inject, injectable } from "inversify";
import { HTTP_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { IHttpApp } from "./types";

export interface IHttpRouter {
  init(path: string, app: IHttpApp): Promise<void>;
}

@injectable()
export class BootstrapRouter implements IHttpRouter {
  constructor(
    @inject(HTTP_SYMBOL.Router.User)
    private readonly userRouter: IHttpRouter,

    @inject(HTTP_SYMBOL.Router.Integrations)
    private readonly integrationsRouter: IHttpRouter,
  ) {}
  async init(path: string, app: IHttpApp): Promise<void> {
    await this.userRouter.init(`${path}/user`, app);
    await this.integrationsRouter.init(`${path}/integrations`, app);
  }
}
