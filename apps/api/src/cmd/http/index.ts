// fail fast for env validation
import "~/infrastructure/config/env.config";

import { container } from "~/infrastructure/ioc/container.ioc";
import { HTTP_SYMBOL } from "~/infrastructure/ioc/symbols.ioc";
import type { IHttpServer } from "./server";

void container.get<IHttpServer>(HTTP_SYMBOL.Server).init();
