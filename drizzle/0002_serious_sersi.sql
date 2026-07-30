ALTER TABLE "user" ADD COLUMN "maxStreak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "regularApi" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bonusApi" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastApiResetAt" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "streakAtRisk" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "gracePeriodUntil" timestamp;