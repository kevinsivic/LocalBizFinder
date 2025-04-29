import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { categories, insertBusinessSchema, issueTypes, type IssueReport, ratingSchema } from "@shared/schema";
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
      // Add additional business validation if needed
      console.log("Received business data:", req.body);
      
      // Sanitize input
      const businessInput: Record<string, any> = {
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        address: req.body.address,
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
        createdBy: req.user!.id, // User is guaranteed to exist due to requireAuth middleware
      };
      
      // Add optional fields if present
      if (req.body.phone) businessInput.phone = req.body.phone;
      if (req.body.website) businessInput.website = req.body.website;
      if (req.body.imageUrl) businessInput.imageUrl = req.body.imageUrl;
      
      // Validate with Zod
      const businessData = insertBusinessSchema.parse(businessInput);
      const business = await storage.createBusiness(businessData);
      
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating business:", error);
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
    if (!req.user!.isAdmin && business.createdBy !== req.user!.id) {
      return res.status(403).json({ message: "You don't have permission to update this business" });
    }

    try {
      console.log("Updating business data:", req.body);
      console.log("Business ID:", id);
      console.log("User:", req.user);
      
      // Sanitize input
      const businessInput: Record<string, any> = {
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        address: req.body.address,
        latitude: typeof req.body.latitude === 'string' ? parseFloat(req.body.latitude) : req.body.latitude,
        longitude: typeof req.body.longitude === 'string' ? parseFloat(req.body.longitude) : req.body.longitude,
        createdBy: business.createdBy, // Preserve original creator
      };
      
      // Add optional fields if present
      if (req.body.phone !== undefined) businessInput.phone = req.body.phone || null;
      if (req.body.website !== undefined) businessInput.website = req.body.website || null;
      if (req.body.imageUrl !== undefined) businessInput.imageUrl = req.body.imageUrl || null;
      
      // Print raw input for debugging
      console.log("Business input before validation:", businessInput);
      
      // Validate with Zod
      const businessData = insertBusinessSchema.parse(businessInput);
      console.log("Validated business data:", businessData);
      
      const updatedBusiness = await storage.updateBusiness(id, businessData);
      console.log("Updated business result:", updatedBusiness);
      return res.json(updatedBusiness);
    } catch (error) {
      console.error("Error updating business:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid business data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error updating business" });
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
    if (!req.user!.isAdmin && business.createdBy !== req.user!.id) {
      return res.status(403).json({ message: "You don't have permission to delete this business" });
    }

    await storage.deleteBusiness(id);
    res.status(204).send();
  });

  // Get categories
  app.get("/api/categories", (req, res) => {
    res.json(categories);
  });

  // Get issue types (public)
  app.get("/api/issue-types", (req, res) => {
    res.json(issueTypes);
  });
  
  // Issue Reports APIs
  // Get all issue reports (admin only)
  app.get("/api/issues", requireAdmin, async (req, res) => {
    try {
      const issues = await storage.getAllIssueReports();
      res.json(issues);
    } catch (error) {
      console.error("Error fetching issue reports:", error);
      res.status(500).send("Failed to fetch issue reports");
    }
  });
  
  // Get issues for a specific business
  app.get("/api/businesses/:id/issues", requireAuth, async (req, res) => {
    const businessId = parseInt(req.params.id);
    if (isNaN(businessId)) {
      return res.status(400).send("Invalid business ID");
    }

    try {
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).send("Business not found");
      }

      // Regular users can only see issues they reported, admins can see all
      if (!req.user?.isAdmin) {
        if (!req.user?.id) {
          return res.status(401).send("Unauthorized");
        }
        const issues = await storage.getIssueReportsByUser(req.user.id);
        const filteredIssues = issues.filter(issue => issue.businessId === businessId);
        return res.json(filteredIssues);
      }

      const issues = await storage.getIssueReportsByBusiness(businessId);
      res.json(issues);
    } catch (error) {
      console.error("Error fetching business issues:", error);
      res.status(500).send("Failed to fetch business issues");
    }
  });
  
  // Create a new issue report
  app.post("/api/businesses/:id/issues", requireAuth, async (req, res) => {
    const businessId = parseInt(req.params.id);
    if (isNaN(businessId)) {
      return res.status(400).send("Invalid business ID");
    }

    try {
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).send("Business not found");
      }

      const { issueType, description } = req.body;
      
      if (!issueType || !description) {
        return res.status(400).send("Issue type and description are required");
      }

      const report = {
        businessId,
        reportedBy: req.user!.id,
        issueType,
        description
      };

      const newReport = await storage.createIssueReport(report);
      res.status(201).json(newReport);
    } catch (error) {
      console.error("Error creating issue report:", error);
      res.status(500).send("Failed to create issue report");
    }
  });
  
  // Update an issue report (admin only)
  app.patch("/api/issues/:id", requireAdmin, async (req, res) => {
    const issueId = parseInt(req.params.id);
    if (isNaN(issueId)) {
      return res.status(400).send("Invalid issue ID");
    }

    try {
      const issue = await storage.getIssueReportById(issueId);
      if (!issue) {
        return res.status(404).send("Issue report not found");
      }

      const { status, adminNotes } = req.body;
      
      // Only allow updating status and admin notes
      const updates: Partial<IssueReport> = {};
      
      if (status) {
        updates.status = status;
      }
      
      if (adminNotes) {
        updates.adminNotes = adminNotes;
      }
      
      // If resolving the issue, set resolvedBy
      if (status === 'resolved') {
        updates.resolvedBy = req.user!.id;
      }

      const updatedIssue = await storage.updateIssueReport(issueId, updates);
      res.json(updatedIssue);
    } catch (error) {
      console.error("Error updating issue report:", error);
      res.status(500).send("Failed to update issue report");
    }
  });

  // --------- Rating APIs ---------
  
  // Get ratings for a business
  app.get("/api/businesses/:id/ratings", async (req, res) => {
    const businessId = parseInt(req.params.id);
    if (isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid business ID" });
    }

    try {
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const ratings = await storage.getRatingsByBusiness(businessId);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching business ratings:", error);
      res.status(500).json({ message: "Failed to fetch business ratings" });
    }
  });
  
  // Get average rating for a business
  app.get("/api/businesses/:id/average-rating", async (req, res) => {
    const businessId = parseInt(req.params.id);
    if (isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid business ID" });
    }

    try {
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const averageRating = await storage.getAverageRatingForBusiness(businessId);
      res.json({ averageRating });
    } catch (error) {
      console.error("Error fetching average rating:", error);
      res.status(500).json({ message: "Failed to fetch average rating" });
    }
  });
  
  // Get user's rating for a business
  app.get("/api/businesses/:id/my-rating", requireAuth, async (req, res) => {
    const businessId = parseInt(req.params.id);
    if (isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid business ID" });
    }

    try {
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const rating = await storage.getUserRatingForBusiness(req.user!.id, businessId);
      res.json(rating || null);
    } catch (error) {
      console.error("Error fetching user rating:", error);
      res.status(500).json({ message: "Failed to fetch your rating" });
    }
  });
  
  // Add or update a rating
  app.post("/api/businesses/:id/ratings", requireAuth, async (req, res) => {
    const businessId = parseInt(req.params.id);
    if (isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid business ID" });
    }

    try {
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Validate rating data
      try {
        const ratingData = ratingSchema.parse({
          businessId,
          userId: req.user!.id,
          rating: req.body.rating,
          comment: req.body.comment || null
        });

        // Make sure rating is between 1 and 5
        if (ratingData.rating < 1 || ratingData.rating > 5) {
          return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const savedRating = await storage.createRating(ratingData);
        res.status(201).json(savedRating);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
        }
        throw error;
      }
    } catch (error) {
      console.error("Error saving rating:", error);
      res.status(500).json({ message: "Failed to save rating" });
    }
  });
  
  // Delete a rating
  app.delete("/api/businesses/:businessId/ratings/:id", requireAuth, async (req, res) => {
    const businessId = parseInt(req.params.businessId);
    const ratingId = parseInt(req.params.id);
    
    if (isNaN(businessId) || isNaN(ratingId)) {
      return res.status(400).json({ message: "Invalid business or rating ID" });
    }

    try {
      const rating = await storage.getRatingById(ratingId);
      if (!rating) {
        return res.status(404).json({ message: "Rating not found" });
      }

      // Check if rating belongs to the user
      if (rating.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to delete this rating" });
      }

      await storage.deleteRating(ratingId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting rating:", error);
      res.status(500).json({ message: "Failed to delete rating" });
    }
  });

  // Health check endpoint for Docker
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
