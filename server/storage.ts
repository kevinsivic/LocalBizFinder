import { 
  users, type User, type InsertUser, 
  businesses, type Business, type InsertBusiness,
  businessHours, type BusinessHours, type InsertBusinessHours
} from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, between } from "drizzle-orm";
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
  
  // Session store
  sessionStore: any; // Using any type to avoid type issues with session store
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
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
