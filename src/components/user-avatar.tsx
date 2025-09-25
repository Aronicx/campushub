
"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { LayoutDashboard, LogOut, Trash2, Users, Loader2, Lock, ShieldCheck, Palette } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Switch } from "./ui/switch";
import { cn } from "@/lib/utils";

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
});

const profileColors = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
    "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
    "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
];

function PasswordEditor() {
    const { changePassword } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    });

    async function onSubmit(values: z.infer<typeof passwordFormSchema>) {
        setIsSubmitting(true);
        const success = await changePassword(values.currentPassword, values.newPassword);
        if (success) {
            form.reset();
        }
        setIsSubmitting(false);
    }

    return (
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
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Password
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function SecurityDialog() {
    const { currentUser, updateProfile } = useAuth();
    
    if (!currentUser) return null;

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Security &amp; Privacy</DialogTitle>
                <DialogDescription>Manage your password and profile privacy settings.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="private-profile" className="text-base">Private Profile</Label>
                        <p className="text-sm text-muted-foreground">
                            If enabled, you will have to approve follow requests.
                        </p>
                    </div>
                    <Switch
                        id="private-profile"
                        checked={currentUser.isPrivate}
                        onCheckedChange={(checked) => updateProfile({ isPrivate: checked })}
                    />
                </div>
                <div>
                     <p className="font-medium text-card-foreground">Change Password</p>
                     <PasswordEditor />
                </div>
            </div>
        </DialogContent>
    )
}

function ProfileThemeDialog() {
    const { currentUser, updateProfile } = useAuth();
    const [selectedColor, setSelectedColor] = useState(currentUser?.profileColor || "");

    if (!currentUser) return null;

    const handleSave = () => {
        updateProfile({ profileColor: selectedColor });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Profile Theme</DialogTitle>
                <DialogDescription>Choose a color for your profile banner. This will be visible to everyone.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 py-4">
                {profileColors.map(color => (
                    <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                            "w-full h-16 rounded-md transition-all",
                            color,
                            selectedColor === color ? "ring-2 ring-offset-2 ring-primary" : "hover:opacity-80"
                        )}
                        aria-label={`Select ${color}`}
                    />
                ))}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button onClick={handleSave} disabled={selectedColor === currentUser.profileColor}>Save</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    )
}

export function UserAvatar() {
  const { currentUser, logout, deleteProfile } = useAuth();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<"security" | "theme" | null>(null);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!currentUser) return null;

  const initials = (currentUser.name || "NN")
    .split(" ")
    .map((n) => n[0])
    .join("");
    
  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteProfile(password);
    setIsDeleting(false);
    setIsAlertOpen(false);
    setPassword("");
  }
  
  const onAlertOpenChange = (open: boolean) => {
    if (isDeleting) return;
    setIsAlertOpen(open);
    if (!open) {
      setPassword("");
    }
  }

  return (
    <>
        <Dialog onOpenChange={(open) => !open && setDialogOpen(null)}>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                    <AvatarImage
                    src={currentUser.profilePicture || undefined}
                    alt={currentUser.name || 'User'}
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name || '(no name)'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                    </p>
                </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                <Link href="/connections">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Connections</span>
                </Link>
                </DropdownMenuItem>
                <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={() => setDialogOpen("theme")}>
                        <Palette className="mr-2 h-4 w-4" />
                        <span>Profile Theme</span>
                    </DropdownMenuItem>
                </DialogTrigger>
                <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={() => setDialogOpen("security")}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Security &amp; Privacy</span>
                    </DropdownMenuItem>
                </DialogTrigger>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsAlertOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Profile</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
            {dialogOpen === 'security' && <SecurityDialog />}
            {dialogOpen === 'theme' && <ProfileThemeDialog />}
        </Dialog>
        <AlertDialog open={isAlertOpen} onOpenChange={onAlertOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers. Please enter your password to confirm.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor="password-confirm">Password</Label>
                    <Input 
                        id="password-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={!password || isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                         {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
