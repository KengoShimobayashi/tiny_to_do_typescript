export type UserAccount = {
  id: string;
  hashedPassword: string;
  expires: Date;
  todoList: string[];
};
