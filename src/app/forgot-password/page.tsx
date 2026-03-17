"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Placeholder - wire to your email provider or auth workflow.
      toast({
        title: "Check your inbox",
        description: "If this email exists, a reset link has been sent.",
        variant: "success",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a reset link.
          </p>
        </div>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Button className="w-full" onClick={handleSubmit} isLoading={loading}>
          Send reset link
        </Button>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
