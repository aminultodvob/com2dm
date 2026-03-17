import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Pricing</h1>
        <p className="text-muted-foreground">
          Visit the homepage for the latest pricing details.
        </p>
        <Link href="/#pricing">
          <Button>View pricing</Button>
        </Link>
      </div>
    </div>
  );
}
