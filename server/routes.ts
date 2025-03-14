import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPickupRequestSchema, insertEducationalContentSchema, insertSupportTicketSchema, insertRepairRequestSchema } from "@shared/schema";
import { WebSocketServer, WebSocket } from 'ws';

// Keep track of connected clients
const clients = new Map<number, WebSocket>();

export function registerRoutes(app: Express): Server {
  setupAuth(app);
  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    if (!req.url) return;

    // Get user ID from query parameter
    const userId = parseInt(new URL(req.url, 'http://localhost').searchParams.get('userId') || '0');
    if (userId) {
      clients.set(userId, ws);

      ws.on('close', () => {
        clients.delete(userId);
      });
    }
  });

  // Helper function to send updates to specific users
  const sendUpdate = (userId: number, type: string, data: any) => {
    const client = clients.get(userId);
    if (client?.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, data }));
    }
  };

  // Repair Request Routes
  app.post("/api/repair-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertRepairRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    try {
      const request = await storage.createRepairRequest(parsed.data);
      res.status(201).json(request);

      // Notify relevant technicians about new request
      const technicianClients = Array.from(clients.entries())
        .filter(([_, ws]) => ws.readyState === WebSocket.OPEN);

      technicianClients.forEach(([techId, ws]) => {
        ws.send(JSON.stringify({
          type: 'NEW_REPAIR_REQUEST',
          data: request
        }));
      });
    } catch (error) {
      console.error("Failed to create repair request:", error);
      res.status(500).json({ message: "Failed to create repair request" });
    }
  });

  app.get("/api/repair-requests/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const requests = await storage.getRepairRequestsByUser(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Failed to fetch user repair requests:", error);
      res.status(500).json({ message: "Failed to fetch repair requests" });
    }
  });

  app.get("/api/repair-requests/available", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "TECHNICIAN") return res.sendStatus(403);
    try {
      const requests = await storage.getAvailableRepairRequests();
      res.json(requests);
    } catch (error) {
      console.error("Failed to fetch available repair requests:", error);
      res.status(500).json({ message: "Failed to fetch repair requests" });
    }
  });

  app.get("/api/repair-requests/technician", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "TECHNICIAN") return res.sendStatus(403);
    try {
      const requests = await storage.getTechnicianRepairRequests(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Failed to fetch technician repair requests:", error);
      res.status(500).json({ message: "Failed to fetch repair requests" });
    }
  });

  app.patch("/api/repair-requests/:id/accept", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "TECHNICIAN") return res.sendStatus(403);

    const { pickupDate, pickupAddress, technicianPhone, technicianEmail, pickupNotes } = req.body;

    try {
      await storage.acceptRepairRequest(
        parseInt(req.params.id),
        req.user.id,
        new Date(pickupDate),
        pickupAddress,
        technicianPhone,
        technicianEmail,
        pickupNotes
      );
      res.sendStatus(200);
    } catch (error) {
      console.error("Failed to accept repair request:", error);
      res.status(500).json({ message: "Failed to accept repair request" });
    }
  });

  app.patch("/api/repair-requests/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { status, estimatedCost } = req.body;

    try {
      const request = await storage.updateRepairStatus(
        parseInt(req.params.id),
        status,
        estimatedCost
      );

      // Send real-time update to both user and technician
      sendUpdate(request.userId, 'REPAIR_STATUS_UPDATE', request);
      if (request.technicianId) {
        sendUpdate(request.technicianId, 'REPAIR_STATUS_UPDATE', request);
      }

      // Create notification for cost estimate
      if (estimatedCost) {
        await storage.createNotification({
          userId: request.userId,
          title: "Repair Cost Estimate",
          message: `Your repair for ${request.deviceType} has been estimated at $${estimatedCost}. Please review and confirm to proceed with pickup scheduling.`,
          type: "REPAIR_ESTIMATE",
          createdAt: new Date()
        });
      }

      res.json(request);
    } catch (error) {
      console.error("Failed to update repair status:", error);
      res.status(500).json({ message: "Failed to update repair status" });
    }
  });

  app.post("/api/repair-requests/:id/confirm", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const request = await storage.confirmRepairEstimate(parseInt(req.params.id));
      res.json(request);
    } catch (error) {
      console.error("Failed to confirm repair estimate:", error);
      res.status(500).json({ message: "Failed to confirm repair estimate" });
    }
  });


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

  return httpServer;
}