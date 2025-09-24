
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { Droplets, MessageSquareText, BookCopy, ShieldCheck, Info } from "lucide-react";
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
    icon: <ShieldCheck className="h-8 w-8 text-green-500" />,
    title: "Community Coordinators",
    description: "Coordinators are trusted members of the community who help maintain a safe and positive environment. They are elected by their peers through a unique 'Trust Like' system.",
    link: "/directory",
    infoDialog: true,
  }
];


function CoordinatorInfoDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                    <Info size={16} />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl"><ShieldCheck className="text-green-500"/> Community Moderators</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4 text-sm text-card-foreground">
                    <p>Community Coordinators are essential to keeping Campus Hub a safe, productive, and welcoming place for everyone. They are users who have earned the trust of the community.</p>
                    
                    <div className="space-y-2">
                        <h3 className="font-semibold text-md">Moderator Powers:</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li><span className="font-semibold text-card-foreground">Delete Thoughts:</span> Coordinators can remove any thought bubble that violates community guidelines.</li>
                            <li><span className="font-semibold text-card-foreground">Restrict from Global Chat:</span> They can temporarily restrict a user from participating in the Global Chat for 24 hours if they are being disruptive.</li>
                            <li><span className="font-semibold text-blue-600">Note Deletion:</span> Coordinators can delete any shared note to maintain content quality.</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-md">How to Become a Coordinator:</h3>
                         <p className="text-muted-foreground">The coordinator election is a dynamic process based on <span className="font-semibold text-green-600">Trust Likes</span>.</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                           <li>On the <span className="font-semibold text-card-foreground">1st of every month</span>, the top two users with the most Trust Likes become the new coordinators for that month.</li>
                           <li>After the election, all Trust Likes across the platform are <span className="font-semibold text-card-foreground">reset to zero</span>, starting a fresh race for the next month.</li>
                        </ul>
                    </div>
                     <p className="text-xs text-center pt-2 text-muted-foreground">This system ensures that the most currently trusted members of the community are empowered to keep it safe.</p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

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
               {feature.infoDialog && <CoordinatorInfoDialog />}
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
