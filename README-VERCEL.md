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

## Storage

Currently uses in-memory storage that initializes with sample blog posts on each serverless function cold start. For production, you would typically:

1. Connect to a database (PostgreSQL, MongoDB, etc.)
2. Update the storage implementation in `server/storage.ts`
3. Add database connection environment variables

The current implementation is perfect for demos and development.