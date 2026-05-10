import type { Postgres } from "@agenrix/pg";
import { inject, injectable } from "inversify";
import { postgres } from "../config/postgres.config";
import { INFRASTRUCTURE_SYMBOL } from "../ioc/symbols.ioc";
import type { ILogger } from "../logger/logger.infrastructure";

export interface IPostgresPersistence {
  init(): Promise<void>;
  close(): Promise<void>;
  readonly client: Postgres;
}

@injectable()
export class PostgresPersistence implements IPostgresPersistence {
  private dbInternal: Postgres | undefined;

  constructor(
    @inject(INFRASTRUCTURE_SYMBOL.Logger) private readonly logger: ILogger,
  ) {}

  async init(): Promise<void> {
    if (this.dbInternal) return;

    this.logger.general.info("Connecting to PostgreSQL...");
    this.dbInternal = postgres;
  }

  async close(): Promise<void> {
    if (!this.dbInternal) return;

    this.logger.general.info("Closing PostgreSQL connection...");
    await this.dbInternal.$client.end();
    this.dbInternal = undefined;
  }

  get client(): Postgres {
    if (!this.dbInternal) throw new Error("PostgreSQL not initialized");
    return this.dbInternal;
  }
}
