# Nail Salon Admin System

This is an admin-only management system for a nail salon business. The client-facing UI has been removed to focus solely on administrative functionality.

## Features (Admin Only)

- **Admin Authentication**: Secure login system for administrators
- **Reservation Management**: View, create, edit, and manage client reservations
- **Client Management**: Manage client information and history
- **Service Management**: Create and manage services offered
- **Inventory Management**: Track and manage salon inventory
- **Statistics & Analytics**: View business performance metrics
- **Expense & Revenue Tracking**: Financial management tools
- **Settings Management**: System configuration

## Quick Start

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access Admin Panel**:
   - Navigate to `http://localhost:3000/admin/login`
   - The root URL (`/`) automatically redirects to admin login

## Tech Stack

- **Frontend**: React + Vite, Bootstrap, Framer Motion
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Authentication**: JWT tokens

## Note

This system has been refactored to remove all client-facing functionality. Client pages, components, and related backend routes have been removed to create a streamlined admin-only interface.