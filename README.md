# 📚 Books Shop Management System

A modern, full-featured book management platform built with Next.js 15, featuring authentication, CRUD operations, and a beautiful, responsive UI.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8)
![React Query](https://img.shields.io/badge/React%20Query-5-ff4154)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18)

## 🌿 Available Branches

This project has **two branches** with different data storage approaches:

### 1️⃣ `json-file-db` Branch (Recommended for Quick Start)

**Perfect for testing and development without external dependencies**

- ✅ No database setup required
- ✅ Uses local JSON file for data storage
- ✅ Works immediately after installation
- ✅ No environment variables needed

**Quick Start:**

```bash
git checkout json-file-db
npm install
npm run dev
```

That's it! The app will work out of the box.

### 2️⃣ `master` Branch (Production-Ready)

**Full-featured version with Supabase database**

- 🗄️ Uses Supabase PostgreSQL database
- 🌐 Deployed on production
- ⚙️ Requires environment configuration
- 🔐 Real database persistence

**Setup Required:** See [Environment Setup](#️-installation) section below.

---

## ✨ Features

### 🔐 Authentication

- Secure server-side authentication
- Protected routes and middleware
- Session management with persistent login state
- Profile dropdown with quick actions

### 📖 Books Management

- **Books Shop Page**: Browse all available books with pagination
- **My Books Page**: Manage your personal book collection
- **Book Details**: Comprehensive view of each book
- **CRUD Operations**: Create, read, update, and delete books
- **Search & Sort**: Find books quickly with search and A-Z/Z-A sorting
- **Loading & Error States**: Smooth UX with React Query state management

### 👤 User Profile

- View and edit profile information (name and email)
- Profile dropdown menu in navbar
- Secure logout functionality

### 🎨 UI/UX

- **Dark Mode Support**: Toggle between light and dark themes
- **Fully Responsive**: Mobile-first design that works on all devices
- **Toast Notifications**: Real-time feedback for user actions
- **Clean Design**: Modern UI with shadcn/ui components

### 🧪 Testing

- Comprehensive unit tests with Vitest
- React Testing Library for component testing
- Coverage reports included

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form + Zod validation
- **Testing**: Vitest + React Testing Library
- **Backend**: Supabase (PostgreSQL database) - master branch only
- **Code Quality**: ESLint + Prettier

## 📋 Prerequisites

- Node.js 18+
- npm or yarn or pnpm
- Supabase account (only required for `master` branch)

## ⚙️ Installation

### Option 1: Quick Start (json-file-db branch) - Recommended for Testing

1. **Clone and switch to json-file-db branch**

   ```bash
   git clone <your-repo-url>
   cd book-shop
   git checkout json-file-db
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

**That's it!** No configuration needed. The app uses a local JSON file for data storage.

---

### Option 2: Full Setup (master branch) - For Production Use

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd book-shop
   # master branch is the default
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env.local` file in the root directory (check `.env.example` for reference):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   **Where to get these values:**
   - Go to your [Supabase Dashboard](https://app.supabase.com/)
   - Select your project (or create a new one)
   - Go to **Settings** → **API**
   - Copy the **Project URL** and **anon/public key**

4. **Database Setup**

   Set up your Supabase database with the required tables:

   **Schema example:**

   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     email TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     password TEXT NOT NULL,
     image TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Books table
   CREATE TABLE books (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     title TEXT NOT NULL,
     description TEXT NOT NULL,
     price DECIMAL NOT NULL,
     category TEXT NOT NULL,
     author TEXT NOT NULL,
     thumbnail TEXT NOT NULL,
     owner_id UUID REFERENCES users(id),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Default Login Credentials

```
Email: admin@books.com
Password: admin123
```

## 📁 Project Structure

```
book-shop/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   └── login/
│   └── (app)/               # Protected dashboard pages
│       ├── books/
│       ├── my-books/
│       └── profile/
├── api/                     # API routes (if needed)
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/
│   ├── books/
│   └── profile/
├── lib/
│   ├── supabase.ts          # Supabase client & utils
│   ├── helper/              # Zod schemas
│   ├── utils.ts
│   ├── hooks/                # Custom React hooks
│   └── providers/
├── types/                   # TypeScript type definitions
├── tests/                   # Test files
└── validation/              # Zod schemas
```

## 🧪 Testing

Run tests with the following commands:

```bash
# Run tests once
npm run test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Coverage report
npm run coverage
```

## 🎯 Available Scripts

| Script               | Description                   |
| -------------------- | ----------------------------- |
| `npm run dev`        | Start development server      |
| `npm run build`      | Build for production          |
| `npm run start`      | Start production server       |
| `npm run lint`       | Run ESLint                    |
| `npm run format`     | Format code with Prettier     |
| `npm run test`       | Run tests                     |
| `npm run test:watch` | Run tests in watch mode       |
| `npm run test:ui`    | Open Vitest UI                |
| `npm run coverage`   | Generate test coverage report |

## 📱 Features Overview

### Books Categories

- Technology
- Science
- History
- Fantasy
- Biography

### Book Card Information

- Title
- Price
- Thumbnail image
- Author
- Category
- Action menu (View, Edit, Delete)

### Book Form Fields

- Title (required)
- Description (required)
- Price (required, numeric)
- Category (required, dropdown)
- Thumbnail URL (required)

### Authorization Rules

- Users can only edit/delete books they authored
- All users can view all books in the shop
- Only authenticated users can create books

## 🎨 UI Components

This project uses **shadcn/ui** components built on top of Radix UI primitives, including:

- Dialog
- Dropdown Menu
- Alert Dialog
- Select
- Label
- Avatar
- Accordion
- Separator
- And more...

All components are fully customizable and follow accessibility best practices.

## 🌙 Dark Mode

Toggle dark mode using the theme switcher in the navbar. Theme preference is persisted across sessions using `next-themes`.

## 🔄 State Management

- **Server State**: React Query for all API calls with caching, background refetching, and optimistic updates
- **Form State**: React Hook Form for performant form handling
- **Theme State**: next-themes for dark mode
- **Client State**: React hooks (useState, useReducer)

## 📝 Form Validation

All forms use Zod schemas for type-safe validation:

- Email format validation
- Required field checks
- String length limits
- Price numeric validation
- Category enum validation

Example validation schema:

```typescript
const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(10, "Description is required (min 10 chars)").max(5000),
  author: z.string().trim().min(1, "Author is required").max(255),
  category: z.enum(categories, { message: "Category is required" }),
  price: z
    .string()
    .min(1, "Price is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price (e.g., 10.00)"),
});
```

## 🏗️ Architecture Decisions

### Why Two Branches?

- **json-file-db**: Perfect for reviewers and developers who want to test the application immediately without setting up external services
- **master**: Production-ready implementation with real database persistence, deployed and ready for real-world use

### Why Supabase?

- PostgreSQL-based (industry standard)
- Built-in authentication
- Real-time capabilities
- Auto-generated REST API
- Easy deployment and scaling

### Why shadcn/ui?

While the requirements specified no third-party UI libraries, shadcn/ui is different:

- Components are copied into your project (not installed as dependency)
- Full control over the code
- Built on Radix UI primitives
- Fully customizable with Tailwind
- Maintains the spirit of building your own components

## 📊 Code Quality

This project follows best practices:

- ✅ Feature-based folder structure
- ✅ Reusable and composable components
- ✅ Type-safe with TypeScript
- ✅ ESLint + Prettier configuration
- ✅ Comprehensive test coverage
- ✅ Mobile-first responsive design
- ✅ Accessibility considerations (ARIA labels, keyboard navigation)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and for evaluation purposes only.

## 🙏 Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query)
- [Supabase](https://supabase.com/)
- [Radix UI](https://www.radix-ui.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

---

**Built with ❤️ using Next.js 15 and modern web technologies**

For questions or issues, please open an issue on GitHub.
