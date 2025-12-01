import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { BookForm, BookFormData } from "@/components/books/BookForm";
import React from "react";

// Mock next/image
vi.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Add missing DOM APIs for Radix UI
beforeAll(() => {
  HTMLElement.prototype.hasPointerCapture = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

// Wrapper component to provide form context
function BookFormWrapper({
  onSubmit,
  defaultValues,
  initialThumbnailUrl,
  isSubmitting = false,
}: {
  onSubmit: (data: BookFormData) => void;
  defaultValues?: Partial<BookFormData>;
  initialThumbnailUrl?: string | null;
  isSubmitting?: boolean;
}) {
  const form = useForm<BookFormData>({
    defaultValues: {
      title: "",
      description: "",
      author: "",
      category: "Technology" as const,
      price: "",
      thumbnail: null,
      ...defaultValues,
    },
  });

  return (
    <BookForm
      form={form}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Submit"
      initialThumbnailUrl={initialThumbnailUrl}
    />
  );
}

describe("BookForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields correctly", () => {
    const mockSubmit = vi.fn();
    render(<BookFormWrapper onSubmit={mockSubmit} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/thumbnail image/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("displays placeholder text correctly", () => {
    const mockSubmit = vi.fn();
    render(<BookFormWrapper onSubmit={mockSubmit} />);

    expect(screen.getByPlaceholderText("The Great Gatsby")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("F. Scott Fitzgerald")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Provide a detailed summary...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., 19.99")).toBeInTheDocument();
  });

  it("allows user to fill in text inputs", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<BookFormWrapper onSubmit={mockSubmit} />);

    const titleInput = screen.getByLabelText(/title/i);
    const authorInput = screen.getByLabelText(/author/i);
    const priceInput = screen.getByLabelText(/price/i);

    await user.type(titleInput, "Test Book");
    await user.type(authorInput, "Test Author");
    await user.type(priceInput, "29.99");

    expect(titleInput).toHaveValue("Test Book");
    expect(authorInput).toHaveValue("Test Author");
    expect(priceInput).toHaveValue("29.99");
  });

  it("allows user to fill in textarea", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<BookFormWrapper onSubmit={mockSubmit} />);

    const descriptionTextarea = screen.getByLabelText(/description/i);
    await user.type(descriptionTextarea, "This is a test description");

    expect(descriptionTextarea).toHaveValue("This is a test description");
  });

  it("submits form with correct data", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<BookFormWrapper onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText(/title/i), "Test Book");
    await user.type(screen.getByLabelText(/author/i), "Test Author");
    await user.type(screen.getByLabelText(/description/i), "Test Description");
    await user.type(screen.getByLabelText(/price/i), "19.99");

    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    const callArgs = mockSubmit.mock.calls[0][0];
    expect(callArgs).toMatchObject({
      title: "Test Book",
      author: "Test Author",
      description: "Test Description",
      price: "19.99",
      category: "Technology",
    });
  });

  it("displays loading state when isSubmitting is true", () => {
    const mockSubmit = vi.fn();

    render(<BookFormWrapper onSubmit={mockSubmit} isSubmitting={true} />);

    const submitButton = screen.getByRole("button");
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/submit\.\.\./i);
  });

  it("shows current thumbnail when initialThumbnailUrl is provided", () => {
    const mockSubmit = vi.fn();
    const testImageUrl = "https://example.com/image.jpg";

    render(<BookFormWrapper onSubmit={mockSubmit} initialThumbnailUrl={testImageUrl} />);

    expect(screen.getByText(/current thumbnail/i)).toBeInTheDocument();
    const image = screen.getByAltText(/book thumbnail preview/i);
    expect(image).toHaveAttribute("src", testImageUrl);
  });

  it("handles file upload correctly", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();

    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");

    render(<BookFormWrapper onSubmit={mockSubmit} />);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const fileInput = screen.getByLabelText(/thumbnail image/i);

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/new image preview/i)).toBeInTheDocument();
    });
  });

  it("renders with default values", () => {
    const mockSubmit = vi.fn();
    const defaultValues: Partial<BookFormData> = {
      title: "Existing Book",
      author: "Existing Author",
      category: "Fantasy",
      price: "25.00",
    };

    render(<BookFormWrapper onSubmit={mockSubmit} defaultValues={defaultValues} />);

    expect(screen.getByLabelText(/title/i)).toHaveValue("Existing Book");
    expect(screen.getByLabelText(/author/i)).toHaveValue("Existing Author");
    expect(screen.getByLabelText(/price/i)).toHaveValue("25.00");
  });

  it("displays default category value", () => {
    const mockSubmit = vi.fn();
    render(<BookFormWrapper onSubmit={mockSubmit} />);

    const categoryButton = screen.getByRole("combobox");
    expect(categoryButton).toHaveTextContent("Technology");
  });

  it("displays category from default values", () => {
    const mockSubmit = vi.fn();
    const defaultValues: Partial<BookFormData> = {
      category: "Science",
    };

    render(<BookFormWrapper onSubmit={mockSubmit} defaultValues={defaultValues} />);

    const categoryButton = screen.getByRole("combobox");
    expect(categoryButton).toHaveTextContent("Science");
  });

  it("accepts file input element", () => {
    const mockSubmit = vi.fn();
    render(<BookFormWrapper onSubmit={mockSubmit} />);

    const fileInput = screen.getByLabelText(/thumbnail image/i);
    expect(fileInput).toHaveAttribute("type", "file");
    expect(fileInput).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  });

  it("button is enabled when not submitting", () => {
    const mockSubmit = vi.fn();
    render(<BookFormWrapper onSubmit={mockSubmit} isSubmitting={false} />);

    const submitButton = screen.getByRole("button", { name: /submit/i });
    expect(submitButton).not.toBeDisabled();
  });

  it("form fields accept empty strings as valid values", () => {
    const mockSubmit = vi.fn();
    render(<BookFormWrapper onSubmit={mockSubmit} />);

    const titleInput = screen.getByLabelText(/title/i);
    const authorInput = screen.getByLabelText(/author/i);
    const priceInput = screen.getByLabelText(/price/i);

    expect(titleInput).toHaveValue("");
    expect(authorInput).toHaveValue("");
    expect(priceInput).toHaveValue("");
  });
});
