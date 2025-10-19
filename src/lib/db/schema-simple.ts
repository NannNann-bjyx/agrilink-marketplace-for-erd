import { pgTable, uuid, text, boolean, timestamp, decimal, integer, varchar } from 'drizzle-orm/pg-core';

// Users table - simplified for initial setup
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  userType: text('user_type').notNull(), // farmer, trader, buyer, admin
  accountType: text('account_type').notNull(), // individual, business
  location: text('location').notNull(),
  phone: text('phone'),
  verified: boolean('verified').default(false),
  phoneVerified: boolean('phone_verified').default(false),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Products table - simplified
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  unit: text('unit').notNull(),
  location: text('location').notNull(),
  sellerType: text('seller_type').notNull(), // farmer, trader
  sellerName: text('seller_name').notNull(),
  image: text('image'),
  quantity: text('quantity').notNull(),
  category: text('category'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastMessage: text('last_message'),
  lastMessageTime: timestamp('last_message_time', { withTimezone: true }),
  unreadCount: integer('unread_count').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  messageType: text('message_type').default('text'), // text, image, file, offer
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
