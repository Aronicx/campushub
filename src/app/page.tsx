
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Droplets, MessageSquareText, BookCopy, Users, ShieldCheck, Trophy, Info } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: <Users className="h-8 w-8 text-green-500" />,
    title: "Campus Connect",
    description: "Discover and connect with students. Profiles are suggested to you, and a direct chat option makes it easy to break the ice.",
    link: "/directory"
  },
  {
    icon: <Droplets className="h-8 w-8 text-primary" />,
    title: "Thought Bubbles",
    description: "Share your fleeting thoughts and ideas with the entire campus. A live feed of what everyone is thinking, which disappears after 24 hours.",
    link: "/thought-bubbles"
  },
  {
    icon: <BookCopy className="h-8 w-8 text-orange-500" />,
    title: "Notes Sharing",
    description: "Share and discover useful study notes and resources. All notes are stored on Google Drive and are publicly accessible to anyone with the link.",
    link: "/notes"
  },
  {
    icon: <MessageSquareText className="h-8 w-8 text-blue-500" />,
    title: "Global & Private Chat",
    description: "Jump into the ephemeral Global Chat that vanishes every few minutes, or have private, expiring one-on-one conversations.",
    link: "/chat"
  },
];

const uniqueSystems = [
  {
    icon: <ShieldCheck className="h-8 w-8 text-emerald-500" />,
    title: "Trust Likes",
    description: "Show your genuine appreciation for a profile with a 'Trust Like'. These special likes are a key factor in the monthly Coordinator elections."
  },
  {
    icon: <Trophy className="h-8 w-8 text-amber-500" />,
    title: "Coordinator Elections",
    description: "Each month, the two students with the most Trust Likes are elected as Coordinators, gaining moderation abilities to help keep the community safe and welcoming."
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
                <Link href="/directory">Explore Campus Connect</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
                <Link href="/login">Get Started</Link>
            </Button>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Core Features</h2>
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
                      <Link href={feature.link}>Check it out</Link>
                  </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-8">What Makes Us Unique</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {uniqueSystems.map((system) => (
            <Card key={system.title} className="flex flex-col relative bg-muted/50">
              <CardHeader className="items-center">
                {system.icon}
                <CardTitle className="mt-4 text-2xl">{system.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center flex-grow">
                <p className="text-muted-foreground">{system.description}</p>
              </CardContent>
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
