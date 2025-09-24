
"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import type { Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";


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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { DailyThoughtPoster } from "@/components/daily-thought-poster";

import { Wand2, Users, Loader2, User, BrainCircuit, BookOpen, Building, GraduationCap, Instagram, MessageCircle, Phone, Link2, Mail, Camera, Edit, Lock, Trash2, Upload, X, ImagePlus, ShieldCheck } from "lucide-react";


const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  collegeName: z.string().min(1, { message: "College name is required." }),
  phoneNumber: z.string().optional(),
});

const educationFormSchema = z.object({
    term: z.string().min(1, { message: "Term/Year is required." }),
    degree: z.string().min(1, { message: "Degree is required." }),
    course: z.string().min(1, { message: "Course is required." }),
});

const bioFormSchema = z.object({
    bio: z.string().min(10, { message: "Bio must be at least 10 characters." }),
});

const interestsFormSchema = z.object({
    interests: z.string().min(1, { message: "Please list at least one interest." }),
});

function ProfileEditor({ student, onUpdate }: { student: Student; onUpdate: (data: Partial<Student>) => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: student.name || "",
      email: student.email || "",
      collegeName: student.collegeName || "",
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
                    <FormField control={form.control} name="collegeName" render={({ field }) => (
                        <FormItem><FormLabel>College Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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


function SingleFieldEditor({ title, description, schema, fieldName, initialValue, onUpdate, inputType = "input" | "textarea" }: { 
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

function EducationEditor({ student, onUpdate }: { student: Student; onUpdate: (data: Partial<Student>) => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<z.infer<typeof educationFormSchema>>({
    resolver: zodResolver(educationFormSchema),
    defaultValues: {
      term: student.term || "",
      degree: student.degree || "",
      course: student.course || "",
    },
  });

  function onSubmit(values: z.infer<typeof educationFormSchema>) {
    onUpdate(values);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <Edit size={14} /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Education</DialogTitle>
          <DialogDescription>
            Update your education details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="term" render={({ field }) => (
                    <FormItem><FormLabel>Term/Year</FormLabel><FormControl><Input {...field} placeholder="e.g. 3rd Year" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="degree" render={({ field }) => (
                    <FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} placeholder="e.g. B.Eng" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="course" render={({ field }) => (
                    <FormItem><FormLabel>Course</FormLabel><FormControl><Input {...field} placeholder="e.g. Software Engineering" /></FormControl><FormMessage /></FormItem>
                )} />
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
        <CardTitle>Contact &amp; Socials</CardTitle>
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
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUpdating(true);
      try {
        // You would typically upload to a service and get a URL
        // For this mock, we'll just simulate it with a local object URL
        const objectUrl = URL.createObjectURL(file);
        onUpdate({ profilePicture: objectUrl });
        toast({ title: "Picture Updated", description: "Your new profile picture is set." });

      } catch (error) {
        console.error("Failed to process image:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to update profile picture." });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleRemovePicture = () => {
    onUpdate({ profilePicture: "" });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Button asChild variant="outline" size="sm">
          <label htmlFor="profile-picture-upload" className="cursor-pointer flex items-center">
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4"/>}
            Change Picture
          </label>
        </Button>
        <Input
          id="profile-picture-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          disabled={isUpdating}
        />
      </div>
       {student.profilePicture && !student.profilePicture.includes('picsum.photos') && (
         <Button onClick={handleRemovePicture} variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" /> Remove
        </Button>
      )}
    </div>
  );
}


export default function ProfilePage() {
  const { currentUser, isLoading: isAuthLoading, updateProfile, refreshCurrentUser } = useAuth();
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
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
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
          <AvatarImage src={currentUser.profilePicture || undefined} alt={currentUser.name || 'User'} />
          <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">@{currentUser.username}</p>
          <ProfilePictureUpdater student={currentUser} onUpdate={updateProfile} />
        </div>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="posts">My Posts</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <CardTitle>Your Information</CardTitle>
                            <CardDescription>Review and edit your personal details.</CardDescription>
                        </div>
                        <ProfileEditor student={currentUser} onUpdate={updateProfile} />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-xl">
                                    <span className="flex items-center gap-2"><GraduationCap size={24} /> Education</span>
                                    <EducationEditor student={currentUser} onUpdate={updateProfile} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                               <p className="text-muted-foreground break-words">{currentUser.degree} in {currentUser.course}, {currentUser.term}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-xl">
                                     <span className="flex items-center gap-2"><Building size={24} /> College</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                               <p className="text-muted-foreground break-words">{currentUser.collegeName}</p>
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
                    </CardContent>
                </Card>

                <SocialsEditor student={currentUser} onUpdate={updateProfile} />
            </div>
        </TabsContent>
        <TabsContent value="posts" className="mt-6">
             <div className="space-y-6">
                 <div className="flex justify-center">
                    <DailyThoughtPoster onThoughtPosted={refreshCurrentUser}>
                        <Button>Share a Thought</Button>
                    </DailyThoughtPoster>
                </div>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
