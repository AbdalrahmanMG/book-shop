"use client";

import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";
import { Categories, VALID_BOOK_CATEGORIES } from "@/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type BookFormData = {
  id?: string;
  title: string;
  description: string;
  author: string;
  category: Categories;
  price: string;
  thumbnail?: File | string | null;
};

interface BookFormProps {
  form: UseFormReturn<BookFormData>;
  onSubmit: (data: BookFormData) => void;
  isSubmitting: boolean;
  submitButtonText: string;
  initialThumbnailUrl?: string | null;
}

interface BookFormProps {
  form: UseFormReturn<BookFormData>;
  onSubmit: (data: BookFormData) => void;
  isSubmitting: boolean;
  submitButtonText: string;
  initialThumbnailUrl?: string | null;
}

export function BookForm({
  form,
  onSubmit,
  isSubmitting,
  submitButtonText,
  initialThumbnailUrl = null,
}: BookFormProps) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

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

  const displayImageUrl = imagePreviewUrl || initialThumbnailUrl;

  return (
    <>
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
            name="id"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input type="hidden" {...field} value={field.value || ""} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="The Great Gatsby" {...field} value={field.value || ""} />
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
                  <Input placeholder="F. Scott Fitzgerald" {...field} value={field.value || ""} />
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
                  <Textarea
                    placeholder="Provide a detailed summary..."
                    rows={4}
                    {...field}
                    value={field.value || ""}
                  />
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
                <Select onValueChange={field.onChange} value={field.value || "Technology"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VALID_BOOK_CATEGORIES.map((cat) => (
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
                  <Input
                    type="text"
                    placeholder="e.g., 19.99"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="thumbnail"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>
                  Thumbnail Image {initialThumbnailUrl && "(Optional: Select new file to update)"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept={ALLOWED_MIME_TYPES.join(",")}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      onChange(file);
                      handleThumbnailChange(e);
                    }}
                    {...fieldProps}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-4" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {submitButtonText}...
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}
