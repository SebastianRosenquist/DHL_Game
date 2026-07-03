ALTER TABLE `achievement_definitions` ADD `activity_type` text DEFAULT 'run' NOT NULL;--> statement-breakpoint
ALTER TABLE `activities` ADD `activity_type` text DEFAULT 'run' NOT NULL;--> statement-breakpoint
CREATE INDEX `activities_type_idx` ON `activities` (`activity_type`);