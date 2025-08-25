
const studentData = [
    { name: "Aarav Sharma", major: "Computer Science", interests: ["AI", "Blockchain", "Quantum Computing"] },
    { name: "Vivaan Singh", major: "Electrical Engineering", interests: ["Robotics", "Signal Processing", "Wireless Communication"] },
    { name: "Aditya Kumar", major: "Mechanical Engineering", interests: ["Fluid Dynamics", "Thermodynamics", "3D Printing"] },
    { name: "Vihaan Gupta", major: "Civil Engineering", interests: ["Structural Analysis", "Geotechnical Engineering", "Transportation"] },
    { name: "Arjun Mehta", major: "Chemical Engineering", interests: ["Process Design", "Reaction Engineering", "Catalysis"] },
    { name: "Sai Patel", major: "Biotechnology", interests: ["Genetic Engineering", "Bioinformatics", "Microbiology"] },
    { name: "Reyansh Reddy", major: "Aerospace Engineering", interests: ["Aerodynamics", "Propulsion", "Spacecraft Design"] },
    { name: "Krishna Iyer", major: "Physics", interests: ["Astrophysics", "Quantum Mechanics", "Condensed Matter"] },
    { name: "Ishaan Choudhury", major: "Chemistry", interests: ["Organic Synthesis", "Physical Chemistry", "Inorganic Chemistry"] },
    { name: "Advik Nair", major: "Mathematics", interests: ["Number Theory", "Algebraic Geometry", "Topology"] },
    { name: "Ananya Rao", major: "Biology", interests: ["Molecular Biology", "Ecology", "Neuroscience"] },
    { name: "Diya Verma", major: "Economics", interests: ["Macroeconomics", "Microeconomics", "Econometrics"] },
    { name: "Saanvi Joshi", major: "Psychology", interests: ["Cognitive Psychology", "Social Psychology", "Clinical Psychology"] },
    { name: "Myra Desai", major: "History", interests: ["Ancient History", "Modern History", "World History"] },
    { name: "Aadhya Pillai", major: "Political Science", interests: ["International Relations", "Comparative Politics", "Political Theory"] },
    { name: "Kiara Khanna", major: "Sociology", interests: ["Social Stratification", "Criminology", "Urban Sociology"] },
    { name: "Siya Kapoor", major: "Literature", interests: ["Modernist Literature", "Postcolonial Literature", "Shakespeare"] },
    { name: "Pari Malhotra", major: "Philosophy", interests: ["Epistemology", "Metaphysics", "Ethics"] },
    { name: "Aarohi Bajaj", major: "Fine Arts", interests: ["Painting", "Sculpture", "Photography"] },
    { name: "Ishani Aggarwal", major: "Music", interests: ["Classical Music", "Jazz", "Music Theory"] }
];

function getRandomInterests(count = 3) {
    const allInterests = ["Reading", "Gaming", "Hiking", "Cooking", "Photography", "Traveling", "Painting", "Sports", "Music", "Movies", "Coding", "Yoga", "Dancing", "Writing", "Volunteering"];
    const shuffled = allInterests.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

const students = [];
for (let i = 1; i <= 200; i++) {
  const data = studentData[(i - 1) % studentData.length];
  students.push({
    id: i.toString(),
    rollNo: i.toString(),
    name: `${data.name} ${i}`,
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
