CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `role`, `created_at`) 
VALUES ('admin', 'admin@wow3d.co.kr', 'admin1234', 'Admin', 'admin', 1711958400000);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text NOT NULL,
	`category_id` integer,
	`author_id` text NOT NULL,
	`thumbnail_key` text,
	`status` text DEFAULT 'draft',
	`published_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_articles`("id", "title", "slug", "content", "category_id", "author_id", "thumbnail_key", "status", "published_at", "updated_at") SELECT "id", "title", "slug", "content", "category_id", "author_id", "thumbnail_key", "status", "published_at", "updated_at" FROM `articles`;--> statement-breakpoint
DROP TABLE `articles`;--> statement-breakpoint
ALTER TABLE `__new_articles` RENAME TO `articles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_unique` ON `articles` (`slug`);