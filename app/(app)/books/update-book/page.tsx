"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBookDetails, updateBook } from "@/api/books"; // Assuming getBookDetails is your fetching function
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Book } from "@/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const categories = ["Technology", "Science", "History", "Fantasy", "Biography"] as const;

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format (e.g., 19.99)"),
  author: z.string().min(1, "Author is required"),
  category: z.enum(categories, "Category is required"),
  thumbnail: z
    .union([z.instanceof(File), z.string()])
    .nullable()
    .optional(),
});

type FormInputData = z.infer<typeof bookSchema>;

interface ServerActionError {
  error: string;
}

function isServerError(result: Book | ServerActionError): result is ServerActionError {
  return (result as ServerActionError).error !== undefined;
}

export default function UpdateBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const bookId = Number(searchParams.get("id"));

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const {
    data: bookData,
    isLoading: isBookLoading,
    isError: isBookError,
  } = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => getBookDetails(bookId),
    enabled: !!bookId,
  });

  const form = useForm<FormInputData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      author: "",
      category: "Technology",
      thumbnail: null,
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (bookData) {
      form.reset({
        title: bookData.title,
        description: bookData.description,
        price: String(bookData.price),
        author: bookData.author,
        category: bookData.category,
        thumbnail: bookData.thumbnail,
      });
    }
  }, [bookData, form]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    form.setValue("thumbnail", file, { shouldValidate: true });

    if (file && file.size > MAX_FILE_SIZE) {
      toast.error(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the 5MB limit.`);
      setImagePreviewUrl(null);
      return;
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    } else {
      setImagePreviewUrl(null);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormInputData) => {
      const fd = new FormData();
      fd.append("title", data.title);
      fd.append("description", data.description);
      fd.append("price", data.price);
      fd.append("author", data.author);
      fd.append("category", data.category);
      fd.append("id", String(bookId));
      if (data.thumbnail instanceof File) {
        fd.append("thumbnail", data.thumbnail);
      }

      return updateBook(fd);
    },
    onSuccess: (result) => {
      if (isServerError(result)) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ["books"] });
        queryClient.invalidateQueries({ queryKey: ["book", bookId] });

        toast.success(`${result.title} has been updated.`);

        if (imagePreviewUrl) {
          URL.revokeObjectURL(imagePreviewUrl);
        }
        router.push("/books");
      }
    },
    onError: (error) => {
      toast.error(`Could not update book: ${error.message}.`);
    },
  });

  const onSubmit = (data: FormInputData) => {
    mutation.mutate(data);
  };

  const initialThumbnailUrl = bookData?.thumbnail || null;
  const displayImageUrl = imagePreviewUrl || initialThumbnailUrl;

  if (isBookLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isBookError || !bookData) {
    return (
      <div className="max-w-xl mx-auto p-6 md:p-10 bg-card rounded-xl shadow-lg mt-8 text-center">
        <h1 className="text-3xl font-extrabold mb-8 text-destructive">Book Not Found</h1>
        <p className="text-muted-foreground">Could not load details for book ID: {bookId}.</p>
        <Button onClick={() => router.push("/books")} className="mt-6">
          Go to Books List
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-xl mx-auto p-6 md:p-10 bg-card rounded-xl shadow-lg mt-8">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-primary">
          Update Book Listing
        </h1>

        {displayImageUrl && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              {imagePreviewUrl ? "New Image Preview" : "Current Thumbnail"}
            </h2>
            <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={displayImageUrl}
                alt="Book Thumbnail Preview"
                fill
                style={{ objectFit: "contain" }}
                className="p-2"
                unoptimized
              />
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="The Great Gatsby" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <FormControl>
                    <Input placeholder="F. Scott Fitzgerald" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide a detailed summary..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g., 19.99" {...field} value={field.value} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail Image (Optional: Select new file to update)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept={ALLOWED_MIME_TYPES.join(",")}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        field.onChange(file);
                        handleThumbnailChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="mt-4" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Book...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
