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

const categories = ["Technology", "Science", "History", "Fantasy", "Biography"] as const;

type FormInputData = z.infer<typeof bookSchema>;

export default function AddBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch current user data for ownerId
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
      thumbnail: undefined,
      author: "",
      category: "Technology",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormInputData) => {
      const fd = new FormData();
      fd.append("title", data.title);
      fd.append("description", data.description);
      fd.append("price", data.price);
      fd.append("author", data.author);
      fd.append("category", data.category);
      fd.append("ownerId", String(userData?.id ?? 0));
      fd.append("thumbnail", data.thumbnail);

      return addBook(fd);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["books"] });
        toast.success(`${result.book?.title} has been added.`);

        router.push("/books");
      } else {
        toast.error(result.message ?? "Faild to add the book");
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
                    <Input type="text" placeholder="e.g., 19.99" {...field} value={field.value} />
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
                  <FormLabel>Thumbnail Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      {...fieldProps}
                      onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
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
