
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

import { Wand2, Users, Loader2, User, BrainCircuit, BookOpen, CalendarDays, KeyRound, Instagram, MessageCircle, Phone, Link2, Mail, Camera, Edit, Lock, Trash2 } from "lucide-react";


const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phoneNumber: z.string().optional(),
});

const majorFormSchema = z.object({
    major: z.string().min(2, { message: "Major is required." }),
});

const bioFormSchema = z.object({
    bio: z.string().min(10, { message: "Bio must be at least 10 characters." }),
});

const interestsFormSchema = z.object({
    interests: z.string().min(1, { message: "Please list at least one interest." }),
});

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
});


function ProfileEditor({ student, onUpdate }: { student: Student; onUpdate: (data: Partial<Student>) => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: student.name || "",
      email: student.email || "",
      phoneNumber: student.phoneNumber || "",
    },
  });

  function onSubmit(values: z.infer<typeof profileFormSchema>) {
    onUpdate(values);
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="space-y-4 px-1">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                        <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
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


function SingleFieldEditor({ title, description, schema, fieldName, initialValue, onUpdate, inputType = "input" }: { 
    title: string;
    description: string;
    schema: any; 
    fieldName: string;
    initialValue: string;
    onUpdate: (data: any) => void;
    inputType?: "input" | "textarea";
}) {
    const [isOpen, setIsOpen] = useState(false);
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { [fieldName]: initialValue },
    });

    const onSubmit = (values: any) => {
        onUpdate(values);
        setIsOpen(false);
    };
    
    const InputComponent = inputType === 'textarea' ? Textarea : Input;

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Edit size={14} /> Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name={fieldName}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="capitalize">{fieldName}</FormLabel>
                                    <FormControl>
                                        <InputComponent {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function PasswordEditor() {
    const { changePassword } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    });

    async function onSubmit(values: z.infer<typeof passwordFormSchema>) {
        setIsSubmitting(true);
        const success = await changePassword(values.currentPassword, values.newPassword);
        setIsSubmitting(false);
        if (success) {
            setIsOpen(false);
            form.reset();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Change Password</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Enter your current password and a new password below.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="currentPassword" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl><Input type="password" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="newPassword" render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl><Input type="password" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl><Input type="password" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Password
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DailyThoughtPoster() {
    const { postThought } = useAuth();
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
    const [isLoading, setIsLoading] = useState(false);
    const [otherStudents, setOtherStudents] = useState<Student[]>([]);

     useEffect(() => {
        if (currentUser) {
            getStudents().then(students => {
                setOtherStudents(students.filter(s => s.id !== currentUser.id));
            });
        }
    }, [currentUser]);


    const handleGetSuggestions = async () => {
        if (!currentUser) return;
        
        setIsLoading(true);
        const studentToProfileString = (s: Student) => `${s.name || '(no name)'}, Major: ${s.major}, Interests: ${s.interests.join(', ')}`;
        
        const result = await suggestConnections({
            studentProfile: studentToProfileString(currentUser),
            otherStudentProfiles: otherStudents.map(studentToProfileString),
            numberOfSuggestions: 3,
        });
        setSuggestions(result);
        setIsLoading(false);
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
                             const student = otherStudents.find(s => s.name === studentName);
                            return (
                                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-md border p-3 gap-2">
                                    <p className="flex-grow">{suggestion}</p>
                                    {student && <Button asChild size="sm" variant="outline" className="w-full sm:w-auto"><Link href={`/profile/${student.id}`}>View</Link></Button>}
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

const socialFormSchema = z.object({
  instagram: z.string().optional(),
  snapchat: z.string().optional(),
  discord: z.string().optional(),
  customLink: z.string().optional(),
});

function SocialsEditor({ student, onUpdate }: { student: Student, onUpdate: (data: Partial<Student>) => void }) {
  const form = useForm<z.infer<typeof socialFormSchema>>({
    resolver: zodResolver(socialFormSchema),
    defaultValues: {
      instagram: student.instagram || "",
      snapchat: student.snapchat || "",
      discord: student.discord || "",
      customLink: student.customLink || "",
    },
  });
  
  function onSubmit(values: z.infer<typeof socialFormSchema>) {
    onUpdate(values);
  }

  const socialFields = [
      { name: "instagram", icon: Instagram, placeholder: "e.g., your_username" },
      { name: "snapchat", icon: MessageCircle, placeholder: "e.g., your_username" },
      { name: "discord", icon: Users, placeholder: "e.g., YourTag#1234" },
      { name: "customLink", icon: Link2, placeholder: "e.g., your personal website" },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact & Socials</CardTitle>
        <CardDescription>Add or update your contact information.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="instagram" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                {socialFields.map(field => <TabsTrigger key={field.name} value={field.name}><field.icon /></TabsTrigger>)}
              </TabsList>
              {socialFields.map(field => (
                <TabsContent key={field.name} value={field.name}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="capitalize flex items-center gap-2"><field.icon /> {field.name.replace('customLink', 'Free Tab').replace('phoneNumber', 'Phone Number')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name={field.name}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormControl>
                                <Input {...formField} placeholder={field.placeholder} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
            <div className="flex justify-end mt-4">
                <Button type="submit">Save Socials</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function ProfilePictureUpdater({ student, onUpdate }: { student: Student; onUpdate: (data: Partial<Student>) => void }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUpdating(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          onUpdate({ profilePicture: reader.result as string });
        }
        setIsUpdating(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = () => {
    onUpdate({ profilePicture: "" });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Button asChild variant="outline" size="sm">
          <label htmlFor="profile-picture-upload" className="cursor-pointer">
            {isUpdating ? <Loader2 className="mr-2 animate-spin" /> : <Camera className="mr-2"/>}
            Change Picture
          </label>
        </Button>
        <Input
          id="profile-picture-upload"
          type="file"
          accept="image/jpeg,image/png"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          disabled={isUpdating}
        />
      </div>
       {student.profilePicture && (
         <Button onClick={handleRemovePicture} variant="destructive" size="sm">
          <Trash2 className="mr-2" /> Remove
        </Button>
      )}
    </div>
  );
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentUser.profilePicture} alt={currentUser.name || 'User'} />
          <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">This is your personal dashboard.</p>
          <ProfilePictureUpdater student={currentUser} onUpdate={updateProfile} />
        </div>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="thought">Daily Thought</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
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
                                <CardTitle className="flex items-center justify-between text-xl">
                                    <span className="flex items-center gap-2"><KeyRound size={24} /> Roll No.</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{currentUser.rollNo}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-xl">
                                     <span className="flex items-center gap-2"><BookOpen size={24} /> Major</span>
                                     <SingleFieldEditor
                                        title="Edit Major"
                                        description="Update your major."
                                        schema={majorFormSchema}
                                        fieldName="major"
                                        initialValue={currentUser.major}
                                        onUpdate={updateProfile}
                                    />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                               <p className="text-muted-foreground break-words">{currentUser.major}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                               <CardTitle className="flex items-center justify-between text-xl">
                                    <span className="flex items-center gap-2"><User size={24} /> Bio</span>
                                     <SingleFieldEditor
                                        title="Edit Bio"
                                        description="Update your biography."
                                        schema={bioFormSchema}
                                        fieldName="bio"
                                        initialValue={currentUser.bio}
                                        onUpdate={updateProfile}
                                        inputType="textarea"
                                    />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground break-words">{currentUser.bio}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                 <CardTitle className="flex items-center justify-between text-xl">
                                    <span className="flex items-center gap-2"><BrainCircuit size={24} /> Interests</span>
                                    <SingleFieldEditor
                                        title="Edit Interests"
                                        description="Update your interests, separated by commas."
                                        schema={interestsFormSchema}
                                        fieldName="interests"
                                        initialValue={currentUser.interests.join(", ")}
                                        onUpdate={(data) => updateProfile({ interests: data.interests.split(',').map((i: string) => i.trim()) })}
                                    />
                                </CardTitle>
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

                    <SocialsEditor student={currentUser} onUpdate={updateProfile} />

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Lock /> Security</CardTitle>
                            <CardDescription>Manage your password settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PasswordEditor />
                        </CardContent>
                    </Card>

                    <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><BookOpen /> Your Recent Thoughts</h3>
                    {currentUser.thoughts.length > 0 ? (
                        <div className="space-y-4">
                            {currentUser.thoughts.slice(0, 3).map((thought) => (
                            <Card key={thought.id} className="bg-background">
                                <CardContent className="p-4">
                                <p className="break-words">{thought.content}</p>
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

    
    