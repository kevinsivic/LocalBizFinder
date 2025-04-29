import { 
  users, type User, type InsertUser, 
  businesses, type Business, type InsertBusiness,
  businessHours, type BusinessHours, type InsertBusinessHours,
  issueReports, type IssueReport, type InsertIssueReport,
  ratings, type Rating, type InsertRating
} from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, between, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Business methods
  getAllBusinesses(): Promise<Business[]>;
  getBusinessById(id: number): Promise<Business | undefined>;
  getBusinessesInBounds(south: number, west: number, north: number, east: number): Promise<Business[]>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business>;
  deleteBusiness(id: number): Promise<void>;
  
  // Business hours methods
  getBusinessHours(businessId: number): Promise<BusinessHours[]>;
  setBusinessHours(hours: InsertBusinessHours[]): Promise<BusinessHours[]>;
  
  // Issue report methods
  createIssueReport(report: InsertIssueReport): Promise<IssueReport>;
  getIssueReportById(id: number): Promise<IssueReport | undefined>;
  getIssueReportsByBusiness(businessId: number): Promise<IssueReport[]>;
  getIssueReportsByUser(userId: number): Promise<IssueReport[]>;
  getAllIssueReports(): Promise<IssueReport[]>;
  updateIssueReport(id: number, update: Partial<IssueReport>): Promise<IssueReport>;
  
  // Rating methods
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingById(id: number): Promise<Rating | undefined>;
  getRatingsByBusiness(businessId: number): Promise<Rating[]>;
  getRatingsByUser(userId: number): Promise<Rating[]>;
  getUserRatingForBusiness(userId: number, businessId: number): Promise<Rating | undefined>;
  getAverageRatingForBusiness(businessId: number): Promise<number>;
  updateRating(id: number, rating: Partial<InsertRating>): Promise<Rating>;
  deleteRating(id: number): Promise<void>;
  
  // Session store
  sessionStore: any; // Using any type to avoid type issues with session store
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Create PostgreSQL session store with table creation if needed
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session' // Default table name for sessions
    });

    // Initialize the database with sample data if empty
    this.initializeDatabase();
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        isAdmin: insertUser.isAdmin || false
      })
      .returning();
    return user;
  }

  async getAllBusinesses(): Promise<Business[]> {
    return db.select().from(businesses);
  }

  async getBusinessById(id: number): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async getBusinessesInBounds(south: number, west: number, north: number, east: number): Promise<Business[]> {
    return db.select().from(businesses).where(
      and(
        between(businesses.latitude, south, north),
        between(businesses.longitude, west, east)
      )
    );
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [newBusiness] = await db
      .insert(businesses)
      .values(business)
      .returning();
    return newBusiness;
  }

  async updateBusiness(id: number, businessData: Partial<InsertBusiness>): Promise<Business> {
    const [updatedBusiness] = await db
      .update(businesses)
      .set(businessData)
      .where(eq(businesses.id, id))
      .returning();
      
    if (!updatedBusiness) {
      throw new Error(`Business with id ${id} not found`);
    }
    
    return updatedBusiness;
  }

  async deleteBusiness(id: number): Promise<void> {
    // First delete related business hours
    await db.delete(businessHours).where(eq(businessHours.businessId, id));
    // Then delete the business
    await db.delete(businesses).where(eq(businesses.id, id));
  }

  async getBusinessHours(businessId: number): Promise<BusinessHours[]> {
    return db
      .select()
      .from(businessHours)
      .where(eq(businessHours.businessId, businessId));
  }

  async setBusinessHours(hours: InsertBusinessHours[]): Promise<BusinessHours[]> {
    if (hours.length === 0) return [];
    
    const businessId = hours[0].businessId;
    
    // Delete existing hours for this business
    await db
      .delete(businessHours)
      .where(eq(businessHours.businessId, businessId));
    
    // Insert new hours
    return db
      .insert(businessHours)
      .values(hours)
      .returning();
  }
  
  // Issue report methods
  async createIssueReport(report: InsertIssueReport): Promise<IssueReport> {
    const [newReport] = await db
      .insert(issueReports)
      .values(report)
      .returning();
    return newReport;
  }
  
  async getIssueReportById(id: number): Promise<IssueReport | undefined> {
    const [report] = await db
      .select()
      .from(issueReports)
      .where(eq(issueReports.id, id));
    return report;
  }
  
  async getIssueReportsByBusiness(businessId: number): Promise<IssueReport[]> {
    return db
      .select()
      .from(issueReports)
      .where(eq(issueReports.businessId, businessId))
      .orderBy(desc(issueReports.createdAt));
  }
  
  async getIssueReportsByUser(userId: number): Promise<IssueReport[]> {
    return db
      .select()
      .from(issueReports)
      .where(eq(issueReports.reportedBy, userId))
      .orderBy(desc(issueReports.createdAt));
  }
  
  async getAllIssueReports(): Promise<IssueReport[]> {
    return db
      .select()
      .from(issueReports)
      .orderBy(desc(issueReports.createdAt));
  }
  
  async updateIssueReport(id: number, update: Partial<IssueReport>): Promise<IssueReport> {
    // Ensure updatedAt is set to current time
    const dataToUpdate = {
      ...update,
      updatedAt: new Date()
    };
    
    const [updatedReport] = await db
      .update(issueReports)
      .set(dataToUpdate)
      .where(eq(issueReports.id, id))
      .returning();
      
    if (!updatedReport) {
      throw new Error(`Issue report with id ${id} not found`);
    }
    
    return updatedReport;
  }
  
  // Rating methods
  async createRating(rating: InsertRating): Promise<Rating> {
    try {
      console.log("createRating called with:", rating);
      
      // Check if user already rated this business
      console.log("Checking if user already rated this business");
      const existing = await this.getUserRatingForBusiness(rating.userId, rating.businessId);
      
      console.log("Existing rating:", existing);
      
      if (existing) {
        // If a rating already exists, update it
        console.log("Updating existing rating with ID:", existing.id);
        return this.updateRating(existing.id, rating);
      }
      
      // Create new rating
      console.log("Creating new rating with data:", rating);
      const insertResult = await db
        .insert(ratings)
        .values(rating)
        .returning();
        
      console.log("Insert result:", insertResult);
      
      if (!insertResult || insertResult.length === 0) {
        throw new Error("Failed to insert rating - no rows returned");
      }
      
      const [newRating] = insertResult;
      console.log("New rating created:", newRating);
        
      return newRating;
    } catch (error: any) {
      console.error("Error in createRating:", error);
      // Log the SQL query if available
      if (error.query) {
        console.error("SQL Query:", error.query);
      }
      throw new Error(`Failed to create rating: ${error.message}`);
    }
  }
  
  async getRatingById(id: number): Promise<Rating | undefined> {
    const [rating] = await db
      .select()
      .from(ratings)
      .where(eq(ratings.id, id));
      
    return rating;
  }
  
  async getRatingsByBusiness(businessId: number): Promise<Rating[]> {
    try {
      return db
        .select()
        .from(ratings)
        .where(eq(ratings.businessId, businessId))
        .orderBy(desc(ratings.createdAt));
    } catch (error: any) {
      console.error('SQL Error in getRatingsByBusiness:', error);
      throw new Error(`Failed to fetch ratings: ${error.message}`);
    }
  }
  
  async getRatingsByUser(userId: number): Promise<Rating[]> {
    return db
      .select()
      .from(ratings)
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.createdAt));
  }
  
  async getUserRatingForBusiness(userId: number, businessId: number): Promise<Rating | undefined> {
    try {
      const [rating] = await db
        .select()
        .from(ratings)
        .where(
          and(
            eq(ratings.userId, userId),
            eq(ratings.businessId, businessId)
          )
        );
      
      return rating;
    } catch (error: any) {
      console.error('SQL Error in getUserRatingForBusiness:', error);
      throw new Error(`Failed to fetch your rating: ${error.message}`);
    }
  }
  
  async getAverageRatingForBusiness(businessId: number): Promise<number> {
    try {
      const businessRatings = await this.getRatingsByBusiness(businessId);
      
      if (businessRatings.length === 0) {
        return 0;
      }
      
      const sum = businessRatings.reduce((total, rating) => total + rating.rating, 0);
      const average = sum / businessRatings.length;
      
      // Round to one decimal place
      return Math.round(average * 10) / 10;
    } catch (error: any) {
      console.error('Error fetching average rating:', error);
      throw new Error(`Failed to fetch average rating: ${error.message}`);
    }
  }
  
  async updateRating(id: number, ratingData: Partial<InsertRating>): Promise<Rating> {
    try {
      console.log("Updating rating with ID:", id, "Data:", ratingData);
      
      // Set updated timestamp
      const dataToUpdate = {
        ...ratingData,
        updatedAt: new Date()
      };
      
      console.log("Data to update:", dataToUpdate);
      
      const updateResult = await db
        .update(ratings)
        .set(dataToUpdate)
        .where(eq(ratings.id, id))
        .returning();
      
      console.log("Update result:", updateResult);
        
      if (!updateResult || updateResult.length === 0) {
        throw new Error(`Rating with id ${id} not found`);
      }
      
      const [updatedRating] = updateResult;
      console.log("Rating updated successfully:", updatedRating);
      
      return updatedRating;
    } catch (error: any) {
      console.error("Error in updateRating:", error);
      // Log the SQL query if available
      if (error.query) {
        console.error("SQL Query:", error.query);
      }
      throw new Error(`Failed to update rating: ${error.message}`);
    }
  }
  
  async deleteRating(id: number): Promise<void> {
    await db.delete(ratings).where(eq(ratings.id, id));
  }

  private async initializeDatabase() {
    // Check if we need to initialize the database with sample data
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      // Create admin user
      const adminUser = await this.createUser({
        username: "admin",
        password: "$2b$10$m3HSXMZMjC.AXwljuG5.w.zBOnXjZhXGLg0jA1FNw8O7CeJvW8Wz2", // "admin"
        isAdmin: true
      });
      
      // Create sample businesses
      const sampleBusinesses: InsertBusiness[] = [
        {
          name: "The Local Eatery",
          description: "Farm-to-table restaurant with seasonal menu and locally sourced ingredients.",
          category: "Restaurant",
          address: "123 Main St, Downtown",
          phone: "(555) 123-4567",
          website: "https://thelocaleatery.com",
          latitude: 37.7749,
          longitude: -122.4194,
          imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          createdBy: adminUser.id
        },
        {
          name: "Urban Threads",
          description: "Locally-owned boutique featuring sustainable fashion from local designers.",
          category: "Retail",
          address: "456 Oak St, Uptown",
          phone: "(555) 456-7890",
          website: "https://urbanthreads.com",
          latitude: 37.7750,
          longitude: -122.4184,
          imageUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          createdBy: adminUser.id
        },
        {
          name: "Brew & Bean",
          description: "Cozy neighborhood café with ethically sourced coffee and homemade pastries.",
          category: "Coffee Shop",
          address: "789 Elm St, Midtown",
          phone: "(555) 789-0123",
          website: "https://brewandbean.com",
          latitude: 37.7752,
          longitude: -122.4174,
          imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          createdBy: adminUser.id
        }
      ];
      
      // Add sample businesses
      for (const business of sampleBusinesses) {
        await this.createBusiness(business);
      }
    }
  }
}

export const storage = new DatabaseStorage();
