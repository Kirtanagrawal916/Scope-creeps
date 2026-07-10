import { fakeUsers } from "./fake-users";

export function checkLogin(email: string, password: string) {
  const foundUser = fakeUsers.find((user) => user.email === email);
  const isCorrectUser = foundUser?.password === password;

  return {
    success: isCorrectUser,
    userId: isCorrectUser ? foundUser.id : null,
  };
}
