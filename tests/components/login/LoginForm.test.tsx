import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/components/login/LoginForm";
import { loginAction } from "@/api/auth";

vi.mock("@/api/auth", () => ({
  loginAction: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form", () => {
    render(<LoginForm />);

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("should show validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email is required.")).toBeInTheDocument();
      expect(screen.getByText("Password is required.")).toBeInTheDocument();
    });
  });

  it("should call loginAction with correct data on submit", async () => {
    const user = userEvent.setup();
    vi.mocked(loginAction).mockResolvedValue(undefined);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(loginAction).toHaveBeenCalledWith(expect.any(FormData));
    });

    const formData = vi.mocked(loginAction).mock.calls[0][0] as FormData;
    expect(formData.get("email")).toBe("test@example.com");
    expect(formData.get("password")).toBe("password123");
  });

  it("should show error message when login fails", async () => {
    const user = userEvent.setup();
    vi.mocked(loginAction).mockResolvedValue({
      error: "Invalid credentials",
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("should show server field errors when validation fails on server", async () => {
    const user = userEvent.setup();
    vi.mocked(loginAction).mockResolvedValue({
      error: "Validation Failed",
      fieldErrors: {
        email: ["Invalid email format"],
        password: ["Password is too short"],
      },
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email format")).toBeInTheDocument();
      expect(screen.getByText("Password is too short")).toBeInTheDocument();
    });
  });

  it("should disable submit button while submitting", async () => {
    const user = userEvent.setup();
    vi.mocked(loginAction).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100)),
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText("Logging In...")).toBeInTheDocument();
    });
  });

  it("should clear previous errors on new submit", async () => {
    const user = userEvent.setup();
    vi.mocked(loginAction).mockResolvedValueOnce({
      error: "First error",
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("First error")).toBeInTheDocument();
    });

    vi.mocked(loginAction).mockResolvedValueOnce(undefined);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText("First error")).not.toBeInTheDocument();
    });
  });

  it("should have correct placeholder text", () => {
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText("admin@books.com");
    const passwordInput = screen.getByPlaceholderText("******");

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it("should have correct input types", () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute("type", "email");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should have autocomplete attributes", () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute("autocomplete", "email");
    expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
  });
});
