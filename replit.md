# Anuj's Blog - Multi-Agent AI Blog Platform

## Overview

This is Anuj's Blog - an advanced multi-agent AI system that automatically fetches the latest AI news and generates comprehensive blog posts. The platform features automated news aggregation from multiple sources, AI-powered content generation with proper attribution, and intelligent diagram creation to enhance reader comprehension. The system includes manual controls for triggering content generation and reviewing AI-generated posts before publication.

## User Preferences

Preferred communication style: Simple, everyday language.
Blog branding: Clean "Anuj's Blog" name without subtitle references to anujmahajan.dev.
Content organization: Dynamic tag-based system instead of fixed categories for flexible content management.
Header navigation: Minimalist design with no public navigation links ("All Posts", "AI" removed) - admin features only.
Admin dashboard: Must include published post management with edit and delete capabilities.
Code cleanup: All Notion-related code removed from the project.
Popular tags: AI (guaranteed), one famous frontend tag, one backend tag, and trending topics.
Content storytelling: Blog content should tell a cohesive story with smooth transitions between sections.
Target audience: Young developer community - content should create engagement and desire to read more.
Enhancement approach: EnhanceAgent should work only on ReviewAgent feedback, not its own knowledge.

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

### Enhanced Multi-Agent AI System
- **News Agent**: Automatically fetches AI news from TechCrunch, arXiv, OpenAI Blog, Anthropic, and Google AI Blog
- **Content Agent**: Generates unique, valuable blog posts with research-backed insights and internal linking
- **Review Agent**: Comprehensive content review including uniqueness, reader value, and storytelling flow analysis
- **Enhance Agent**: Fixes issues found by review agent focusing on narrative cohesion and developer engagement
- **Orchestrator**: Manages the complete pipeline: generate → review → enhance → save
- **Research Integration**: Uses current trends and developments to ensure content relevance and accuracy
- **Internal Linking**: Automatically finds and links to related content on the site for better SEO
- **Source Attribution**: Ensures all generated content properly credits original authors and sources
- **Value Creation**: Focuses on correlating different aspects and providing actionable insights not found elsewhere
- **Storytelling Focus**: Ensures content flows naturally with smooth transitions and maintains developer engagement
- **Narrative Cohesion**: Creates compelling stories that build momentum from introduction to conclusion

### Enhanced Content Management
- **AI-Powered Generation**: Automated blog post creation with uniqueness and value validation
- **Research-Backed Content**: Uses current trends and developments for relevant, accurate information
- **Quality Assurance**: Three-stage pipeline (generate → review → enhance) ensures high-quality output
- **Manual Controls**: Admin dashboard for triggering content generation and reviewing drafts
- **Rich Text**: Markdown support with syntax highlighting and automated diagram insertion
- **Internal SEO**: Automatic internal linking to related content for better site structure
- **External References**: Curated links to authoritative sources for deeper learning
- **SEO**: Comprehensive SEO meta tags, Open Graph, and Twitter Card support
- **Content Structure**: Posts with dynamic tags, featured images, and metadata
- **Value Focus**: Content creation emphasizes actionable insights and practical applications

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