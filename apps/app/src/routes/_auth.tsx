import { createFileRoute } from "@tanstack/react-router";
import AuthRootScren from "~/screens/auth/root.screen";

export const Route = createFileRoute("/_auth")({ component: AuthRootScren });
