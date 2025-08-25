
const students: any[] = [
  {
    id: '1',
    rollNo: '1',
    name: 'Aarav Sharma',
    major: 'Computer Science',
    interests: ['Artificial Intelligence', 'Cybersecurity', 'Web Development'],
    profilePicture: 'https://placehold.co/400x400.png',
    bio: 'A passionate programmer and tech enthusiast, always exploring new technologies. Loves to build cool projects and contribute to open source.',
    email: 'aarav.sharma@example.com',
    thoughts: [
        { id: '1-thought-1', content: 'Excited to start the new semester! Looking forward to the AI course.', timestamp: '2023-08-20T10:00:00Z' },
        { id: '1-thought-2', content: 'Just finished a fun web project. React is awesome!', timestamp: '2023-08-22T15:30:00Z' }
    ],
    password: 'password123',
    instagram: 'aarav.codes',
    snapchat: 'aarav_s',
    discord: 'Aarav#1234',
    phoneNumber: '+91 12345 67890',
    customLink: 'https://github.com/aaravsharma'
  }
];

export const privateData = {
  _initialStudents: students
};
