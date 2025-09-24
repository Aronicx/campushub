
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { createStudent } from "@/lib/mock-data";
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
import { Building, GraduationCap, Book, CaseSensitive, Lock, User, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  name: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  collegeName: z.string().min(3, { message: "College name is required." }),
  term: z.string().min(1, { message: "Term/Year is required." }),
  degree: z.string().min(1, { message: "Degree is required." }),
  course: z.string().min(1, { message: "Course is required." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      name: "",
      collegeName: "",
      term: "",
      degree: "",
      course: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createStudent({
        username: values.username.toLowerCase(),
        name: values.name,
        password: values.password,
        collegeName: values.collegeName,
        term: values.term,
        degree: values.degree,
        course: values.course,
      });
      toast({
        title: "Account Created!",
        description: "You can now log in with your new credentials.",
      });
      router.push("/login");
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Signup Failed",
            description: error.message,
        })
    }
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      placeholder="e.g., aisha_khan"
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <div className="relative">
                  <CaseSensitive className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      placeholder="e.g., Aisha Khan"
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
            name="collegeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>College Name</FormLabel>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      placeholder="e.g., Summit University"
                      {...field}
                      className="pl-10"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
           <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="term" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term/Year</FormLabel>
                    <FormControl><Input placeholder="e.g., 2nd Year" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="degree" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree</FormLabel>
                    <FormControl><Input placeholder="e.g., B.Sc" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
           </div>
           <FormField
            control={form.control}
            name="course"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                 <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      placeholder="e.g., Computer Science"
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
            {form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </Form>
  )
}

export default function SignupPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            Create an Account
          </CardTitle>
          <CardDescription>
            Join the Campus Hub community today!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isClient ? <SignupForm /> : null}
        </CardContent>
        <div className="p-6 pt-0">
            <Separator />
        </div>
        <CardFooter className="flex flex-col gap-4">
             <p className="text-sm text-muted-foreground">
                Already have an account?
            </p>
             <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Log In</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
