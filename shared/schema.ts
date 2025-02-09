import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const UserRole = z.enum(['USER', 'RECYCLER', 'TECHNICIAN', 'EDUCATOR', 'ADMIN', 'BUSINESS']);
export type UserRole = z.infer<typeof UserRole>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").$type<UserRole>().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

// Define the structure for e-waste items
export const WasteItemSchema = z.object({
  type: z.string(),
  description: z.string(),
  quantity: z.number().optional(),
  condition: z.string().optional(),
});

export const pickupRequests = pgTable("pickup_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull(),
  address: text("address").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  items: json("items").$type<z.infer<typeof WasteItemSchema>[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

// Create extended schemas that include all fields for forms
export const insertUserSchema = createInsertSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertPickupRequestSchema = createInsertSchema(pickupRequests, {
  scheduledDate: z.coerce.date(),
}).extend({
  items: z.array(WasteItemSchema).default([{
    type: 'general',
    description: 'General e-waste pickup',
    quantity: 1
  }]),
  status: z.string().default('PENDING'),
  userId: z.number().optional(),
  createdAt: z.date().optional(),
  address: z.string().min(1, "Address is required"),
});
export type InsertPickupRequest = z.infer<typeof insertPickupRequestSchema>;
export type PickupRequest = typeof pickupRequests.$inferSelect;

export const insertEducationalContentSchema = createInsertSchema(educationalContent);
export type InsertEducationalContent = z.infer<typeof insertEducationalContentSchema>;
export type EducationalContent = typeof educationalContent.$inferSelect;

export const insertSupportTicketSchema = createInsertSchema(supportTickets);
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;