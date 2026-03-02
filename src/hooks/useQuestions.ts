import { useState, useEffect } from 'react';

export interface QuestionOption {
  id: string;
  text: string;
  questionTemplateId: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'CHECKBOX' | 'RADIO' | 'TEXT' | 'SLIDER' | 'RISK';
  stage: string;
  orderIndex: number;
  options: QuestionOption[];
}

export interface QuestionsResponse {
  success: boolean;
  stage: string;
  questions: Question[];
}

export function useQuestions(stage: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/questions?stage=${stage}`);
        const data: QuestionsResponse = await response.json();
        
        if (data.success) {
          setQuestions(data.questions);
        } else {
          setError('Failed to fetch questions');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    if (stage) {
      fetchQuestions();
    }
  }, [stage]);

  return { questions, loading, error };
}
