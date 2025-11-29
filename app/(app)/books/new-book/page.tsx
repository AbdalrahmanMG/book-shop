"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { addBook } from "@/api/books";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { bookSchema } from "@/validation/auth";
import { getSessionData } from "@/api/auth";
import { toast } from "sonner";
import { useState } from "react";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const categories = ["Technology", "Science", "History", "Fantasy", "Biography"] as const;

type FormInputData = z.infer<typeof bookSchema>;

type FieldErrors = {
  [K in keyof FormInputData]?: string[];
};

interface AddBookFailureResponse {
  success: false;
  message?: string;
  fieldErrors?: FieldErrors;
}

function isAddBookFailureResponse(
  result: any,
): result is AddBookFailureResponse & { success: false; fieldErrors: FieldErrors } {
  return (
    result &&
    result.success === false &&
    typeof result.fieldErrors === "object" &&
    result.fieldErrors !== null
  );
}
export default function AddBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const { data: userData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getSessionData(),
  });

  const form = useForm<FormInputData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      thumbnail: null,
      author: "",
      category: "Technology",
    },
    mode: "onSubmit",
  });

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    form.setValue("thumbnail", file as any, { shouldValidate: true });

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
      const ownerId = userData?.id ?? 0;
      if (ownerId === 0) {
        throw new Error("User session data not available.");
      }
      fd.append("ownerId", String(ownerId));
      if (data.thumbnail instanceof File) {
        fd.append("thumbnail", data.thumbnail);
      }
      return addBook(fd);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["books"] });
        toast.success(`${result.book?.title} has been added.`);

        if (imagePreviewUrl) {
          URL.revokeObjectURL(imagePreviewUrl);
        }
        router.push("/books");
      } else {
        if (isAddBookFailureResponse(result)) {
          Object.keys(result.fieldErrors).forEach((key) => {
            const field = key as keyof FormInputData;
            // Now, result.fieldErrors is correctly typed as FieldErrors
            form.setError(field, {
              message: result.fieldErrors[field]?.[0] || "Invalid input",
              type: "server",
            });
          });
          toast.error("Please correct the highlighted errors.");
        } else {
          toast.error(result.message ?? "Failed to add the book");
        }
      }
    },
    onError: (error) => {
      toast.error(`Could not add book: ${error.message}.`);
    },
  });

  const onSubmit = (data: FormInputData) => {
    mutation.mutate(data);
  };

  return (
    <>
      <div className="max-w-xl mx-auto p-6 md:p-10 bg-card rounded-xl shadow-lg mt-8">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-primary">List a New Book</h1>

        {/* 3. Image Preview Area */}
        {imagePreviewUrl && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Image Preview</h2>
            {/*  */}
            <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={imagePreviewUrl}
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
            {/* Title Field */}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Input type="text" placeholder="e.g., 19.99" {...field} />
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
                  <FormLabel>Thumbnail Image</FormLabel>
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
                  Adding Book...
                </>
              ) : (
                "Add Book"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
