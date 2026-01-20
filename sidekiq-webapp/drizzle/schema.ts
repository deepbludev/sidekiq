import { pgTable, pgSequence, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const messageRole = pgEnum("message_role", ['user', 'assistant', 'system'])
export const teamRole = pgEnum("team_role", ['owner', 'member'])

export const pgDrizzlePostIdSeq = pgSequence("pg-drizzle_post_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })


