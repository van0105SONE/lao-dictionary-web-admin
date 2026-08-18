export interface Word {
  id: number;
  word: string;
  part_of_speech: string;
  pronunciation: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CorrectIncorrectWord {
  id: number;
  correct_word: string;
  incorrect_word: string;
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Statistic {
  total_active_user: number;
  total_word: number;
  total_incorrect: number;
}

export interface User {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt?: Date;
}
