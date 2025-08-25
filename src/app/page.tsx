import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4">
      <div className="space-y-4">
        <Icons.logo className="h-24 w-24 text-primary mx-auto" />
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-primary">
          CAMPUS HUB
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground">
          (connecting you)
        </p>
      </div>
      <div className="mt-8">
        <Button asChild size="lg">
          <Link href="/login">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
