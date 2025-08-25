
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { Lock, User, Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  identifier: z.string().min(1, { message: "Please enter your username, email or roll number." }),
  password: z.string().min(1, { message: "Password is required." }),
});

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const loggedIn = await login(values.identifier, values.password);
    if (loggedIn) {
      router.push("/dashboard");
    }
  }

  return (
     <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username or Roll No.</FormLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      placeholder="e.g., Aarav Sharma or 1"
                      {...field}
                      className="pl-10"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      className="pl-10 pr-10"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
      </Form>
  )
}

export default function LoginPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            Welcome Back!
          </CardTitle>
          <CardDescription>
            Log in to connect with your campus community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isClient ? <LoginForm /> : null}
        </CardContent>
        <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
                Don't have an account? <Button variant="link" className="p-0 h-auto" asChild><Link href="/signup">Create one</Link></Button>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
