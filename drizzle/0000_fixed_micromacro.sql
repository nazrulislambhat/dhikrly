CREATE TABLE "adhkar_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"dua_id" varchar(100) NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_id" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "custom_duas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_dua_id" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"arabic" text,
	"transliteration" text,
	"translation" text,
	"category" varchar(50) DEFAULT 'custom',
	"repeat_count" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"device_id" varchar(120),
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"morning_enabled" boolean DEFAULT false NOT NULL,
	"morning_time" varchar(10) DEFAULT '06:00' NOT NULL,
	"evening_enabled" boolean DEFAULT false NOT NULL,
	"evening_time" varchar(10) DEFAULT '18:00' NOT NULL,
	"timezone" varchar(60) DEFAULT 'UTC' NOT NULL,
	"last_sent_morning" date,
	"last_sent_evening" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "qada_balances" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"fajr" integer DEFAULT 0 NOT NULL,
	"dhuhr" integer DEFAULT 0 NOT NULL,
	"asr" integer DEFAULT 0 NOT NULL,
	"maghrib" integer DEFAULT 0 NOT NULL,
	"isha" integer DEFAULT 0 NOT NULL,
	"witr" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qada_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prayer" varchar(30) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"repaid_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quran_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"surah" integer NOT NULL,
	"ayah" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quran_progress" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"surah" integer DEFAULT 1 NOT NULL,
	"ayah" integer DEFAULT 1 NOT NULL,
	"page" integer DEFAULT 1 NOT NULL,
	"juz" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ramadan_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hijri_year" integer NOT NULL,
	"fast_day" integer NOT NULL,
	"fast_completed" boolean DEFAULT true NOT NULL,
	"suhoor_dua" boolean DEFAULT false,
	"iftar_dua" boolean DEFAULT false,
	"taraweeh_rakahs" integer DEFAULT 0,
	"notes" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salah_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"prayer" varchar(30) NOT NULL,
	"status" varchar(30) NOT NULL,
	"is_congregation" boolean DEFAULT false NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasbih_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"dhikr_key" varchar(100) NOT NULL,
	"count" integer NOT NULL,
	"target" integer DEFAULT 33,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_completed_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"display_name" varchar(120),
	"avatar_url" text,
	"accent_color" varchar(30) DEFAULT 'emerald',
	"timezone" varchar(60) DEFAULT 'UTC',
	"city" varchar(100),
	"country" varchar(100),
	"calculation_method" varchar(60) DEFAULT 'MuslimWorldLeague',
	"madhhab" varchar(30) DEFAULT 'Standard',
	"niyyah" text,
	"hijri_offset" integer DEFAULT 0,
	"daily_dhikr_goal" integer DEFAULT 100,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "adhkar_completions" ADD CONSTRAINT "adhkar_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_duas" ADD CONSTRAINT "custom_duas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qada_balances" ADD CONSTRAINT "qada_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qada_history" ADD CONSTRAINT "qada_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_bookmarks" ADD CONSTRAINT "quran_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_progress" ADD CONSTRAINT "quran_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ramadan_logs" ADD CONSTRAINT "ramadan_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salah_logs" ADD CONSTRAINT "salah_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasbih_sessions" ADD CONSTRAINT "tasbih_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "adhkar_user_date_dua_idx" ON "adhkar_completions" USING btree ("user_id","date","dua_id");--> statement-breakpoint
CREATE INDEX "adhkar_user_date_idx" ON "adhkar_completions" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_duas_user_client_id_idx" ON "custom_duas" USING btree ("user_id","client_dua_id");--> statement-breakpoint
CREATE INDEX "custom_duas_user_idx" ON "custom_duas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "push_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "push_morning_idx" ON "push_subscriptions" USING btree ("morning_enabled","morning_time");--> statement-breakpoint
CREATE INDEX "push_evening_idx" ON "push_subscriptions" USING btree ("evening_enabled","evening_time");--> statement-breakpoint
CREATE INDEX "qada_history_user_idx" ON "qada_history" USING btree ("user_id","repaid_at");--> statement-breakpoint
CREATE UNIQUE INDEX "quran_user_surah_ayah_idx" ON "quran_bookmarks" USING btree ("user_id","surah","ayah");--> statement-breakpoint
CREATE INDEX "quran_bookmarks_user_idx" ON "quran_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ramadan_user_year_day_idx" ON "ramadan_logs" USING btree ("user_id","hijri_year","fast_day");--> statement-breakpoint
CREATE INDEX "ramadan_user_idx" ON "ramadan_logs" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salah_user_date_prayer_idx" ON "salah_logs" USING btree ("user_id","date","prayer");--> statement-breakpoint
CREATE INDEX "salah_user_date_idx" ON "salah_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasbih_user_date_idx" ON "tasbih_sessions" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");