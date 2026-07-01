CREATE TABLE `milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`km` real NOT NULL,
	`label` text NOT NULL,
	`icon` text DEFAULT '🏁' NOT NULL,
	`created_at` integer NOT NULL
);
