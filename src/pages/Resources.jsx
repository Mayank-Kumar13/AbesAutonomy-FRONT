import { BookOpen, BookMarked, NotebookPen, ScrollText, ListChecks, LibraryBig } from "lucide-react";
import ResourceCover from "../component/ui/ResourceCover";
import "./Resources.css";

const resources = [
  { type: "theory", title: "Theory notes", detail: "Unit notes & lecture slides", icon: BookOpen },
  { type: "handwritten", title: "Handwritten notes", detail: "Student notebooks", icon: NotebookPen },
  { type: "syllabus", title: "Syllabus", detail: "Course outlines by branch", icon: BookMarked },
  { type: "pyq", title: "PYQ papers", detail: "Past semester exams", icon: ScrollText },
  { type: "assignment", title: "Assignments", detail: "Tutorials & problem sets", icon: ListChecks },
  { type: "question_bank", title: "Question banks", detail: "Topic-wise practice", icon: LibraryBig },
];

export default function Resources() {
  return (
    <main className="resource-shelf">
      <div className="resource-shelf__inner">
        <header>
          <p>ABES Engineering College</p>
          <h1>Academic <em>Resources</em></h1>
        </header>
        <ul className="resource-shelf__grid">
          {resources.map(({ type, title, detail, icon: Icon }, index) => (
            <li key={type}>
              <ResourceCover colourIndex={index} title={title} detail={detail}
                icon={<Icon size={30} strokeWidth={1.25} />} to="/ChooseSubject"
                state={{ resourceType: type, resourceTitle: title.toUpperCase() }} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
