-- Create agent type enum
CREATE TYPE "public"."agent_type" AS ENUM('support', 'whatsapp');--> statement-breakpoint

-- Create agent table  
CREATE TABLE "agent" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"agentType" "agent_type" NOT NULL,
	"organizationId" text NOT NULL,
	"userId" text NOT NULL,
	"companyName" text,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"personalityTraits" text[] DEFAULT '{}'::text[],
	"customInstructions" text,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint

-- Create agent_knowledge junction table
CREATE TABLE "agent_knowledge" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"libraryItemId" text NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Add foreign key constraints
ALTER TABLE "agent" ADD CONSTRAINT "agent_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_knowledge" ADD CONSTRAINT "agent_knowledge_agentId_agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_knowledge" ADD CONSTRAINT "agent_knowledge_libraryItemId_library_item_id_fk" FOREIGN KEY ("libraryItemId") REFERENCES "public"."library_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Add unique constraint for agent-library relationship
ALTER TABLE "agent_knowledge" ADD CONSTRAINT "agent_knowledge_agentId_libraryItemId_unique" UNIQUE("agentId", "libraryItemId");--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX "agent_organizationId_idx" ON "agent" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "agent_userId_idx" ON "agent" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "agent_agentType_idx" ON "agent" USING btree ("agentType");--> statement-breakpoint
CREATE INDEX "agent_knowledge_agentId_idx" ON "agent_knowledge" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "agent_knowledge_libraryItemId_idx" ON "agent_knowledge" USING btree ("libraryItemId");