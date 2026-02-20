import { CoursesHeader } from "../components/Courses/CoursesHeader";
import { CourseCard } from "../components/Courses/CourseCard";

const COURSES_DATA = [
  {
    id: 1,
    code: "CS 301",
    title: "Data Structures & Algorithms",
    instructor: "Ahmed Hassan",
    schedule: "Sun, Tue 10:00 AM",
    tasks: 3,
  },
  {
    id: 2,
    code: "CS 302",
    title: "Algorithm Analysis",
    instructor: "Fatma Ibrahim",
    schedule: "Mon, Wed 2:00 PM",
    tasks: 5,
  },
  {
    id: 3,
    code: "MATH 202",
    title: "Calculus II",
    instructor: "Mohamed Ali",
    schedule: "Sun, Tue 12:00 PM",
    tasks: 2,
  },
  {
    id: 4,
    code: "CS 305",
    title: "Database Systems",
    instructor: "Sara Khalil",
    schedule: "Mon, Wed 10:00 AM",
    tasks: 4,
  },
  {
    id: 5,
    code: "PHYS 101",
    title: "Physics for Engineers",
    instructor: "Omar Youssef",
    schedule: "Thu 9:00 AM",
    tasks: 1,
  },
  {
    id: 6,
    code: "MATH 203",
    title: "Linear Algebra",
    instructor: "Noha Mahmoud",
    schedule: "Tue, Thu 1:00 PM",
    tasks: 2,
  },
];

export function Courses() {
  return (
    <div className="space-y-6 mt-20 px-6 pb-24 md:pb-6">
      <CoursesHeader totalCourses={COURSES_DATA.length} />

      {/* Courses Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COURSES_DATA.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
