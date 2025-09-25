
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { Droplets, MessageSquareText, BookCopy, Users, Info } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: <Droplets className="h-8 w-8 text-primary" />,
    title: "Thought Bubbles",
    description: "Share your fleeting thoughts and ideas with the entire campus. A live feed of what everyone is thinking, which disappears after 24 hours.",
    link: "/thought-bubbles"
  },
  {
    icon: <BookCopy className="h-8 w-8 text-orange-500" />,
    title: "Notes Sharing",
    description: "Share and discover useful study notes, links, and resources with your peers. A collaborative space for academic success.",
    link: "/notes"
  },
  {
    icon: <MessageSquareText className="h-8 w-8 text-blue-500" />,
    title: "Global & Private Chat",
    description: "Jump into the ephemeral Global Chat that vanishes every few minutes, or have private, expiring conversations with your connections.",
    link: "/chat"
  },
  {
    icon: <Users className="h-8 w-8 text-green-500" />,
    title: "Manage Your Connections",
    description: "See who follows you, who you're following, and who has liked your profile. A central hub to manage your campus network.",
    link: "/connections",
  }
];

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <div className="flex justify-center items-center gap-4 mb-4">
          <Icons.logo className="h-16 w-16 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight text-primary">
            Campus Hub
          </h1>
        </div>
        <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
          Your exclusive social network to connect, share, and engage with your college community in new and exciting ways.
        </p>
        <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
                <Link href="/directory">Browse Directory</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
                <Link href="/login">Get Started</Link>
            </Button>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="flex flex-col relative">
              <CardHeader className="items-center">
                {feature.icon}
                <CardTitle className="mt-4 text-2xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center flex-grow">
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
              <CardFooter className="justify-center">
                  <Button asChild variant="outline">
                      <Link href={feature.link}>Learn More</Link>
                  </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      
       <footer className="text-center mt-16 text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Campus Hub. All rights reserved.</p>
        </footer>
    </div>
  );
}
