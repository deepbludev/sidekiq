import { type Config } from "drizzle-kit";

import { env } from "@sidekiq/shared/env";

export default {
  schema: "./src/shared/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config;
