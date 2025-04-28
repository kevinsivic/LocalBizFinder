import { 
  users, type User, type InsertUser, 
  businesses, type Business, type InsertBusiness,
  businessHours, type BusinessHours, type InsertBusinessHours
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private businesses: Map<number, Business>;
  private businessHoursData: Map<number, BusinessHours[]>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private businessIdCounter: number;
  private businessHoursIdCounter: number;

  constructor() {
    this.users = new Map();
    this.businesses = new Map();
    this.businessHoursData = new Map();
    this.userIdCounter = 1;
    this.businessIdCounter = 1;
    this.businessHoursIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    });
    
    // Create an admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$m3HSXMZMjC.AXwljuG5.w.zBOnXjZhXGLg0jA1FNw8O7CeJvW8Wz2", // "admin"
      isAdmin: true
    });
    
    // Create some sample data
    this.createSampleData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin || false
    };
    this.users.set(id, user);
    return user;
  }

  async getAllBusinesses(): Promise<Business[]> {
    return Array.from(this.businesses.values());
  }

  async getBusinessById(id: number): Promise<Business | undefined> {
    return this.businesses.get(id);
  }

  async getBusinessesInBounds(south: number, west: number, north: number, east: number): Promise<Business[]> {
    return Array.from(this.businesses.values()).filter(business => {
      return (
        business.latitude >= south &&
        business.latitude <= north &&
        business.longitude >= west &&
        business.longitude <= east
      );
    });
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const id = this.businessIdCounter++;
    const newBusiness: Business = { ...business, id };
    this.businesses.set(id, newBusiness);
    return newBusiness;
  }

  async updateBusiness(id: number, businessData: Partial<InsertBusiness>): Promise<Business> {
    const existingBusiness = this.businesses.get(id);
    if (!existingBusiness) {
      throw new Error(`Business with id ${id} not found`);
    }
    
    const updatedBusiness: Business = {
      ...existingBusiness,
      ...businessData,
    };
    
    this.businesses.set(id, updatedBusiness);
    return updatedBusiness;
  }

  async deleteBusiness(id: number): Promise<void> {
    this.businesses.delete(id);
    // Also delete related business hours
    this.businessHoursData.delete(id);
  }

  async getBusinessHours(businessId: number): Promise<BusinessHours[]> {
    return this.businessHoursData.get(businessId) || [];
  }

  async setBusinessHours(hours: InsertBusinessHours[]): Promise<BusinessHours[]> {
    const businessId = hours[0]?.businessId;
    if (!businessId) return [];
    
    const businessHours: BusinessHours[] = hours.map(hour => ({
      ...hour,
      id: this.businessHoursIdCounter++
    }));
    
    this.businessHoursData.set(businessId, businessHours);
    return businessHours;
  }

  private createSampleData() {
    // Sample businesses for demonstration
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
        createdBy: 1
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
        createdBy: 1
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
        createdBy: 1
      }
    ];

    // Add sample businesses
    sampleBusinesses.forEach(business => {
      this.createBusiness(business);
    });
  }
}

export const storage = new MemStorage();
