import { type Config } from "drizzle-kit";

import { env } from "@sidekiq/env";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  tablesFilter: ["sidekiq-webapp_*"],
} satisfies Config;
