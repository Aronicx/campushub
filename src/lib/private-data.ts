// This is a placeholder for the real private data.
const students = [];
for (let i = 1; i <= 200; i++) {
  students.push({
    id: i.toString(),
    rollNo: `R${1000 + i}`,
    name: '',
    major: 'Undeclared',
    interests: [],
    profilePicture: `https://placehold.co/400x400.png`,
    bio: '',
    email: `student${i}@example.com`,
    thoughts: [],
  });
}


export const privateData = {
  _initialStudents: students
};
