import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4">
      <div className="space-y-6">
        <div>
            <h1 className="text-8xl font-bold text-primary tracking-tighter">404</h1>
            <p className="text-2xl font-semibold">Page Not Found</p>
        </div>

        <p className="text-muted-foreground">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        
        <div className="space-y-2">
            <Icons.logo className="h-16 w-16 text-primary mx-auto" />
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter text-primary">
            CAMPUS HUB
            </p>
        </div>
      </div>
      <div className="mt-8">
        <Button asChild size="lg">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    </div>
  );
}
