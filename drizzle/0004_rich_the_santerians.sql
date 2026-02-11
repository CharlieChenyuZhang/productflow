ALTER TABLE `users` ADD `loginCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `planId` varchar(32) DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `planPeriodEnd` timestamp;