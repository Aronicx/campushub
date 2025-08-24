"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "@/hooks/use-auth";
import { getStudents } from "@/lib/mock-data";
import type { Student } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";

import { draftDailyThought } from "@/ai/flows/draft-daily-thought";
import { suggestConnections } from "@/ai/flows/suggest-connections";

import { Wand2, Users, Loader2, User, BrainCircuit, BookOpen, CalendarDays, KeyRound, Instagram, MessageCircle, Phone, Link2 } from "lucide-react";


const profileFormSchema = z.object({
  name: z.string(),
  rollNo: z.string().min(1, { message: "Roll No. is required." }),
  major: z.string().min(2, { message: "Major is required." }),
  interests: z.string().min(1, { message: "Please list at least one interest." }),
  bio: z.string().min(10, { message: "Bio must be at least 10 characters." }),
  profilePicture: z.any(),
  instagram: z.string().optional(),
  snapchat: z.string().optional(),
  discord: z.string().optional(),
  phoneNumber: z.string().optional(),
  customLink: z.string().optional(),
});

function ProfileEditor({ student, onUpdate }: { student: Student; onUpdate: (data: Partial<Student>) => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: student.name || "",
      rollNo: student.rollNo,
      major: student.major,
      interests: student.interests.join(", "),
      bio: student.bio,
      profilePicture: student.profilePicture,
      instagram: student.instagram || "",
      snapchat: student.snapchat || "",
      discord: student.discord || "",
      phoneNumber: student.phoneNumber || "",
      customLink: student.customLink || "",
    },
  });

  const [preview, setPreview] = useState<string | null>(student.profilePicture);

  function onSubmit(values: z.infer<typeof profileFormSchema>) {
    const { profilePicture, ...otherValues } = values;
  
    const updateData: Partial<Student> = {
      ...otherValues,
      interests: values.interests.split(',').map(i => i.trim()),
    };

    if (profilePicture && typeof profilePicture !== 'string' && profilePicture.length > 0) {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                onUpdate({ ...updateData, profilePicture: reader.result as string });
            }
        };
        reader.readAsDataURL(profilePicture[0]);
    } else {
        onUpdate(updateData);
    }
    
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="main" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="main">Main Info</TabsTrigger>
                        <TabsTrigger value="social">Socials & Contact</TabsTrigger>
                    </TabsList>
                    <TabsContent value="main">
                        <div className="space-y-4 px-1">
                            <FormField
                                control={form.control}
                                name="profilePicture"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Profile Picture (JPG format)</FormLabel>
                                    <FormControl>
                                    <Input 
                                        type="file" 
                                        accept="image/jpeg"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                field.onChange(e.target.files);
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setPreview(reader.result as string);
                                                }
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             {preview && <Avatar className="h-20 w-20 mx-auto"><AvatarImage src={preview} alt="Profile preview" /></Avatar>}
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="rollNo" render={({ field }) => (
                            <FormItem><FormLabel>Roll No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="major" render={({ field }) => (
                                <FormItem><FormLabel>Major</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="interests" render={({ field }) => (
                                <FormItem><FormLabel>Interests</FormLabel><FormControl><Input placeholder="Separated by commas" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="bio" render={({ field }) => (
                                <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </TabsContent>
                     <TabsContent value="social">
                        <div className="space-y-4 px-1">
                            <FormField control={form.control} name="instagram" render={({ field }) => (
                                <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="e.g., your_username" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="snapchat" render={({ field }) => (
                                <FormItem><FormLabel>Snapchat</FormLabel><FormControl><Input placeholder="e.g., your_username" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="discord" render={({ field }) => (
                                <FormItem><FormLabel>Discord</FormLabel><FormControl><Input placeholder="e.g., YourTag#1234" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g., +1 123 456 7890" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                         <FormField control={form.control} name="customLink" render={({ field }) => (
                            <FormItem><FormLabel>Free Tab</FormLabel><FormControl><Input placeholder="e.g., your personal website" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        </div>
                    </TabsContent>
                </Tabs>
                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit">Save changes</Button>
                 </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DailyThoughtPoster() {
    const { postThought, currentUser } = useAuth();
    const [thought, setThought] = useState("");
    const [isDrafting, startDrafting] = useTransition();
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

    const draftForm = useForm({
        defaultValues: { topic: "", mood: "" },
    });

    const handleDraftWithAI = async (values: { topic: string, mood: string}) => {
        startDrafting(async () => {
            const result = await draftDailyThought(values);
            setThought(result.thought);
            setIsAiDialogOpen(false);
        });
    };

    const handlePost = () => {
        if (thought.trim()) {
            postThought(thought);
            setThought("");
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Share a Daily Thought</CardTitle>
                <CardDescription>What's on your mind today?</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea 
                    value={thought}
                    onChange={(e) => setThought(e.target.value)}
                    placeholder="Share an update, an idea, or a question..." 
                    rows={4}
                />
            </CardContent>
            <CardFooter className="justify-between">
                <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Wand2 className="mr-2 h-4 w-4"/> Draft with AI</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>AI Thought Draft</DialogTitle>
                            <DialogDescription>Give the AI a topic and your mood to draft a thought.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={draftForm.handleSubmit(handleDraftWithAI)} className="space-y-4">
                            <div>
                                <label htmlFor="topic" className="text-sm font-medium">Topic</label>
                                <Input id="topic" {...draftForm.register("topic")} placeholder="e.g., upcoming exams" />
                            </div>
                            <div>
                                <label htmlFor="mood" className="text-sm font-medium">Mood</label>
                                <Input id="mood" {...draftForm.register("mood")} placeholder="e.g., optimistic" />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={isDrafting}>
                                    {isDrafting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Draft
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                <Button onClick={handlePost} disabled={!thought.trim()}>Post</Button>
            </CardFooter>
        </Card>
    )
}

function ConnectionSuggester() {
    const { currentUser } = useAuth();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, startSuggesting] = useTransition();

    const handleGetSuggestions = () => {
        if (!currentUser) return;
        
        startSuggesting(async () => {
            const allOtherStudents = getStudents().filter(s => s.id !== currentUser.id);
            const studentToProfileString = (s: Student) => `${s.name || '(no name)'}, Major: ${s.major}, Interests: ${s.interests.join(', ')}`;
            
            const result = await suggestConnections({
                studentProfile: studentToProfileString(currentUser),
                otherStudentProfiles: allOtherStudents.map(studentToProfileString),
                numberOfSuggestions: 3,
            });
            setSuggestions(result);
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Connection Suggestions</CardTitle>
                <CardDescription>Find students with similar interests.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : suggestions.length > 0 ? (
                    <div className="space-y-2">
                        {suggestions.map((suggestion, index) => {
                            const studentName = suggestion.split(',')[0];
                            const student = getStudents({ search: studentName })[0];
                            return (
                                <div key={index} className="flex items-center justify-between rounded-md border p-3">
                                    <p>{suggestion}</p>
                                    {student && <Button asChild size="sm" variant="outline"><Link href={`/profile/${student.id}`}>View</Link></Button>}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-4">Click the button to get AI-powered connection suggestions!</div>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleGetSuggestions} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                    Get Suggestions
                </Button>
            </CardFooter>
        </Card>
    );
}

function ContactInfo({ student }: { student: Student }) {
    const contacts = [
        { icon: Instagram, label: "Instagram", value: student.instagram },
        { icon: MessageCircle, label: "Snapchat", value: student.snapchat },
        { icon: Users, label: "Discord", value: student.discord },
        { icon: Phone, label: "Phone", value: student.phoneNumber },
        { icon: Link2, label: "Link", value: student.customLink, isLink: true },
    ].filter(c => c.value);

    if (contacts.length === 0) return null;

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Contact & Socials</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map(({icon: Icon, label, value, isLink}) => (
                    <Card key={label}>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                             <Icon className="h-6 w-6 text-muted-foreground" />
                             <CardTitle className="text-lg">{label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLink ? (
                                <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{value}</a>
                            ) : (
                                <p className="text-muted-foreground break-all">{value}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default function DashboardPage() {
  const { currentUser, isLoading: isAuthLoading, updateProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      router.push("/login");
    }
  }, [isAuthLoading, currentUser, router]);

  if (isAuthLoading || !currentUser) {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-4">
                <Skeleton className="h-12 w-1/4" />
                <Skeleton className="h-8 w-1/2" />
                <div className="flex space-x-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    );
  }

  const initials = (currentUser.name || "NN").split(" ").map((n) => n[0]).join("");
  const displayName = currentUser.name || '(no name)';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentUser.profilePicture} alt={currentUser.name || 'User'} />
          <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold">Welcome, {displayName.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">This is your personal dashboard.</p>
        </div>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="thought">Daily Thought</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle>Your Information</CardTitle>
                        <CardDescription>Review and edit your personal details.</CardDescription>
                    </div>
                    <ProfileEditor student={currentUser} onUpdate={updateProfile} />
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl"><KeyRound size={24} /> Roll No.</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{currentUser.rollNo}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl"><User size={24} /> Bio</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{currentUser.bio}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl"><BrainCircuit size={24} /> Interests</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {currentUser.interests.map((interest) => (
                                    <Badge key={interest} variant="default" className="bg-primary/80 hover:bg-primary text-primary-foreground">
                                        {interest}
                                    </Badge>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <ContactInfo student={currentUser} />

                    <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><BookOpen /> Your Recent Thoughts</h3>
                    {currentUser.thoughts.length > 0 ? (
                        <div className="space-y-4">
                            {currentUser.thoughts.slice(0, 3).map((thought) => (
                            <Card key={thought.id} className="bg-background">
                                <CardContent className="p-4">
                                <p>{thought.content}</p>
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                    <CalendarDays size={14} /> 
                                    {formatDistanceToNow(new Date(thought.timestamp), { addSuffix: true })}
                                </p>
                                </CardContent>
                            </Card>
                            ))}
                        </div>
                        ) : (
                        <Card className="text-center p-8 border-dashed">
                            <p className="text-muted-foreground">You haven't shared any thoughts yet.</p>
                        </Card>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="thought" className="mt-6">
            <DailyThoughtPoster />
        </TabsContent>
        <TabsContent value="connections" className="mt-6">
            <ConnectionSuggester />
        </TabsContent>
      </Tabs>
    </div>
  );
}
