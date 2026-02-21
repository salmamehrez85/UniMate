import { AvailableQuizzes } from "../components/Quizzes/AvailableQuizzes";
import { RecentResults } from "../components/Quizzes/RecentResults";
import { GenerateQuizForm } from "../components/Quizzes/GenerateQuizForm";

export function Quizzes() {
  return (
    <div className="space-y-6 mt-20 px-6 pb-24 md:pb-6">
      <AvailableQuizzes />
      <RecentResults />
      <GenerateQuizForm />
    </div>
  );
}
