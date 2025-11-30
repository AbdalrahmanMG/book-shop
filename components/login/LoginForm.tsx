"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { LoginSchema } from "@/validation/auth";
import { loginAction, LoginActionResponse } from "@/api/auth/actions";

type LoginFormValues = z.infer<typeof LoginSchema>;

const LoginForm = () => {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const [isPending, startTransition] = React.useTransition();
  const [rootError, setRootError] = React.useState<string | null>(null);

  const onSubmit = (values: LoginFormValues) => {
    setRootError(null);

    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);

    startTransition(async () => {
      const res = (await loginAction(formData)) as LoginActionResponse;

      if (res && "error" in res) {
        if ("fieldErrors" in res && res.fieldErrors) {
          Object.keys(res.fieldErrors).forEach((key) => {
            const field = key as keyof LoginFormValues;
            form.setError(field, { message: res.fieldErrors![key]?.[0] || "Invalid input" });
          });
          setRootError("Please correct the errors in the form.");
        } else {
          setRootError(res.error);
        }
      }
    });
  };

  return (
    <Card
      className="w-full max-w-md bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-2xl transition-all duration-300 hover:shadow-primary/30"
      data-testid="login-form"
    >
      <CardHeader className="text-center space-y-3 pt-6">
        <Lock className="w-10 h-10 text-primary mx-auto" />
        <CardTitle className="text-3xl font-bold tracking-tight text-primary">
          Welcome Back
        </CardTitle>
        <p className="text-sm text-muted-foreground">Sign in to manage your book collection.</p>
      </CardHeader>

      <CardContent className="pt-4">
        {rootError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" id="login-form">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="admin@books.com"
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="******"
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full mt-4 h-11">
              {isPending ? (
                <>
                  <Lock className="w-4 h-4 mr-2 animate-spin" />
                  Logging In...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
