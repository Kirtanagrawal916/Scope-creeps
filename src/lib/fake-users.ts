export type User = {
  id: string;
  email: string;
  password: string;
};

export const fakeUsers: User[] = [
  {
    id: "user_1",
    email: "alex@studio.com",
    password: "password123",
  },
  {
    id: "user_2",
    email: "sam@agency.com",
    password: "hello123",
  },
];
