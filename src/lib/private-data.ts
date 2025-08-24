// This is a placeholder for the real private data.
const students = [];
for (let i = 1; i <= 200; i++) {
  students.push({
    id: i.toString(),
    rollNo: i.toString(),
    name: '',
    major: 'Undeclared',
    interests: [],
    profilePicture: `https://placehold.co/400x400.png`,
    bio: '',
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
