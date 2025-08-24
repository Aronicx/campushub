import { getStudentById } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, BrainCircuit, CalendarDays, User, KeyRound, Instagram, MessageCircle, Phone, Link2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Student } from "@/lib/types";


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
        <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Contact & Socials</h2>
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


export default function ProfilePage({ params }: { params: { id: string } }) {
  const student = getStudentById(params.id);

  if (!student) {
    notFound();
  }

  const initials = (student.name || "NN")
    .split(" ")
    .map((n) => n[0])
    .join("");
  
  const displayName = student.name || '(no name)';

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card className="overflow-hidden shadow-lg">
        <div className="bg-muted h-32" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-20">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={student.profilePicture} alt={displayName} data-ai-hint="person student" />
              <AvatarFallback className="text-4xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 sm:mt-0">
              <h1 className="text-3xl font-bold text-primary">{displayName}</h1>
              <p className="text-lg text-muted-foreground">{student.major}</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><KeyRound size={24} /> Roll No.</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{student.rollNo}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><User size={24} /> Bio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{student.bio}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><BrainCircuit size={24} /> Interests</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {student.interests.map((interest) => (
                            <Badge key={interest} variant="default" className="bg-primary/80 hover:bg-primary text-primary-foreground">
                                {interest}
                            </Badge>
                        ))}
                    </CardContent>
                </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <ContactInfo student={student} />
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen /> Daily Thoughts
        </h2>
        {student.thoughts.length > 0 ? (
          <div className="space-y-4">
            {student.thoughts.map((thought) => (
              <Card key={thought.id}>
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
            <p className="text-muted-foreground">{displayName} hasn't shared any thoughts yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
