CREATE TABLE "correct_and_incorrect" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "correct_and_incorrect_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"correct_word" text NOT NULL,
	"incorrect_word" text NOT NULL,
	"explaination" text,
	"word_id" integer
);
--> statement-breakpoint
CREATE TABLE "definition_texts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "definition_texts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"definition_id" integer NOT NULL,
	"kind" text NOT NULL,
	"language" text NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "definitions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "definitions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"word_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lao_dictionary" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lao_dictionary_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"word" text NOT NULL,
	"pronunciation" text NOT NULL,
	"part_of_speech" text,
	"search_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "example_sentences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "example_sentences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"example_id" integer NOT NULL,
	"language" text NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "examples" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "examples_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"word_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "correct_and_incorrect" ADD CONSTRAINT "correct_and_incorrect_word_id_lao_dictionary_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."lao_dictionary"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "definition_texts" ADD CONSTRAINT "definition_texts_definition_id_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "definitions" ADD CONSTRAINT "definitions_word_id_lao_dictionary_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."lao_dictionary"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "example_sentences" ADD CONSTRAINT "example_sentences_example_id_examples_id_fk" FOREIGN KEY ("example_id") REFERENCES "public"."examples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examples" ADD CONSTRAINT "examples_word_id_lao_dictionary_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."lao_dictionary"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_active";