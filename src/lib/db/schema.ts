import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // ULID or UUID as text
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'editor', 'user'] }).default('user').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
});

export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(), // Markdown format
  categoryId: integer('category_id').references(() => categories.id),
  authorId: text('author_id').notNull().references(() => users.id),
  thumbnailKey: text('thumbnail_key'), // R2 object key
  status: text('status', { enum: ['draft', 'published'] }).default('draft'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
