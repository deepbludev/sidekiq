import { createTRPCRouter, publicProcedure } from "@sidekiq/shared/trpc/trpc";

/**
 * Health check router for verifying API connectivity
 */
export const healthRouter = createTRPCRouter({
  /**
   * Simple health check endpoint
   * @returns Object with status and timestamp
   */
  check: publicProcedure.query(() => {
    return {
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    };
  }),
});
