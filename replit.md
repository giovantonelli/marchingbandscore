# Marching Band Score - Web Application

## Overview

Marching Band Score is a web-based music score marketplace application built for Italian-speaking users. The application allows users to browse, purchase, and download musical scores for marching bands and orchestras. It features user authentication, admin management, and a clean Bootstrap-based interface.

## System Architecture

The application follows a client-side architecture pattern with the following key characteristics:

- **Frontend**: Static HTML/CSS/JavaScript application using Bootstrap 5 for UI components
- **Backend**: Supabase as Backend-as-a-Service (BaaS) for database, authentication, and file storage
- **Deployment**: Simple Python HTTP server for static file serving
- **Language**: Italian interface with English code documentation

## Key Components

### Frontend Architecture
- **Static Web Application**: Pure HTML/CSS/JavaScript without build tools
- **Bootstrap 5**: Responsive UI framework with FontAwesome icons
- **Modular JavaScript**: Class-based architecture with separate managers for different concerns
- **Mobile-Responsive**: Uses Bootstrap's responsive grid system

### Authentication System
- **Supabase Auth**: Handles user registration, login, and session management
- **Role-Based Access**: Admin/user role system for access control
- **Profile Management**: User profiles with purchase history tracking

### Core Managers
- **AuthManager**: Handles authentication state and user sessions
- **ScoreApp**: Main application logic for score browsing and purchasing
- **AdminManager**: Administrative functions for managing scores and orders
- **ProfileManager**: User profile and purchase history management

### Database Schema (Supabase)
- **scores**: Musical score catalog with metadata and file references
- **users**: User profiles with role assignments
- **orders**: Purchase transaction records
- **order_items**: Individual items within orders

### File Storage
- **Supabase Storage**: Used for storing score covers, PDF files, and audio previews
- **Organized Structure**: Separate folders for covers, PDFs, and audio files

## Data Flow

1. **User Authentication**: Users authenticate through Supabase Auth system
2. **Score Browsing**: Scores are loaded from Supabase database and displayed in responsive cards
3. **Purchase Flow**: Orders are created in the database with associated order items
4. **File Access**: Authenticated users can access purchased score files through Supabase Storage
5. **Admin Management**: Admin users can manage scores, view orders, and handle user accounts

## External Dependencies

### Core Services
- **Supabase**: Primary backend service providing database, authentication, and storage
- **Bootstrap 5**: CSS framework for responsive design
- **FontAwesome**: Icon library for UI elements

### CDN Resources
- Bootstrap CSS/JS from jsdelivr CDN
- FontAwesome from cdnjs
- Supabase JavaScript client library

## Deployment Strategy

### Current Setup
- **Python HTTP Server**: Simple static file server running on port 5000
- **Replit Deployment**: Configured for Replit hosting with automatic deployment
- **Static Files**: All application files served as static content

### Environment Configuration
- **Multi-language Support**: Node.js 20 and Python 3.11 modules configured
- **Nix Channel**: Stable 24_05 for consistent package management
- **Workflow Automation**: Parallel workflow execution for development

### Scaling Considerations
- Application is ready for CDN deployment
- Static nature allows for easy horizontal scaling
- Supabase handles backend scaling automatically

## Changelog

```
Changelog:
- June 20, 2025. Initial setup and Supabase integration
- June 20, 2025. Fixed Supabase client configuration with proper credentials
- June 20, 2025. Resolved admin panel access issues - implemented robust role checking system
- June 20, 2025. Added AdminUtils for better user profile management
- June 20, 2025. Created database setup files and documentation for production deployment
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Notes for Development

### Authentication Flow
- The application initializes authentication on page load
- Admin access is restricted and checked on protected pages
- User sessions are managed automatically by Supabase

### File Structure
- Each page has its dedicated JavaScript manager class
- Shared configuration is centralized in supabase-config.js
- CSS follows a component-based approach with custom properties

### Missing Implementation
- Supabase configuration needs actual project URL and API keys
- Payment integration is referenced but not implemented
- Some admin and profile functionality may be incomplete

### Future Enhancements
- Payment gateway integration (Stripe/PayPal)
- Email notifications for purchases
- Advanced search and filtering
- Score preview functionality
- Multi-language support beyond Italian