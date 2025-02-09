import { pgTable, text, serial, integer, boolean, timestamp, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing user role definition
export const UserRole = z.enum(['USER', 'RECYCLER', 'TECHNICIAN', 'EDUCATOR', 'ADMIN', 'BUSINESS']);
export type UserRole = z.infer<typeof UserRole>;

// Update users table to include points
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").$type<UserRole>().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  points: integer("points").notNull().default(0),
  totalCarbonSaved: decimal("total_carbon_saved", { precision: 10, scale: 2 }).notNull().default('0'),
});

// Create extended schemas that include all fields for forms
export const insertUserSchema = createInsertSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define the structure for e-waste items with carbon impact
export const WasteItemSchema = z.object({
  type: z.string(),
  description: z.string(),
  quantity: z.number().optional(),
  condition: z.string().optional(),
  estimatedCarbonImpact: z.number().optional(), // kg of CO2 saved
});

export const pickupRequests = pgTable("pickup_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull(),
  address: text("address").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  items: json("items").$type<z.infer<typeof WasteItemSchema>[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  carbonSaved: decimal("carbon_saved", { precision: 10, scale: 2 }).notNull().default('0'),
  pointsAwarded: integer("points_awarded").notNull().default(0),
});

// New notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'PICKUP_REQUEST', 'REWARD_EARNED', etc.
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// New achievements table for gamification
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'FIRST_PICKUP', 'CARBON_MILESTONE', etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  pointsAwarded: integer("points_awarded").notNull(),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export const educationalContent = pgTable("educational_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema definitions for notifications and achievements
export const insertNotificationSchema = createInsertSchema(notifications);
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const insertAchievementSchema = createInsertSchema(achievements);
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// Update existing pickup request schema
export const insertPickupRequestSchema = createInsertSchema(pickupRequests, {
  scheduledDate: z.coerce.date(),
}).extend({
  items: z.array(WasteItemSchema).default([{
    type: 'general',
    description: 'General e-waste pickup',
    quantity: 1,
    estimatedCarbonImpact: 0
  }]),
  status: z.string().default('PENDING'),
  userId: z.number().optional(),
  createdAt: z.date().optional(),
  address: z.string().min(1, "Address is required"),
  carbonSaved: z.number().optional(),
  pointsAwarded: z.number().optional(),
});

export type InsertPickupRequest = z.infer<typeof insertPickupRequestSchema>;
export type PickupRequest = typeof pickupRequests.$inferSelect;


export const insertEducationalContentSchema = createInsertSchema(educationalContent);
export type InsertEducationalContent = z.infer<typeof insertEducationalContentSchema>;
export type EducationalContent = typeof educationalContent.$inferSelect;

export const insertSupportTicketSchema = createInsertSchema(supportTickets);
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

// Marketplace related schemas remain unchanged...
export const ItemCondition = z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']);
export type ItemCondition = z.infer<typeof ItemCondition>;

export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  condition: text("condition").$type<ItemCondition>().notNull(),
  images: json("images").$type<string[]>().notNull(),
  status: text("status").notNull().default('AVAILABLE'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings, {
  images: z.array(z.string()).default([]),
  status: z.string().default('AVAILABLE'),
}).extend({
  condition: ItemCondition,
  price: z.number().positive("Price must be greater than 0"),
});

export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;