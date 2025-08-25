
const students: any[] = Array.from({ length: 41 }, (_, i) => {
    const rollNo = (i + 1).toString();
    const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Saanvi", "Aadhya", "Kiara", "Diya", "Pari", "Ananya", "Riya", "Sitara", "Avni", "Amaira"];
    const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Shah", "Mehta", "Joshi", "Khan"];
    const majors = ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Biotechnology", "Architecture", "Business Administration"];
    const interests = ["Coding", "AI", "Robotics", "Reading", "Music", "Sports", "Gaming", "Photography", "Debating", "Entrepreneurship"];
    
    const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
    
    return {
        id: rollNo,
        rollNo: rollNo,
        name: name,
        major: majors[i % majors.length],
        interests: [interests[i % interests.length], interests[(i + 1) % interests.length], interests[(i + 2) % interests.length]],
        profilePicture: `https://placehold.co/400x400.png`,
        bio: `Hello! I am ${name}, a student of ${majors[i % majors.length]}. My roll number is ${rollNo}. I am passionate about developing new things.`,
        email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
        thoughts: [],
        password: "password123",
        instagram: `${name.toLowerCase().replace(" ", "_")}`,
        snapchat: `${name.toLowerCase().replace(" ", "")}${rollNo}`,
        discord: `${name.replace(" ", "")}#${rollNo.padStart(4,'0')}`,
        phoneNumber: `123-456-78${(i+10).toString().padStart(2,'0')}`,
        customLink: `https://example.com/${name.toLowerCase().replace(" ", "")}`
    };
});


export const privateData = {
  _initialStudents: students
};
