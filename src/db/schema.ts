// src/db/schema/user.schema.ts
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("admin"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dictionary = pgTable(
  "lao_dictionary",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    word: text("word").notNull(),
    pronunciation: text("pronunciation").notNull(),
    part_of_speech: text("part_of_speech"),
    description: text("description"),
    search_count: integer("search_count"),
    created_at: timestamp().defaultNow().notNull(),
  },
  (table) => ({
    wordIdx: index("dictionary_word_idx").on(table.word), // ← Add this
  })
);

export const correct_and_incorrect = pgTable(
  "correct_and_incorrect",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    correct_word: text("correct_word").notNull(),
    incorrect_word: text("incorrect_word").notNull(),
    explanation: text("explanation"),
    word_id: integer("word_id").references(() => dictionary.id),
  },
  (table) => ({
    incorrectWordIdx: index("correct_incorrect_idx").on(table.correct_word), // ← Add this
  })
);
