ALTER TABLE "correct_and_incorrect" ADD COLUMN "explanation" text;--> statement-breakpoint
CREATE INDEX "correct_incorrect_idx" ON "correct_and_incorrect" USING btree ("correct_word");--> statement-breakpoint
CREATE INDEX "dictionary_word_idx" ON "lao_dictionary" USING btree ("word");--> statement-breakpoint
ALTER TABLE "correct_and_incorrect" DROP COLUMN "explaination";--> statement-breakpoint
ALTER TABLE "lao_dictionary" DROP COLUMN "meaning";