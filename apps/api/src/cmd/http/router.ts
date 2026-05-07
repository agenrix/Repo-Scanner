import { inject, injectable } from "inversify";
import { HTTP_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { IHttpApp } from "./types";

export interface IHttpRouter {
  init(path: string, app: IHttpApp): Promise<void>;
}

@injectable()
export class BootstrapRouter implements IHttpRouter {
  constructor(
    @inject(HTTP_SYMBOL.Router.Health)
    private readonly healthRouter: IHttpRouter,
  ) {}
  async init(path: string, app: IHttpApp): Promise<void> {
    await this.healthRouter.init(`${path}/health`, app);
  }
}
