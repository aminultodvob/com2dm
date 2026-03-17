"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/toaster";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Invalid credentials",
          description: "Please check your email and password.",
          variant: "error",
        });
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

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
          <blockquote className="text-white text-2xl font-medium leading-relaxed mb-6">
            &ldquo;Comment2DM 10x&apos;d our lead capture from Instagram. Set it up once, never look back.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
              S
            </div>
            <div>
              <p className="text-white font-semibold">Sarah Chen</p>
              <p className="text-white/70 text-sm">Digital Creator, 280K followers</p>
            </div>
          </div>
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
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your Comment2DM account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="********"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

