# Vercel Deployment Guide

This project is now configured for Vercel deployment with serverless functions.

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── posts.ts           # GET/POST /api/posts
│   ├── categories.ts      # GET /api/categories  
│   ├── tags.ts           # GET /api/tags
│   └── posts/
│       ├── [slug].ts     # GET /api/posts/[slug]
│       └── [slug]/
│           ├── like.ts   # POST /api/posts/[slug]/like
│           └── comments.ts # GET/POST /api/posts/[slug]/comments
├── client/               # React frontend
├── server/               # Storage and shared logic
└── shared/               # Type definitions
```

## Deployment Steps

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Configure Environment Variables**
   In your Vercel dashboard, add any required environment variables.

3. **Deploy**
   ```bash
   vercel --prod
   ```

## API Endpoints

All API routes work as serverless functions on Vercel:

- `GET /api/posts` - Fetch all posts with filtering
- `GET /api/posts/[slug]` - Fetch single post by slug
- `POST /api/posts/[slug]/like` - Like a post
- `GET /api/posts/[slug]/comments` - Fetch post comments
- `POST /api/posts/[slug]/comments` - Create new comment
- `GET /api/categories` - Fetch all categories
- `GET /api/tags` - Fetch all tags

## Features

- ✅ Serverless API functions
- ✅ Static site generation for frontend
- ✅ CORS enabled for all API routes
- ✅ TypeScript support
- ✅ Sample blog content included
- ✅ In-memory storage (auto-initializes with sample data)

## Database Setup

The project now uses PostgreSQL with Neon database for production:

### Environment Variables Required

Add these to your Vercel project:

```
DATABASE_URL=postgresql://username:password@hostname:5432/database
```

### Database Structure

The application uses:
- **api/_lib/db.ts** - Database connection using Neon serverless
- **api/_lib/storage.ts** - Database operations with Drizzle ORM
- **api/_lib/seed.ts** - Sample data initialization
- **shared/schema.ts** - Type-safe database schema

### Database Features

- ✅ Automatic schema creation with `npm run db:push`
- ✅ Sample data seeding on first startup
- ✅ Full blog functionality (posts, categories, tags, comments)
- ✅ Type-safe queries with Drizzle ORM
- ✅ Optimized for serverless environments

The database automatically initializes with 4 sample blog posts covering AI/LLM, Frontend, Backend, and Hosting topics.