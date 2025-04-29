import { pgTable, text, serial, integer, boolean, doublePrecision, foreignKey, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define issue status enum
export const issueStatusEnum = pgEnum('issue_status', ['pending', 'in_progress', 'resolved', 'rejected']);

// Define issue types
export const issueTypes = [
  "incorrect-info",
  "closed-permanently",
  "inappropriate-content",
  "duplicate-listing",
  "wrong-location",
  "other"
] as const;

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

// Business categories
export const categories = [
  "Restaurant",
  "Retail",
  "Coffee Shop",
  "Bookstore",
  "Bakery",
  "Boutique",
  "Grocery",
  "Art Gallery",
  "Bar",
  "Other"
] as const;

// Businesses table
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  website: text("website"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  imageUrl: text("image_url"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
});

// Business hours table
export const businessHours = pgTable("business_hours", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 6 = Saturday
  openTime: text("open_time"),
  closeTime: text("close_time"),
  isClosed: boolean("is_closed").default(false).notNull(),
});

// Issue reports table
export const issueReports = pgTable("issue_reports", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  reportedBy: integer("reported_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  issueType: text("issue_type").notNull(), // e.g., "incorrect-info", "closed-permanently"
  description: text("description").notNull(),
  status: text("status", { enum: ['pending', 'in_progress', 'resolved', 'rejected'] }).default('pending').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  adminNotes: text("admin_notes"),
  resolvedBy: integer("resolved_by").references(() => users.id),
});

// --------- RELATIONS ---------

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
  reportedIssues: many(issueReports, { relationName: "reporter" }),
  resolvedIssues: many(issueReports, { relationName: "resolver" }),
}));

// Business relations
export const businessesRelations = relations(businesses, ({ one, many }) => ({
  creator: one(users, {
    fields: [businesses.createdBy],
    references: [users.id],
  }),
  hours: many(businessHours),
  issues: many(issueReports),
}));

// Business hours relations
export const businessHoursRelations = relations(businessHours, ({ one }) => ({
  business: one(businesses, {
    fields: [businessHours.businessId],
    references: [businesses.id],
  }),
}));

// Issue report relations
export const issueReportsRelations = relations(issueReports, ({ one }) => ({
  business: one(businesses, {
    fields: [issueReports.businessId],
    references: [businesses.id],
  }),
  reporter: one(users, {
    fields: [issueReports.reportedBy],
    references: [users.id],
  }),
  resolver: one(users, {
    fields: [issueReports.resolvedBy],
    references: [users.id],
  }),
}));

// --------- SCHEMAS ---------

// User schema
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Business schema
export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
});

// Business hours schema
export const businessHoursSchema = createInsertSchema(businessHours).omit({
  id: true,
});

// Issue report schema
export const issueReportSchema = createInsertSchema(issueReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  resolvedBy: true,
  adminNotes: true,
});

// --------- TYPES ---------
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;
export type BusinessHours = typeof businessHours.$inferSelect;
export type InsertBusinessHours = z.infer<typeof businessHoursSchema>;
export type IssueReport = typeof issueReports.$inferSelect;
export type InsertIssueReport = z.infer<typeof issueReportSchema>;
