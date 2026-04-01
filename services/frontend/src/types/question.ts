export interface Question {
  _id: string;
  title: string;
  description: string;
  topics: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  hints: string[];
  model_answer_code?: string;
  model_answer_lang?: string;
  images?: string[];
  version: number;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface QuestionUpsertRequest {
  _id?: string;
  title: string;
  description: string;
  topics: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  hints?: string[];
  model_answer_code?: string;
  model_answer_lang?: string;
  images?: string[];
  version?: number;
}
