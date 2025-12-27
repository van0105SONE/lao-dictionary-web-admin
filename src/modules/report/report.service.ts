// src/modules/dictionary/services/dictionary.service.ts
import { db } from "@/db";
import {
  correct_and_incorrect,
  definitions,
  definitionTexts,
  dictionary,
  examples,
  exampleSentences,
  users,
} from "@/db/schema";

import { count, eq, like } from "drizzle-orm";

export const reportService = {
  getDashboard: async () => {
    const totalCountResult = await db
      .select({ count: count() })
      .from(dictionary);
    const totalCountUser = await db.select({ count: count() }).from(users);
    const totalCorrectIncorrect = await db
      .select({ count: count() })
      .from(correct_and_incorrect);
    const totalExample = await db
      .select({ count: count() })
      .from(exampleSentences);

    return {
      total_active_user: totalCountUser[0].count,
      total_word: totalCountResult[0].count,
      total_incorrect: totalCorrectIncorrect[0].count,
      total_example: totalExample[0].count,
    };
  },
};
