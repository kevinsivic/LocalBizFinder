import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { categories, insertBusinessSchema } from "@shared/schema";
import { ZodError } from "zod";

// Authorization middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up auth routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Get all businesses (public)
  app.get("/api/businesses", async (req, res) => {
    const { bounds } = req.query;
    
    let businesses;
    if (bounds) {
      try {
        const [south, west, north, east] = (bounds as string).split(",").map(parseFloat);
        businesses = await storage.getBusinessesInBounds(south, west, north, east);
      } catch (error) {
        return res.status(400).json({ message: "Invalid bounds format" });
      }
    } else {
      businesses = await storage.getAllBusinesses();
    }
    res.json(businesses);
  });

  // Get a single business by ID (public)
  app.get("/api/businesses/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid business ID" });
    }

    const business = await storage.getBusinessById(id);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json(business);
  });

  // Create a new business (authenticated users)
  app.post("/api/businesses", requireAuth, async (req, res) => {
    try {
      const businessData = insertBusinessSchema.parse(req.body);
      const business = await storage.createBusiness({
        ...businessData,
        createdBy: req.user.id,
      });
      res.status(201).json(business);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid business data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating business" });
    }
  });

  // Update a business (admin or creator)
  app.put("/api/businesses/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid business ID" });
    }

    const business = await storage.getBusinessById(id);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if user is admin or the creator of the business
    if (!req.user.isAdmin && business.createdBy !== req.user.id) {
      return res.status(403).json({ message: "You don't have permission to update this business" });
    }

    try {
      const businessData = insertBusinessSchema.parse(req.body);
      const updatedBusiness = await storage.updateBusiness(id, businessData);
      res.json(updatedBusiness);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid business data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating business" });
    }
  });

  // Delete a business (admin or creator)
  app.delete("/api/businesses/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid business ID" });
    }

    const business = await storage.getBusinessById(id);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if user is admin or the creator of the business
    if (!req.user.isAdmin && business.createdBy !== req.user.id) {
      return res.status(403).json({ message: "You don't have permission to delete this business" });
    }

    await storage.deleteBusiness(id);
    res.status(204).send();
  });

  // Get categories
  app.get("/api/categories", (req, res) => {
    res.json(categories);
  });

  const httpServer = createServer(app);
  return httpServer;
}
