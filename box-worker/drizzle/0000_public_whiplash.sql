CREATE TABLE `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_name_unique` ON `brands` (`name`);--> statement-breakpoint
CREATE INDEX `idx_brands_name` ON `brands` (`name`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`brand_id` text NOT NULL,
	`category` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`image_url` text,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_products_brand_id` ON `products` (`brand_id`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category`);