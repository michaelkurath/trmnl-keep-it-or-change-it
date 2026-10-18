CREATE TABLE `rounds` (
	`id` integer PRIMARY KEY NOT NULL,
	`image` integer NOT NULL,
	`image_start` integer NOT NULL,
	`settled` integer DEFAULT 0 NOT NULL,
	`keep_count` integer DEFAULT 0 NOT NULL,
	`change_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`round_id` integer NOT NULL,
	`voter` text NOT NULL,
	`choice` text NOT NULL,
	PRIMARY KEY(`round_id`, `voter`),
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE no action
);
