import { User, InsertUser, PickupRequest, InsertPickupRequest, EducationalContent, InsertEducationalContent, SupportTicket, InsertSupportTicket, Notification, InsertNotification, Achievement, InsertAchievement } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, pickupRequests, educationalContent, supportTickets, notifications, achievements } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { marketplaceListings, MarketplaceListing, InsertMarketplaceListing } from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<void>;
  updateUserCarbonSaved(userId: number, carbonSaved: number): Promise<void>;

  // Pickup request operations
  createPickupRequest(request: InsertPickupRequest): Promise<PickupRequest>;
  getPickupRequest(id: number): Promise<PickupRequest | undefined>;
  getPickupRequestsByUser(userId: number): Promise<PickupRequest[]>;
  updatePickupRequestStatus(id: number, status: string): Promise<void>;
  updatePickupRequestImpact(id: number, carbonSaved: number, points: number): Promise<void>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;

  // Achievement operations
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getAchievementsByUser(userId: number): Promise<Achievement[]>;

  // Existing operations remain unchanged...
  createEducationalContent(content: InsertEducationalContent): Promise<EducationalContent>;
  getEducationalContent(id: number): Promise<EducationalContent | undefined>;
  getAllEducationalContent(): Promise<EducationalContent[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  getSupportTicketsByUser(userId: number): Promise<SupportTicket[]>;
  updateSupportTicketStatus(id: number, status: string): Promise<void>;
  createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing>;
  getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined>;
  getAllMarketplaceListings(): Promise<MarketplaceListing[]>;
  getUserMarketplaceListings(userId: number): Promise<MarketplaceListing[]>;
  updateMarketplaceListingStatus(id: number, status: string): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Implement new methods

  async updateUserPoints(userId: number, points: number): Promise<void> {
    await db
      .update(users)
      .set({ points: db.raw(`points + ${points}`) })
      .where(eq(users.id, userId));
  }

  async updateUserCarbonSaved(userId: number, carbonSaved: number): Promise<void> {
    await db
      .update(users)
      .set({ totalCarbonSaved: db.raw(`total_carbon_saved + ${carbonSaved}`) })
      .where(eq(users.id, userId));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async getAchievementsByUser(userId: number): Promise<Achievement[]> {
    return db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(achievements.earnedAt);
  }

  async updatePickupRequestImpact(id: number, carbonSaved: number, points: number): Promise<void> {
    const [request] = await db
      .select()
      .from(pickupRequests)
      .where(eq(pickupRequests.id, id));

    await db
      .update(pickupRequests)
      .set({ carbonSaved, pointsAwarded: points })
      .where(eq(pickupRequests.id, id));

    if (request) {
      // Update user's total carbon saved and points
      await db
        .update(users)
        .set({ 
          totalCarbonSaved: db.raw(`total_carbon_saved + ${carbonSaved}`),
          points: db.raw(`points + ${points}`)
        })
        .where(eq(users.id, request.userId));

      // Create achievement notification
      await db.insert(notifications).values({
        userId: request.userId,
        title: "Environmental Impact",
        message: `You've saved ${carbonSaved}kg of CO2 and earned ${points} points!`,
        type: "ACHIEVEMENT",
        createdAt: new Date(),
      });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async createPickupRequest(request: InsertPickupRequest): Promise<PickupRequest> {
    const [pickupRequest] = await db
      .insert(pickupRequests)
      .values({
        ...request,
        userId: request.userId!, // User ID is now required
        scheduledDate: request.scheduledDate,
        createdAt: new Date(),
      })
      .returning();

    // Create notification for recyclers
    await db.insert(notifications).values({
      userId: request.userId!,
      title: "New Pickup Request",
      message: `A new pickup request has been created for address: ${request.address}`,
      type: "PICKUP_REQUEST",
      createdAt: new Date(),
    });

    return pickupRequest;
  }

  async getPickupRequest(id: number): Promise<PickupRequest | undefined> {
    const [request] = await db
      .select()
      .from(pickupRequests)
      .where(eq(pickupRequests.id, id));
    return request;
  }

  async getPickupRequestsByUser(userId: number): Promise<PickupRequest[]> {
    return db
      .select()
      .from(pickupRequests)
      .where(eq(pickupRequests.userId, userId));
  }

  async updatePickupRequestStatus(id: number, status: string): Promise<void> {
    const [request] = await db
      .select()
      .from(pickupRequests)
      .where(eq(pickupRequests.id, id));

    await db
      .update(pickupRequests)
      .set({ status })
      .where(eq(pickupRequests.id, id));

    // Create notification for user
    if (request) {
      await db.insert(notifications).values({
        userId: request.userId,
        title: "Pickup Request Update",
        message: `Your pickup request status has been updated to ${status}`,
        type: "STATUS_UPDATE",
        createdAt: new Date(),
      });
    }
  }

  async createEducationalContent(content: InsertEducationalContent): Promise<EducationalContent> {
    const [newContent] = await db
      .insert(educationalContent)
      .values({
        ...content,
        createdAt: new Date(),
      })
      .returning();
    return newContent;
  }

  async getEducationalContent(id: number): Promise<EducationalContent | undefined> {
    const [content] = await db
      .select()
      .from(educationalContent)
      .where(eq(educationalContent.id, id));
    return content;
  }

  async getAllEducationalContent(): Promise<EducationalContent[]> {
    return db.select().from(educationalContent);
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const [newTicket] = await db
      .insert(supportTickets)
      .values({
        ...ticket,
        createdAt: new Date(),
      })
      .returning();
    return newTicket;
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id));
    return ticket;
  }

  async getSupportTicketsByUser(userId: number): Promise<SupportTicket[]> {
    return db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId));
  }

  async updateSupportTicketStatus(id: number, status: string): Promise<void> {
    await db
      .update(supportTickets)
      .set({ status })
      .where(eq(supportTickets.id, id));
  }

  async createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing> {
    const [newListing] = await db
      .insert(marketplaceListings)
      .values({
        ...listing,
        createdAt: new Date(),
      })
      .returning();
    return newListing;
  }

  async getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined> {
    const [listing] = await db
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.id, id));
    return listing;
  }

  async getAllMarketplaceListings(): Promise<MarketplaceListing[]> {
    return db.select().from(marketplaceListings);
  }

  async getUserMarketplaceListings(userId: number): Promise<MarketplaceListing[]> {
    return db
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.sellerId, userId));
  }

  async updateMarketplaceListingStatus(id: number, status: string): Promise<void> {
    await db
      .update(marketplaceListings)
      .set({ status })
      .where(eq(marketplaceListings.id, id));
  }
}

export const storage = new DatabaseStorage();