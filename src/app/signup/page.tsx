"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
  major: z.string().min(2, { message: "Major is required." }),
  interests: z.string().min(1, { message: "Please list at least one interest." }),
  bio: z.string().min(10, { message: "Bio must be at least 10 characters." }),
  profilePicture: z.string().url({ message: "Please enter a valid image URL." }),
});

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      major: "",
      interests: "",
      bio: "",
      profilePicture: "https://placehold.co/400x400.png",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newUser = signup({
        ...values,
        interests: values.interests.split(',').map(i => i.trim()),
    });
    if (newUser) {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            Join Campus Hub
          </CardTitle>
          <CardDescription>
            Create your profile to start connecting with students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="your.email@university.edu" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="major" render={({ field }) => (
                  <FormItem><FormLabel>Major</FormLabel><FormControl><Input placeholder="e.g., Computer Science" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="interests" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Interests</FormLabel><FormControl><Input placeholder="e.g., AI, Soccer, Photography" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="Tell us a little about yourself." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="profilePicture" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Profile Picture URL</FormLabel><FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full md:col-span-2">
                Create Account
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto text-accent">
              <Link href="/login">Log in</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
