// src/modules/dictionary/services/dictionary.service.ts
import { db } from "@/db";
import {
  correct_and_incorrect,
  dictionary,
  users,
} from "@/db/schema";

import { count, eq, like } from "drizzle-orm";

export const reportService = {
  getDashboard: async () => {


    // Run all 3 queries in parallel
    const [
      totalWordsResult,
      totalUsersResult,
      totalCorrectIncorrectResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(dictionary),
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(correct_and_incorrect),
    ]);

    // Extract the actual numbers (each result is an array with one object)
    const totalWords = totalWordsResult[0]?.count ?? 0;
    const totalUsers = totalUsersResult[0]?.count ?? 0;
    const totalCorrectIncorrect = totalCorrectIncorrectResult[0]?.count ?? 0;

    return {
      total_active_user: totalUsers,
      total_word: totalWords,
      total_incorrect: totalCorrectIncorrect,
    };
  },
};
