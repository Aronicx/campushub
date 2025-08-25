
const studentData = [
    { name: "Aarav Sharma", major: "Computer Science" },
    { name: "Vivaan Singh", major: "Electrical Engineering" },
    { name: "Aditya Kumar", major: "Mechanical Engineering" },
    { name: "Vihaan Gupta", major: "Civil Engineering" },
    { name: "Arjun Mehta", major: "Chemical Engineering" },
    { name: "Sai Patel", major: "Biotechnology" },
    { name: "Reyansh Reddy", major: "Aerospace Engineering" },
    { name: "Krishna Iyer", major: "Physics" },
    { name: "Ishaan Choudhury", major: "Chemistry" },
    { name: "Advik Nair", major: "Mathematics" },
    { name: "Ananya Rao", major: "Biology" },
    { name: "Diya Verma", major: "Economics" },
    { name: "Saanvi Joshi", major: "Psychology" },
    { name: "Myra Desai", major: "History" },
    { name: "Aadhya Pillai", major: "Political Science" },
    { name: "Kiara Khanna", major: "Sociology" },
    { name: "Siya Kapoor", major: "Literature" },
    { name: "Pari Malhotra", major: "Philosophy" },
    { name: "Aarohi Bajaj", major: "Fine Arts" },
    { name: "Ishani Aggarwal", major: "Music" }
];

function getRandomInterests(count = 3) {
    const allInterests = ["Reading", "Gaming", "Hiking", "Cooking", "Photography", "Traveling", "Painting", "Sports", "Music", "Movies", "Coding", "Yoga", "Dancing", "Writing", "Volunteering", "AI", "Blockchain", "Robotics", "3D Printing", "Astrophysics"];
    const shuffled = allInterests.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

const students = [];
for (let i = 1; i <= 200; i++) {
  const data = studentData[i % studentData.length];
  students.push({
    id: i.toString(),
    rollNo: i.toString(),
    name: `${data.name}`,
    major: data.major,
    interests: getRandomInterests(),
    profilePicture: `https://placehold.co/400x400.png`,
    bio: `A passionate student of ${data.major}, exploring the world and its wonders.`,
    email: `student${i}@example.com`,
    thoughts: [],
    password: `password${i}`,
    instagram: '',
    snapchat: '',
    discord: '',
    phoneNumber: '',
    customLink: '',
  });
}


export const privateData = {
  _initialStudents: students
};
