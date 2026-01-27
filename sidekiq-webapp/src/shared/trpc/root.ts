import { healthRouter } from "@sidekiq/shared/trpc/routers/health";
import { sidekiqRouter } from "@sidekiq/sidekiqs/api/router";
import { teamRouter } from "@sidekiq/workspace/api/router";
import { threadRouter } from "@sidekiq/chats/api/router";
import { userRouter } from "@sidekiq/user/api/router";
import {
  createCallerFactory,
  createTRPCRouter,
} from "@sidekiq/shared/trpc/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  health: healthRouter,
  sidekiq: sidekiqRouter,
  team: teamRouter,
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
