import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { 
  users, type User, type InsertUser,
  businesses, type Business, type InsertBusiness,
  businessHours, type BusinessHours, type InsertBusinessHours
} from "@shared/schema";
import { eq, and, between } from 'drizzle-orm';
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllBusinesses(): Promise<Business[]>;
  getBusinessById(id: number): Promise<Business | undefined>;
  getBusinessesInBounds(south: number, west: number, north: number, east: number): Promise<Business[]>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business>;
  deleteBusiness(id: number): Promise<void>;
  getBusinessHours(businessId: number): Promise<BusinessHours[]>;
  setBusinessHours(hours: InsertBusinessHours[]): Promise<BusinessHours[]>;
  sessionStore: session.SessionStore;
}

export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  sessionStore: session.SessionStore;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.db = drizzle(pool);

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const results = await this.db.insert(users).values(insertUser).returning();
    return results[0];
  }

  async getAllBusinesses(): Promise<Business[]> {
    return await this.db.select().from(businesses);
  }

  async getBusinessById(id: number): Promise<Business | undefined> {
    const results = await this.db.select().from(businesses).where(eq(businesses.id, id));
    return results[0];
  }

  async getBusinessesInBounds(south: number, west: number, north: number, east: number): Promise<Business[]> {
    return await this.db.select().from(businesses).where(
      and(
        between(businesses.latitude, south, north),
        between(businesses.longitude, west, east)
      )
    );
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const results = await this.db.insert(businesses).values(business).returning();
    return results[0];
  }

  async updateBusiness(id: number, businessData: Partial<InsertBusiness>): Promise<Business> {
    const results = await this.db.update(businesses)
      .set(businessData)
      .where(eq(businesses.id, id))
      .returning();
    return results[0];
  }

  async deleteBusiness(id: number): Promise<void> {
    await this.db.delete(businesses).where(eq(businesses.id, id));
    await this.db.delete(businessHours).where(eq(businessHours.businessId, id));
  }

  async getBusinessHours(businessId: number): Promise<BusinessHours[]> {
    return await this.db.select()
      .from(businessHours)
      .where(eq(businessHours.businessId, businessId));
  }

  async setBusinessHours(hours: InsertBusinessHours[]): Promise<BusinessHours[]> {
    if (!hours.length) return [];
    const businessId = hours[0].businessId;

    // Delete existing hours
    await this.db.delete(businessHours)
      .where(eq(businessHours.businessId, businessId));

    // Insert new hours
    return await this.db.insert(businessHours)
      .values(hours)
      .returning();
  }
}

export const storage = new PostgresStorage();