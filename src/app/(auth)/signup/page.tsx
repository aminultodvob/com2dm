"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/toaster";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: err.error ?? "Registration failed",
          variant: "error",
        });
        return;
      }

      toast({
        title: "Account created!",
        description: "Redirecting to your dashboard...",
        variant: "success",
      });
      router.push("/login");
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const perks = [
    "Free plan - no credit card needed",
    "3 automation rules to start",
    "Set up in under 5 minutes",
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 to-purple-700 flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">Comment2DM</span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Start automating in minutes
          </h2>
          <p className="text-white/70 mb-8">
            Join hundreds of creators using Comment2DM to convert Instagram and
            Facebook comments into direct messages automatically.
          </p>
          <ul className="space-y-4">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-300 shrink-0" />
                <span className="text-white/90">{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/50 text-xs">
          (c) 2026 Comment2DM. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create your account
            </h1>
            <p className="text-muted-foreground">
              Start your free Comment2DM account today
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="name"
              label="Full name"
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              id="email"
              label="Work email"
              type="email"
              placeholder="jane@company.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Create free account
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By signing up, you agree to our{" "}
              <Link href="#" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

