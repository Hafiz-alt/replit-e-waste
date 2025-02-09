import { User, InsertUser, PickupRequest, InsertPickupRequest, EducationalContent, InsertEducationalContent, SupportTicket, InsertSupportTicket } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, pickupRequests, educationalContent, supportTickets } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Pickup request operations
  createPickupRequest(request: InsertPickupRequest): Promise<PickupRequest>;
  getPickupRequest(id: number): Promise<PickupRequest | undefined>;
  getPickupRequestsByUser(userId: number): Promise<PickupRequest[]>;
  updatePickupRequestStatus(id: number, status: string): Promise<void>;

  // Educational content operations
  createEducationalContent(content: InsertEducationalContent): Promise<EducationalContent>;
  getEducationalContent(id: number): Promise<EducationalContent | undefined>;
  getAllEducationalContent(): Promise<EducationalContent[]>;

  // Support ticket operations
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  getSupportTicketsByUser(userId: number): Promise<SupportTicket[]>;
  updateSupportTicketStatus(id: number, status: string): Promise<void>;

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

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createPickupRequest(request: InsertPickupRequest): Promise<PickupRequest> {
    const [pickupRequest] = await db
      .insert(pickupRequests)
      .values({
        ...request,
        scheduledDate: request.scheduledDate,
        createdAt: new Date(),
      })
      .returning();
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
    await db
      .update(pickupRequests)
      .set({ status })
      .where(eq(pickupRequests.id, id));
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
}

export const storage = new DatabaseStorage();