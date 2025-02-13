import { User, InsertUser, PickupRequest, InsertPickupRequest, EducationalContent, InsertEducationalContent, SupportTicket, InsertSupportTicket, Notification, InsertNotification, Achievement, InsertAchievement, RepairRequest, InsertRepairRequest } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { users, pickupRequests, educationalContent, supportTickets, notifications, achievements, repairRequests } from "@shared/schema";
import { marketplaceListings, MarketplaceListing, InsertMarketplaceListing } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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
  getAllPickupRequests(): Promise<PickupRequest[]>;
  getPickupRequestsByStatus(status: string): Promise<PickupRequest[]>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;

  // Achievement operations
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getAchievementsByUser(userId: number): Promise<Achievement[]>;

  // Existing operations
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

  // New repair request methods
  createRepairRequest(request: InsertRepairRequest): Promise<RepairRequest>;
  getRepairRequestsByUser(userId: number): Promise<RepairRequest[]>;
  getAvailableRepairRequests(): Promise<RepairRequest[]>;
  getTechnicianRepairRequests(technicianId: number): Promise<RepairRequest[]>;
  acceptRepairRequest(id: number, technicianId: number, pickupDate: Date, pickupAddress: string, technicianPhone: string, technicianEmail: string, pickupNotes?: string): Promise<void>;

  // Added methods
  updateRepairStatus(id: number, status: string, estimatedCost?: number): Promise<RepairRequest>;
  confirmRepairEstimate(id: number): Promise<RepairRequest>;

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

  // Implement methods with proper SQL operations
  async updateUserPoints(userId: number, points: number): Promise<void> {
    await db
      .update(users)
      .set({
        points: sql`${users.points} + ${points}`
      })
      .where(eq(users.id, userId));
  }

  async updateUserCarbonSaved(userId: number, carbonSaved: number): Promise<void> {
    await db
      .update(users)
      .set({
        totalCarbonSaved: sql`${users.totalCarbonSaved} + ${carbonSaved}`
      })
      .where(eq(users.id, userId));
  }

  async updatePickupRequestImpact(id: number, carbonSaved: number, points: number): Promise<void> {
    const [request] = await db
      .select()
      .from(pickupRequests)
      .where(eq(pickupRequests.id, id));

    if (request) {
      await db
        .update(pickupRequests)
        .set({
          carbonSaved: sql`${carbonSaved}`,
          pointsAwarded: points
        })
        .where(eq(pickupRequests.id, id));

      // Update user's total carbon saved and points
      await db
        .update(users)
        .set({
          totalCarbonSaved: sql`${users.totalCarbonSaved} + ${carbonSaved}`,
          points: sql`${users.points} + ${points}`
        })
        .where(eq(users.id, request.userId));

      // Create achievement notification
      await this.createNotification({
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
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        points: 0,
        totalCarbonSaved: '0',
      })
      .returning();
    return newUser;
  }

  async createPickupRequest(request: InsertPickupRequest): Promise<PickupRequest> {
    const [pickupRequest] = await db
      .insert(pickupRequests)
      .values({
        ...request,
        carbonSaved: '0',
        pointsAwarded: 0,
        createdAt: new Date(),
      })
      .returning();

    // Create notification for recyclers
    await this.createNotification({
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

  async getAllPickupRequests(): Promise<PickupRequest[]> {
    return db
      .select()
      .from(pickupRequests)
      .orderBy(pickupRequests.createdAt);
  }

  async getPickupRequestsByStatus(status: string): Promise<PickupRequest[]> {
    return db
      .select()
      .from(pickupRequests)
      .where(eq(pickupRequests.status, status))
      .orderBy(pickupRequests.createdAt);
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

  async createRepairRequest(request: InsertRepairRequest): Promise<RepairRequest> {
    const [newRequest] = await db
      .insert(repairRequests)
      .values({
        ...request,
        status: 'PENDING',
        createdAt: new Date(),
      })
      .returning();

    // Create notification for technicians
    await this.createNotification({
      userId: request.userId,
      title: "New Repair Request",
      message: `A new repair request has been created for ${request.deviceType}`,
      type: "REPAIR_REQUEST",
      createdAt: new Date(),
    });

    return newRequest;
  }

  async getRepairRequestsByUser(userId: number): Promise<RepairRequest[]> {
    return db
      .select()
      .from(repairRequests)
      .where(eq(repairRequests.userId, userId))
      .orderBy(sql`${repairRequests.createdAt} DESC`);
  }

  async getAvailableRepairRequests(): Promise<RepairRequest[]> {
    return db
      .select()
      .from(repairRequests)
      .where(eq(repairRequests.status, 'PENDING'))
      .orderBy(sql`${repairRequests.createdAt} DESC`);
  }

  async getTechnicianRepairRequests(technicianId: number): Promise<RepairRequest[]> {
    return db
      .select()
      .from(repairRequests)
      .where(eq(repairRequests.technicianId, technicianId))
      .orderBy(sql`${repairRequests.createdAt} DESC`);
  }

  async acceptRepairRequest(
    id: number,
    technicianId: number,
    pickupDate: Date,
    pickupAddress: string,
    technicianPhone: string,
    technicianEmail: string,
    pickupNotes?: string
  ): Promise<void> {
    const [request] = await db
      .select()
      .from(repairRequests)
      .where(eq(repairRequests.id, id));

    if (request) {
      await db
        .update(repairRequests)
        .set({
          technicianId,
          status: 'ACCEPTED',
          pickupDate,
          pickupAddress,
          technicianPhone,
          technicianEmail,
          pickupNotes
        })
        .where(eq(repairRequests.id, id));

      // Create notification for the user with contact details
      await this.createNotification({
        userId: request.userId,
        title: "Repair Request Accepted",
        message: `Your repair request has been accepted by a technician. 
                 Pickup scheduled for ${pickupDate.toLocaleDateString()}. 
                 Contact: ${technicianPhone} / ${technicianEmail}`,
        type: "REPAIR_UPDATE",
        createdAt: new Date()
      });
    }
  }

  async updateRepairStatus(id: number, status: string, estimatedCost?: number): Promise<RepairRequest> {
    const [request] = await db
      .select()
      .from(repairRequests)
      .where(eq(repairRequests.id, id));

    if (!request) {
      throw new Error("Repair request not found");
    }

    const [updatedRequest] = await db
      .update(repairRequests)
      .set({
        status,
        ...(estimatedCost && { estimatedCost: estimatedCost.toString() }),
      })
      .where(eq(repairRequests.id, id))
      .returning();

    return updatedRequest;
  }

  async confirmRepairEstimate(id: number): Promise<RepairRequest> {
    const [request] = await db
      .select()
      .from(repairRequests)
      .where(eq(repairRequests.id, id));

    if (!request) {
      throw new Error("Repair request not found");
    }

    const [updatedRequest] = await db
      .update(repairRequests)
      .set({
        status: 'ESTIMATE_CONFIRMED'
      })
      .where(eq(repairRequests.id, id))
      .returning();

    // Create notification for technician
    await this.createNotification({
      userId: request.technicianId!,
      title: "Repair Estimate Confirmed",
      message: `The customer has confirmed the repair estimate for ${request.deviceType}. Please proceed with scheduling pickup.`,
      type: "REPAIR_CONFIRMED",
      createdAt: new Date()
    });

    return updatedRequest;
  }
}

export const storage = new DatabaseStorage();