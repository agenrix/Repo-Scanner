import { createFileRoute, createRoute } from "@tanstack/react-router";
import AuthRootScren from "~/screens/auth/root.screen";

export const Route = createFileRoute("/auth")({ component: AuthRootScren });
