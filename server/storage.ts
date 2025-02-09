import { User, InsertUser, PickupRequest, InsertPickupRequest, EducationalContent, InsertEducationalContent, SupportTicket, InsertSupportTicket } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pickupRequests: Map<number, PickupRequest>;
  private educationalContent: Map<number, EducationalContent>;
  private supportTickets: Map<number, SupportTicket>;
  sessionStore: session.SessionStore;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.pickupRequests = new Map();
    this.educationalContent = new Map();
    this.supportTickets = new Map();
    this.currentId = {
      users: 1,
      pickupRequests: 1,
      educationalContent: 1,
      supportTickets: 1
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPickupRequest(request: InsertPickupRequest): Promise<PickupRequest> {
    const id = this.currentId.pickupRequests++;
    const pickupRequest = { ...request, id };
    this.pickupRequests.set(id, pickupRequest);
    return pickupRequest;
  }

  async getPickupRequest(id: number): Promise<PickupRequest | undefined> {
    return this.pickupRequests.get(id);
  }

  async getPickupRequestsByUser(userId: number): Promise<PickupRequest[]> {
    return Array.from(this.pickupRequests.values()).filter(
      (request) => request.userId === userId
    );
  }

  async updatePickupRequestStatus(id: number, status: string): Promise<void> {
    const request = await this.getPickupRequest(id);
    if (request) {
      this.pickupRequests.set(id, { ...request, status });
    }
  }

  async createEducationalContent(content: InsertEducationalContent): Promise<EducationalContent> {
    const id = this.currentId.educationalContent++;
    const educationalContent = { ...content, id };
    this.educationalContent.set(id, educationalContent);
    return educationalContent;
  }

  async getEducationalContent(id: number): Promise<EducationalContent | undefined> {
    return this.educationalContent.get(id);
  }

  async getAllEducationalContent(): Promise<EducationalContent[]> {
    return Array.from(this.educationalContent.values());
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const id = this.currentId.supportTickets++;
    const supportTicket = { ...ticket, id };
    this.supportTickets.set(id, supportTicket);
    return supportTicket;
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    return this.supportTickets.get(id);
  }

  async getSupportTicketsByUser(userId: number): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values()).filter(
      (ticket) => ticket.userId === userId
    );
  }

  async updateSupportTicketStatus(id: number, status: string): Promise<void> {
    const ticket = await this.getSupportTicket(id);
    if (ticket) {
      this.supportTickets.set(id, { ...ticket, status });
    }
  }
}

export const storage = new MemStorage();
