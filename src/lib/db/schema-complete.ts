import { pgTable, uuid, text, boolean, timestamp, decimal, integer, varchar, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// CORE USERS TABLE (Essential user data only)
// ============================================================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('passwordHash').notNull(),
  userType: text('userType').notNull(), // farmer, trader, buyer, admin
  accountType: text('accountType').notNull(), // individual, business
  emailVerified: boolean('emailVerified').default(false),
  emailVerificationToken: text('emailVerificationToken'),
  emailVerificationExpires: timestamp('emailVerificationExpires', { withTimezone: true }),
  pendingEmail: text('pendingEmail'),
  agriLinkVerificationRequested: boolean('agriLinkVerificationRequested').default(false),
  agriLinkVerificationRequestedAt: timestamp('agriLinkVerificationRequestedAt', { withTimezone: true }),
  verificationDocuments: jsonb('verificationDocuments'),
  rejectedDocuments: jsonb('rejectedDocuments'),
  businessName: text('businessName'),
  businessDescription: text('businessDescription'),
  businessLicenseNumber: text('businessLicenseNumber'),
  verificationStatus: text('verificationStatus').default('not_started'),
  verificationSubmittedAt: timestamp('verificationSubmittedAt', { withTimezone: true }),
  passwordResetToken: text('passwordResetToken'),
  passwordResetExpires: timestamp('passwordResetExpires', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// NORMALIZED USERS TABLE (New optimized structure)
// ============================================================================
export const usersNew = pgTable('users_new', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('passwordHash').notNull(),
  userType: text('userType').notNull(), // farmer, trader, buyer, admin
  accountType: text('accountType').notNull(), // individual, business
  emailVerified: boolean('emailVerified').default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// USER PROFILES TABLE (Profile information)
// ============================================================================
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  location: text('location').notNull(),
  phone: text('phone'),
  experience: text('experience'),
  profileImage: text('profileImage'),
  storefrontImage: text('storefrontImage'),
  website: text('website'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// USER VERIFICATION TABLE (New normalized structure)
// ============================================================================
export const userVerificationNew = pgTable('user_verification_new', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  verificationStatus: text('verificationStatus').default('not_started'), // not_started, pending, approved, rejected
  verificationDocuments: jsonb('verificationDocuments'), // Array of document URLs/metadata
  rejectedDocuments: jsonb('rejectedDocuments'), // Reasons for rejection
  verificationSubmittedAt: timestamp('verificationSubmittedAt', { withTimezone: true }),
  agriLinkVerificationRequested: boolean('agriLinkVerificationRequested').default(false),
  agriLinkVerificationRequestedAt: timestamp('agriLinkVerificationRequestedAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// BUSINESS DETAILS TABLE (New normalized structure)
// ============================================================================
export const businessDetailsNew = pgTable('business_details_new', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  businessName: text('businessName'),
  businessDescription: text('businessDescription'),
  businessLicenseNumber: text('businessLicenseNumber'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// EMAIL MANAGEMENT TABLE (for verification tokens, password resets)
// ============================================================================
export const emailManagementNew = pgTable('email_management_new', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  pendingEmail: text('pendingEmail'),
  emailVerificationToken: text('emailVerificationToken'),
  emailVerificationExpires: timestamp('emailVerificationExpires', { withTimezone: true }),
  passwordResetToken: text('passwordResetToken'),
  passwordResetExpires: timestamp('passwordResetExpires', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// ORIGINAL BUSINESS DETAILS TABLE (from production)
// ============================================================================
export const businessDetails = pgTable('business_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull(),
  businessName: text('businessName'),
  businessDescription: text('businessDescription'),
  businessHours: text('businessHours'),
  specialties: text('specialties').array(),
  policies: jsonb('policies'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// ORIGINAL USER VERIFICATION TABLE (from production)
// ============================================================================
export const userVerification = pgTable('user_verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().unique(),
  verified: boolean('verified').default(false),
  phoneVerified: boolean('phoneVerified').default(false),
  verificationStatus: text('verificationStatus').default('not_started'),
  verificationSubmitted: boolean('verificationSubmitted').default(false),
  verificationDocuments: jsonb('verificationDocuments'),
  businessDetailsCompleted: boolean('businessDetailsCompleted').default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// USER RATINGS TABLE (Ratings and certifications)
// ============================================================================
export const userRatings = pgTable('user_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().unique(),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  totalReviews: integer('totalReviews').default(0),
  responseTime: text('responseTime'),
  qualityCertifications: text('qualityCertifications').array(),
  farmingMethods: text('farmingMethods').array(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// USER ADDRESSES TABLE (Shipping and billing addresses)
// ============================================================================
export const userAddresses = pgTable('user_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull(),
  addressType: text('addressType').notNull(), // shipping, billing
  label: text('label'), // Home, Office, etc.
  fullName: text('fullName'),
  addressLine1: text('addressLine1'),
  addressLine2: text('addressLine2'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postalCode'),
  country: text('country'),
  phoneNumber: text('phoneNumber'),
  isDefault: boolean('isDefault').default(false),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// USER SOCIAL TABLE (Social media links)
// ============================================================================
export const userSocial = pgTable('user_social', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().unique(),
  facebook: text('facebook'),
  instagram: text('instagram'),
  telegram: text('telegram'),
  twitter: text('twitter'),
  linkedin: text('linkedin'),
  website: text('website'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// VERIFICATION REQUESTS TABLE (Admin verification workflow)
// ============================================================================
export const verificationRequests = pgTable('verification_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull(),
  userEmail: text('userEmail').notNull(),
  userName: text('userName').notNull(),
  userType: text('userType').notNull(),
  accountType: text('accountType').notNull(),
  businessName: text('businessName'),
  businessDescription: text('businessDescription'),
  businessLicenseNumber: text('businessLicenseNumber'),
  phoneNumber: text('phoneNumber'),
  address: text('address'),
  verificationDocuments: jsonb('verificationDocuments'),
  requestStatus: text('requestStatus').default('pending'), // pending, approved, rejected
  adminNotes: text('adminNotes'),
  submittedAt: timestamp('submittedAt', { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp('reviewedAt', { withTimezone: true }),
  approvedAt: timestamp('approvedAt', { withTimezone: true }),
  rejectedAt: timestamp('rejectedAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// CORE PRODUCTS TABLE (Essential product data only)
// ============================================================================
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('sellerId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category'),
  description: text('description'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// PRODUCT PRICING TABLE (Pricing information)
// ============================================================================
export const productPricing = pgTable('product_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  unit: text('unit').notNull(),
  priceChange: decimal('priceChange', { precision: 5, scale: 2 }),
  lastUpdated: timestamp('lastUpdated', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// PRODUCT INVENTORY TABLE (Stock and quantity information)
// ============================================================================
export const productInventory = pgTable('product_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: text('quantity').notNull(), // TEXT to handle "500 bags in stock" format
  minimumOrder: text('minimumOrder').default('1'),
  availableQuantity: text('availableQuantity'),
  reservedQuantity: text('reservedQuantity').default('0'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// PRODUCT IMAGES TABLE (Product photos and media)
// ============================================================================
export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  imageData: text('imageData').notNull(),
  isPrimary: boolean('isPrimary').default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// PRODUCT DELIVERY TABLE (Shipping and delivery information)
// ============================================================================
export const productDelivery = pgTable('product_delivery', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  location: text('location'),
  sellerType: text('sellerType'),
  sellerName: text('sellerName'),
  deliveryRadius: integer('deliveryRadius'),
  deliveryFee: decimal('deliveryFee', { precision: 10, scale: 2 }),
  deliveryTime: text('deliveryTime'),
  isAvailable: boolean('isAvailable').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// SAVED PRODUCTS TABLE (User favorites/wishlist)
// ============================================================================
export const savedProducts = pgTable('saved_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  productId: uuid('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  savedDate: timestamp('savedDate', { withTimezone: true }).defaultNow(),
  priceWhenSaved: decimal('priceWhenSaved', { precision: 10, scale: 2 }),
  notes: text('notes'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueUserProduct: unique('unique_user_product').on(table.userId, table.productId),
}));

// ============================================================================
// CONVERSATIONS TABLE (Chat conversations)
// ============================================================================
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('productId').references(() => products.id, { onDelete: 'set null' }),
  buyerId: uuid('buyerId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  sellerId: uuid('sellerId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  lastMessage: text('lastMessage'),
  lastMessageTime: timestamp('lastMessageTime', { withTimezone: true }),
  unreadCount: integer('unreadCount').default(0),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// MESSAGES TABLE (Chat messages)
// ============================================================================
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversationId').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('senderId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  messageType: text('messageType').default('text'),
  isRead: boolean('isRead').default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// OFFERS TABLE (Purchase offers and negotiations)
// ============================================================================
export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyerId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  sellerId: uuid('sellerId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  message: text('message'),
  status: text('status').default('pending'), // pending, accepted, rejected, cancelled, completed
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// OFFER REVIEWS TABLE (Post-order reviews)
// ============================================================================
export const offerReviews = pgTable('offer_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  offerId: uuid('offerId').notNull().references(() => offers.id, { onDelete: 'cascade' }),
  reviewerId: uuid('reviewerId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  revieweeId: uuid('revieweeId').notNull().references(() => usersNew.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5 stars
  comment: text('comment'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueOfferReviewer: unique('unique_offer_reviewer').on(table.offerId, table.reviewerId),
}));

// ============================================================================
// RELATIONS
// ============================================================================

// Users relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  products: many(products),
  conversationsAsBuyer: many(conversations, { relationName: 'buyerConversations' }),
  conversationsAsSeller: many(conversations, { relationName: 'sellerConversations' }),
  messages: many(messages),
  offersAsBuyer: many(offers, { relationName: 'buyerOffers' }),
  offersAsSeller: many(offers, { relationName: 'sellerOffers' }),
  reviewsAsReviewer: many(offerReviews, { relationName: 'reviewerReviews' }),
  reviewsAsReviewee: many(offerReviews, { relationName: 'revieweeReviews' }),
  addresses: many(userAddresses),
  social: one(userSocial),
  rating: one(userRatings),
  savedProducts: many(savedProducts),
}));

// UsersNew relations (normalized)
export const usersNewRelations = relations(usersNew, ({ one, many }) => ({
  userProfile: one(userProfiles, {
    fields: [usersNew.id],
    references: [userProfiles.userId],
  }),
  userVerification: one(userVerificationNew, {
    fields: [usersNew.id],
    references: [userVerificationNew.userId],
  }),
  businessDetail: one(businessDetailsNew, {
    fields: [usersNew.id],
    references: [businessDetailsNew.userId],
  }),
  emailManagement: one(emailManagementNew, {
    fields: [usersNew.id],
    references: [emailManagementNew.userId],
  }),
  products: many(products),
  conversationsAsBuyer: many(conversations, { relationName: 'buyerConversations' }),
  conversationsAsSeller: many(conversations, { relationName: 'sellerConversations' }),
  messages: many(messages),
  offersAsBuyer: many(offers, { relationName: 'buyerOffers' }),
  offersAsSeller: many(offers, { relationName: 'sellerOffers' }),
  reviewsAsReviewer: many(offerReviews, { relationName: 'reviewerReviews' }),
  reviewsAsReviewee: many(offerReviews, { relationName: 'revieweeReviews' }),
  addresses: many(userAddresses),
  social: one(userSocial),
  rating: one(userRatings),
  savedProducts: many(savedProducts),
}));

// Products relations
export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(usersNew, {
    fields: [products.sellerId],
    references: [usersNew.id],
  }),
  pricing: many(productPricing),
  inventory: many(productInventory),
  images: many(productImages),
  delivery: many(productDelivery),
  conversations: many(conversations),
  offers: many(offers),
  savedBy: many(savedProducts),
}));

// Product pricing relations
export const productPricingRelations = relations(productPricing, ({ one }) => ({
  product: one(products, {
    fields: [productPricing.productId],
    references: [products.id],
  }),
}));

// Product inventory relations
export const productInventoryRelations = relations(productInventory, ({ one }) => ({
  product: one(products, {
    fields: [productInventory.productId],
    references: [products.id],
  }),
}));

// Product images relations
export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

// Product delivery relations
export const productDeliveryRelations = relations(productDelivery, ({ one }) => ({
  product: one(products, {
    fields: [productDelivery.productId],
    references: [products.id],
  }),
}));

// Conversations relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  product: one(products, {
    fields: [conversations.productId],
    references: [products.id],
  }),
  buyer: one(usersNew, {
    fields: [conversations.buyerId],
    references: [usersNew.id],
    relationName: 'buyerConversations',
  }),
  seller: one(usersNew, {
    fields: [conversations.sellerId],
    references: [usersNew.id],
    relationName: 'sellerConversations',
  }),
  messages: many(messages),
}));

// Messages relations
export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(usersNew, {
    fields: [messages.senderId],
    references: [usersNew.id],
  }),
}));

// Offers relations
export const offersRelations = relations(offers, ({ one, many }) => ({
  product: one(products, {
    fields: [offers.productId],
    references: [products.id],
  }),
  buyer: one(usersNew, {
    fields: [offers.buyerId],
    references: [usersNew.id],
    relationName: 'buyerOffers',
  }),
  seller: one(usersNew, {
    fields: [offers.sellerId],
    references: [usersNew.id],
    relationName: 'sellerOffers',
  }),
  reviews: many(offerReviews),
}));

// Offer reviews relations
export const offerReviewsRelations = relations(offerReviews, ({ one }) => ({
  offer: one(offers, {
    fields: [offerReviews.offerId],
    references: [offers.id],
  }),
  reviewer: one(usersNew, {
    fields: [offerReviews.reviewerId],
    references: [usersNew.id],
    relationName: 'reviewerReviews',
  }),
  reviewee: one(usersNew, {
    fields: [offerReviews.revieweeId],
    references: [usersNew.id],
    relationName: 'revieweeReviews',
  }),
}));

// User addresses relations
export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(usersNew, {
    fields: [userAddresses.userId],
    references: [usersNew.id],
  }),
}));

// User social relations
export const userSocialRelations = relations(userSocial, ({ one }) => ({
  user: one(usersNew, {
    fields: [userSocial.userId],
    references: [usersNew.id],
  }),
}));

// User ratings relations
export const userRatingsRelations = relations(userRatings, ({ one }) => ({
  user: one(usersNew, {
    fields: [userRatings.userId],
    references: [usersNew.id],
  }),
}));

// Saved products relations
export const savedProductsRelations = relations(savedProducts, ({ one }) => ({
  user: one(usersNew, {
    fields: [savedProducts.userId],
    references: [usersNew.id],
  }),
  product: one(products, {
    fields: [savedProducts.productId],
    references: [products.id],
  }),
}));

// Verification requests relations
export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  user: one(usersNew, {
    fields: [verificationRequests.userId],
    references: [usersNew.id],
  }),
}));

// Business details relations
export const businessDetailsRelations = relations(businessDetails, ({ one }) => ({
  user: one(usersNew, {
    fields: [businessDetails.userId],
    references: [usersNew.id],
  }),
}));

// User verification relations
export const userVerificationRelations = relations(userVerification, ({ one }) => ({
  user: one(usersNew, {
    fields: [userVerification.userId],
    references: [usersNew.id],
  }),
}));

// User verification new relations
export const userVerificationNewRelations = relations(userVerificationNew, ({ one }) => ({
  user: one(usersNew, {
    fields: [userVerificationNew.userId],
    references: [usersNew.id],
  }),
}));

// Business details new relations
export const businessDetailsNewRelations = relations(businessDetailsNew, ({ one }) => ({
  user: one(usersNew, {
    fields: [businessDetailsNew.userId],
    references: [usersNew.id],
  }),
}));

// Email management new relations
export const emailManagementNewRelations = relations(emailManagementNew, ({ one }) => ({
  user: one(usersNew, {
    fields: [emailManagementNew.userId],
    references: [usersNew.id],
  }),
}));

// User profiles relations
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(usersNew, {
    fields: [userProfiles.userId],
    references: [usersNew.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof usersNew.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type UserVerification = typeof userVerification.$inferSelect;
export type UserVerificationNew = typeof userVerificationNew.$inferSelect;
export type BusinessDetails = typeof businessDetails.$inferSelect;
export type BusinessDetailsNew = typeof businessDetailsNew.$inferSelect;
export type EmailManagement = typeof emailManagementNew.$inferSelect;
export type UserRating = typeof userRatings.$inferSelect;
export type UserAddress = typeof userAddresses.$inferSelect;
export type UserSocial = typeof userSocial.$inferSelect;
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductPricing = typeof productPricing.$inferSelect;
export type ProductInventory = typeof productInventory.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type ProductDelivery = typeof productDelivery.$inferSelect;
export type SavedProduct = typeof savedProducts.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type OfferReview = typeof offerReviews.$inferSelect;
