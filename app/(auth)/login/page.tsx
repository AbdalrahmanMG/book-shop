import LoginForm from "@/components/login/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Book Shop",
  description: "Sign in to access the book management system.",
};

export default function LoginPage() {
  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center p-4 
      bg-linear-to-br from-background via-gray-50 to-secondary/10"
    >
      {/* App Title for visibility */}
      <h1 className="text-4xl font-extrabold text-primary mb-10 tracking-tight">📚 Book Shop</h1>

      <LoginForm />

      {/* Note for testing */}
      <p className="mt-8 text-sm text-muted-foreground dark:text-gray-700 text-center max-w-sm">
        Use:
        <span className="font-mono text-primary/80 dark:text-gray-900 block">
          admin@books.com / admin123
        </span>
        to test the login.
      </p>
    </div>
  );
}
