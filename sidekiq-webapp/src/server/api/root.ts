import { healthRouter } from "@sidekiq/server/api/routers/health";
import { threadRouter } from "@sidekiq/server/api/routers/thread";
import { userRouter } from "@sidekiq/server/api/routers/user";
import {
  createCallerFactory,
  createTRPCRouter,
} from "@sidekiq/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  health: healthRouter,
  thread: threadRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.thread.list();
 *       ^? Thread[]
 */
export const createCaller = createCallerFactory(appRouter);
