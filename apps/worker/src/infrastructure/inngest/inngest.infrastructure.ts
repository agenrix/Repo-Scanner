import { Inngest } from "inngest";
import { env } from "../config/env.config";

export const inngestClient = new Inngest({ id: env.APP_NAME });
