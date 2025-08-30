
"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import { getClicksByAuthor, addClick, deleteClick } from "@/lib/mock-data";
import type { Student, Click } from "@/lib/types";
import { resizeAndCompressImage } from "@/lib/utils";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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

import { Wand2, Users, Loader2, User, BrainCircuit, BookOpen, KeyRound, Instagram, MessageCircle, Phone, Link2, Mail, Camera, Edit, Lock, Trash2, Upload, X, ImagePlus } from "lucide-react";


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

function PasswordEditor() {
    const { changePassword } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                <CardDescription>What's on your mind today? This thought will vanish in 24 hours.</CardDescription>
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUpdating(true);
      try {
        const compressedImage = await resizeAndCompressImage(file, 256, 256);
        onUpdate({ profilePicture: compressedImage });
      } catch (error) {
        console.error("Failed to process image:", error);
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


function UploadDialog({ userClickCount, onUploadSuccess }: { userClickCount: number; onUploadSuccess: (newClick: Click) => void }) {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const CLICK_LIMIT = 3;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ variant: 'destructive', title: 'File Too Large', description: 'Please select an image smaller than 2MB.' });
                return;
            }
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file || !currentUser) return;
        setIsUploading(true);
        try {
            const compressedDataUrl = await resizeAndCompressImage(file, 1080, 1920, 0.8);
            const newClick = await addClick(currentUser, compressedDataUrl);
            onUploadSuccess(newClick);
            toast({ title: 'Click posted!', description: 'Your image is now visible to others.' });
            handleClose();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreview(null);
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setIsOpen(false);
    }
    
    if (!currentUser) return null;

    const clicksLeft = CLICK_LIMIT - userClickCount;
    const canUpload = clicksLeft > 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isUploading && setIsOpen(open)}>
            <DialogTrigger asChild>
                <Button disabled={!canUpload}>
                    <Upload className="mr-2" /> Share a Click ({clicksLeft} left)
                </Button>
            </DialogTrigger>
            <DialogContent onInteractOutside={(e) => {if(isUploading) e.preventDefault()}}>
                <DialogHeader>
                    <DialogTitle>Share a Click</DialogTitle>
                    <DialogDescription>
                        Upload an image to share with the campus. It will disappear in 20 hours.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">You have {clicksLeft} of {CLICK_LIMIT} clicks left.</p>
                        <Progress value={(userClickCount / CLICK_LIMIT) * 100} className="w-full h-2" />
                    </div>

                    {!preview ? (
                        <div 
                            className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-10 cursor-pointer hover:bg-muted/50"
                             onClick={() => fileInputRef.current?.click()}
                        >
                            <ImagePlus className="h-10 w-10 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Click to browse or drag & drop</p>
                            <p className="text-xs text-muted-foreground/80">PNG, JPG, WEBP up to 2MB</p>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                                onChange={handleFileChange}
                                disabled={!canUpload || isUploading}
                            />
                        </div>
                    ) : (
                        <div className="relative">
                            <Image src={preview} alt="Image preview" width={500} height={500} className="rounded-md object-contain max-h-[400px]" />
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => { setPreview(null); setFile(null); }} disabled={isUploading}>
                                <X size={16}/>
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={handleClose} disabled={isUploading}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={!file || !canUpload || isUploading}>
                        {isUploading ? <><Loader2 className="mr-2 animate-spin" /> Uploading...</> : <>Post Click</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function MyClicksManager({ initialClicks, onDelete }: { initialClicks: Click[], onDelete: (clickId: string) => void }) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (click: Click) => {
        setIsDeleting(click.id);
        try {
            await deleteClick(click);
            onDelete(click.id);
            toast({ title: "Click Deleted", description: "Your click has been removed." });
        } catch (error) {
            console.error("Failed to delete click:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to delete click." });
        } finally {
            setIsDeleting(null);
        }
    }

    if (initialClicks.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Daily Clicks</CardTitle>
                    <CardDescription>You haven't posted any clicks recently.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Daily Clicks</CardTitle>
                <CardDescription>These are your active clicks. They will disappear 20 hours after posting.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {initialClicks.map(click => (
                    <div key={click.id} className="relative group">
                        <Image src={click.imageUrl} alt="My Click" width={200} height={350} className="rounded-md object-cover aspect-[9/16]" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" disabled={isDeleting === click.id}>
                                        {isDeleting === click.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete this Click?</AlertDialogTitle>
                                        <AlertDialogDescription>This action cannot be undone. This will permanently delete your click.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(click)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export default function ProfilePage() {
  const { currentUser, isLoading: isAuthLoading, updateProfile } = useAuth();
  const router = useRouter();
  const [myClicks, setMyClicks] = useState<Click[]>([]);
  const [isLoadingClicks, setIsLoadingClicks] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      router.push("/login");
    }
  }, [isAuthLoading, currentUser, router]);

   useEffect(() => {
    if (currentUser) {
      setIsLoadingClicks(true);
      getClicksByAuthor(currentUser.id).then(clicks => {
        setMyClicks(clicks);
        setIsLoadingClicks(false);
      });
    }
  }, [currentUser]);


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

  const handleUploadSuccess = (newClick: Click) => {
    setMyClicks(prev => [...prev, newClick]);
  }

  const handlePostDelete = (deletedClickId: string) => {
    setMyClicks(prev => prev.filter(click => click.id !== deletedClickId));
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentUser.profilePicture || undefined} alt={currentUser.name || 'User'} />
          <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">This is your personal profile.</p>
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
                    </CardContent>
                </Card>

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
            </div>
        </TabsContent>
        <TabsContent value="posts" className="mt-6">
             <div className="space-y-6">
                <DailyThoughtPoster />
                <Card>
                    <CardHeader>
                        <CardTitle>Share a Daily Click</CardTitle>
                        <CardDescription>Share a photo with campus. It will disappear in 20 hours. You can post up to 3.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UploadDialog onUploadSuccess={handleUploadSuccess} userClickCount={myClicks.length}/>
                    </CardContent>
                </Card>
                {isLoadingClicks ? (
                    <Skeleton className="h-48 w-full" />
                ) : (
                    <MyClicksManager initialClicks={myClicks} onDelete={handlePostDelete}/>
                )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
    
