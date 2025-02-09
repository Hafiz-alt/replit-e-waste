import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPickupRequestSchema, insertEducationalContentSchema, insertSupportTicketSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Pickup Request Routes
  app.post("/api/pickup-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertPickupRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const request = await storage.createPickupRequest(parsed.data);
    res.status(201).json(request);
  });

  app.get("/api/pickup-requests/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const requests = await storage.getPickupRequestsByUser(req.user.id);
    res.json(requests);
  });

  app.patch("/api/pickup-requests/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { status } = req.body;
    await storage.updatePickupRequestStatus(parseInt(req.params.id), status);
    res.sendStatus(200);
  });

  // Educational Content Routes
  app.post("/api/educational-content", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "EDUCATOR" && req.user.role !== "ADMIN") {
      return res.sendStatus(403);
    }
    const parsed = insertEducationalContentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const content = await storage.createEducationalContent(parsed.data);
    res.status(201).json(content);
  });

  app.get("/api/educational-content", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const content = await storage.getAllEducationalContent();
    res.json(content);
  });

  // Support Ticket Routes
  app.post("/api/support-tickets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertSupportTicketSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const ticket = await storage.createSupportTicket(parsed.data);
    res.status(201).json(ticket);
  });

  app.get("/api/support-tickets/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tickets = await storage.getSupportTicketsByUser(req.user.id);
    res.json(tickets);
  });

  app.patch("/api/support-tickets/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "ADMIN") return res.sendStatus(403);
    const { status } = req.body;
    await storage.updateSupportTicketStatus(parseInt(req.params.id), status);
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}
