"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSessionData } from "@/api/auth";

export default function ProfilePage() {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getSessionData(),
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-xl text-muted-foreground animate-pulse">Loading Profile...</p>
      </div>
    );

  if (isError)
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-xl font-semibold text-destructive">
          Error loading user data. Please try again.
        </p>
      </div>
    );

  if (!user)
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-xl font-semibold text-destructive">User profile not found.</p>
      </div>
    );

  return (
    <div className="flex justify-center py-10 px-4 sm:px-6 lg:px-8 bg-muted/20 min-h-screen">
      <Card className="w-full max-w-sm md:max-w-md lg:max-w-xl shadow-2xl transition-all duration-300 hover:shadow-primary/50">
        <CardHeader className="text-center p-6 md:p-8">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">
            My Profile
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            View and manage your account information.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0 md:p-8 md:pt-0 flex flex-col items-center">
          <div className="relative mb-8 flex w-2/5 aspect-square">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || ""}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="rounded-full shadow-lg border-3 border-background ring-3 ring-primary/50 transition-all duration-300 hover:scale-105 h-30"
                unoptimized
              />
            ) : (
              <div
                className="w-[120px] h-[120px] rounded-full bg-primary flex items-center justify-center 
                 text-white text-4xl font-bold shadow-lg border-3 border-background 
                 ring-3 ring-primary/50 transition-all duration-300"
              >
                {(user.name?.charAt(0) || user.email?.charAt(0) || "?").toUpperCase()}
              </div>
            )}
          </div>

          <div className="w-full space-y-4">
            <div className="flex justify-between items-center p-3 border-b rounded-lg bg-secondary/20">
              <span className="text-sm font-medium text-muted-foreground">Name</span>
              <span className="text-base font-semibold text-foreground">{user.name}</span>
            </div>

            <div className="flex justify-between items-center p-3 border-b rounded-lg bg-secondary/20">
              <span className="text-sm font-medium text-muted-foreground">Email</span>
              <span className="text-base font-semibold text-foreground truncate max-w-[70%]">
                {user.email}
              </span>
            </div>
          </div>

          <Button
            className="w-full mt-8 py-6 text-base font-semibold shadow-md hover:shadow-lg transition-all"
            onClick={() => (window.location.href = "/profile/edit")}
          >
            Edit Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
