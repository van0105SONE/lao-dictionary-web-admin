import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
const connectionString ='postgresql://neondb_owner:npg_LGhcbjO3B0xT@ep-rough-snowflake-a132zji9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = neon('postgresql://neondb_owner:npg_LGhcbjO3B0xT@ep-rough-snowflake-a132zji9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

export const db = drizzle({ client: sql });
