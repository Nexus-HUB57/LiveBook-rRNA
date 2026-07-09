import { router, publicProcedure } from "./trpc";
import { z } from "zod";

export const systemRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date() };
  }),
  info: publicProcedure.query(() => {
    return {
      version: "1.0.0",
      name: "Nexus-HUB",
      environment: process.env.NODE_ENV || "development",
    };
  }),
});
