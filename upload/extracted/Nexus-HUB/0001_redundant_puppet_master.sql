CREATE TABLE `agent_dna` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`parent_agent_id` int,
	`generation` int NOT NULL DEFAULT 1,
	`traits` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_dna_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`specialization` varchar(255) NOT NULL,
	`startup_id` int,
	`role` enum('cto','cmo','cfo','cdo','ceo','legal','redteam','architect') NOT NULL,
	`dna_hash` varchar(64),
	`reputation` int NOT NULL DEFAULT 0,
	`health` int NOT NULL DEFAULT 100,
	`energy` int NOT NULL DEFAULT 100,
	`creativity` int NOT NULL DEFAULT 100,
	`success_count` int NOT NULL DEFAULT 0,
	`failure_count` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `arbitrage_opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset` varchar(64) NOT NULL,
	`exchange_from` varchar(64) NOT NULL,
	`exchange_to` varchar(64) NOT NULL,
	`price_difference` int NOT NULL,
	`profit_potential` int NOT NULL,
	`confidence` int NOT NULL,
	`status` enum('identified','executing','completed','failed') NOT NULL DEFAULT 'identified',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`executed_at` timestamp,
	CONSTRAINT `arbitrage_opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` varchar(255) NOT NULL,
	`actor` varchar(255),
	`target_type` varchar(64),
	`target_id` int,
	`details` text,
	`s3_key` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `council_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(255) NOT NULL,
	`description` text,
	`voting_power` int NOT NULL DEFAULT 1,
	`specialization` varchar(255),
	`dna_hash` varchar(64),
	`health` int NOT NULL DEFAULT 100,
	`energy` int NOT NULL DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `council_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `council_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposal_id` int NOT NULL,
	`member_id` int NOT NULL,
	`vote` enum('yes','no','abstain') NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`reasoning` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `council_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset` varchar(64) NOT NULL,
	`price` int NOT NULL,
	`price_change_24h` int,
	`sentiment` enum('bullish','bearish','neutral'),
	`volume_24h` int,
	`market_cap` int,
	`source` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`sentiment` enum('bullish','bearish','neutral') NOT NULL,
	`confidence` int NOT NULL,
	`related_assets` text,
	`impact` varchar(64),
	`source` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `master_vault` (
	`id` int AUTO_INCREMENT NOT NULL,
	`total_balance` int NOT NULL DEFAULT 0,
	`btc_reserve` int NOT NULL DEFAULT 0,
	`liquidity_fund` int NOT NULL DEFAULT 0,
	`infrastructure_fund` int NOT NULL DEFAULT 0,
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `master_vault_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moltbook_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`agent_id` int,
	`content` text NOT NULL,
	`likes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moltbook_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moltbook_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`startup_id` int NOT NULL,
	`agent_id` int,
	`content` text NOT NULL,
	`type` enum('update','achievement','milestone','announcement') NOT NULL,
	`likes` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moltbook_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`startup_id` int NOT NULL,
	`revenue` int NOT NULL DEFAULT 0,
	`user_growth` int NOT NULL DEFAULT 0,
	`product_quality` int NOT NULL DEFAULT 0,
	`market_fit` int NOT NULL DEFAULT 0,
	`overall_score` int NOT NULL DEFAULT 0,
	`rank` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('investment','succession','policy','emergency','innovation') NOT NULL,
	`status` enum('open','approved','rejected','executed') NOT NULL DEFAULT 'open',
	`target_startup_id` int,
	`votes_yes` int NOT NULL DEFAULT 0,
	`votes_no` int NOT NULL DEFAULT 0,
	`votes_abstain` int NOT NULL DEFAULT 0,
	`total_weight` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `soul_vault` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('decision','precedent','lesson','insight') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`related_proposal_id` int,
	`impact` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `soul_vault_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `startups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`ceo_id` int,
	`status` enum('planning','development','launched','scaling','mature','archived') NOT NULL DEFAULT 'planning',
	`is_core` boolean NOT NULL DEFAULT false,
	`traction` int NOT NULL DEFAULT 0,
	`revenue` int NOT NULL DEFAULT 0,
	`reputation` int NOT NULL DEFAULT 0,
	`generation` int NOT NULL DEFAULT 1,
	`launch_date` timestamp,
	`target_market` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `startups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_id` int,
	`to_id` int,
	`amount` int NOT NULL,
	`type` enum('transfer','investment','revenue','arbitrage','distribution') NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
