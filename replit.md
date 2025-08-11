# Anuj's Blog - A Modern Full-Stack Blog Platform

## Overview

This is Anuj's Blog - a modern full-stack blog platform focused on technical content covering AI/LLM, backend technologies, frontend frameworks, and hosting solutions. The application features a React frontend with TypeScript, Express.js backend, and Notion CMS integration for easy content management. The blog is designed to complement anujmahajan.dev with professional technical writing and insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, modern UI components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Theme**: Dark/light mode support with system preference detection

### Backend Architecture
- **Runtime**: Node.js with Express.js framework (Replit) / Vercel serverless functions (Vercel)
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **File Structure**: Modular route handlers with separate storage layer abstraction
- **Development**: Hot reloading with Vite integration in development mode
- **Deployment**: Dual deployment support - Replit for development and Vercel for production

### Database & ORM
- **Database**: PostgreSQL as the primary database (Neon for production)
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema**: Well-structured schema with users, posts, categories, tags, and comments
- **Relationships**: Proper foreign key relationships between entities
- **Storage Layer**: Abstracted storage interface with PostgreSQL implementation for production
- **Deployment**: Dual storage - PostgreSQL for production (api/_lib/), in-memory for development (server/)

### Authentication & Authorization
- **Current State**: Basic user structure in place but no authentication implemented
- **Architecture**: Ready for session-based or JWT authentication integration
- **User Management**: User entity with email, username, and profile information

### Content Management
- **Rich Text**: Markdown support with syntax highlighting for code blocks
- **Media Handling**: Google Cloud Storage integration with Uppy for file uploads
- **SEO**: Comprehensive SEO meta tags, Open Graph, and Twitter Card support
- **Content Structure**: Posts with categories, tags, featured images, and metadata

### UI/UX Design Patterns
- **Component Library**: Comprehensive shadcn/ui components with consistent theming
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Interactive Elements**: Toast notifications, modals, and smooth transitions
- **Accessibility**: ARIA labels and keyboard navigation support

## External Dependencies

### Cloud Services
- **Neon Database**: PostgreSQL hosting service (via @neondatabase/serverless)
- **Vercel**: Production deployment platform with serverless functions

### UI Libraries
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Lucide React**: Modern icon library with consistent styling
- **Uppy**: Modular file uploader with cloud storage support

### Development Tools
- **Vite**: Fast build tool with HMR and development server
- **ESBuild**: JavaScript bundler for production builds
- **Drizzle Kit**: Database migration and schema management tools

### Utility Libraries
- **Date-fns**: Date manipulation and formatting
- **React Markdown**: Markdown rendering with custom components
- **Prism**: Syntax highlighting for code blocks
- **Zod**: Runtime type validation and schema definition

### Styling & Theming
- **Tailwind CSS**: Utility-first CSS framework
- **Class Variance Authority**: Type-safe component variants
- **PostCSS**: CSS processing with autoprefixer