CREATE TABLE `achievement_awards` (
	`id` text PRIMARY KEY NOT NULL,
	`definition_id` text NOT NULL,
	`user_id` text,
	`team_id` text,
	`value` real NOT NULL,
	`source_activity_id` text,
	`awarded_at` integer NOT NULL,
	FOREIGN KEY (`definition_id`) REFERENCES `achievement_definitions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `awards_definition_unique` ON `achievement_awards` (`definition_id`);--> statement-breakpoint
CREATE TABLE `achievement_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`strategy` text NOT NULL,
	`params` text DEFAULT '{}' NOT NULL,
	`scope` text DEFAULT 'individual' NOT NULL,
	`is_record_holder` integer DEFAULT true NOT NULL,
	`window` text DEFAULT 'all_time' NOT NULL,
	`icon` text DEFAULT '🏆' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `achievement_history` (
	`id` text PRIMARY KEY NOT NULL,
	`definition_id` text NOT NULL,
	`user_id` text,
	`team_id` text,
	`value` real NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`definition_id`) REFERENCES `achievement_definitions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`team_id` text NOT NULL,
	`distance_m` integer NOT NULL,
	`elapsed_sec` integer NOT NULL,
	`moving_sec` integer,
	`started_at` integer NOT NULL,
	`local_date` text NOT NULL,
	`avg_pace_sec_per_km` real,
	`fastest_5k_sec` integer,
	`fastest_1k_sec` integer,
	`fastest_10k_sec` integer,
	`has_track` integer DEFAULT false NOT NULL,
	`source` text NOT NULL,
	`raw_file_path` text,
	`content_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activities_team_idx` ON `activities` (`team_id`);--> statement-breakpoint
CREATE INDEX `activities_date_idx` ON `activities` (`local_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `activities_user_hash_unique` ON `activities` (`user_id`,`content_hash`);--> statement-breakpoint
CREATE TABLE `activity_tracks` (
	`activity_id` text PRIMARY KEY NOT NULL,
	`points_blob` blob NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`character` text DEFAULT 'fox' NOT NULL,
	`color_hex` text DEFAULT '#FFCC00' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_name_unique` ON `teams` (`name`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`team_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_name_team_unique` ON `users` (`name`,`team_id`);