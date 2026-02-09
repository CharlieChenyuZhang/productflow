CREATE TABLE `company_research` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`companyUrl` varchar(1024) NOT NULL,
	`companyName` varchar(255),
	`status` enum('pending','searching','analyzing','completed','failed') NOT NULL DEFAULT 'pending',
	`overallSentiment` enum('positive','negative','neutral','mixed'),
	`positiveCount` int DEFAULT 0,
	`negativeCount` int DEFAULT 0,
	`neutralCount` int DEFAULT 0,
	`summary` text,
	`keyStrengths` json,
	`keyWeaknesses` json,
	`recommendations` json,
	`rawSearchResults` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `company_research_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `research_findings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`researchId` int NOT NULL,
	`projectId` int NOT NULL,
	`source` varchar(512) NOT NULL,
	`sourceType` enum('review','forum','social_media','news','blog','support','other') NOT NULL DEFAULT 'other',
	`title` varchar(512) NOT NULL,
	`content` text NOT NULL,
	`sentiment` enum('positive','negative','neutral') NOT NULL DEFAULT 'neutral',
	`sentimentScore` int,
	`category` varchar(255),
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `research_findings_id` PRIMARY KEY(`id`)
);
