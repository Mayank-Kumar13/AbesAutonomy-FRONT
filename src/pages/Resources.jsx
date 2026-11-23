import { ArrowUpRight, BookOpen, BookMarked, NotebookPen, ScrollText, ListChecks, LibraryBig } from "lucide-react";
import { Link } from "react-router-dom";
import { CardBody, CardContainer, CardItem } from "../component/ui/3d-card";
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
          {resources.map(({ type, title, detail, icon: Icon }) => (
            <li key={type}>
              <CardContainer containerClassName="h-full py-0" className="resource-tilt h-full w-full">
                <CardBody className="h-full w-full">
                  <Link className="resource-cover" data-type={type} to="/ChooseSubject"
                    state={{ resourceType: type, resourceTitle: title.toUpperCase() }}>
                    <CardItem as="span" translateZ={50} className="resource-cover__mark" aria-hidden="true">
                      <Icon size={30} strokeWidth={1.25} />
                    </CardItem>
                    <ArrowUpRight className="resource-cover__arrow" size={18} aria-hidden="true" />
                    <CardItem as="h2" translateZ={32}>{title}</CardItem>
                    <CardItem as="p" translateZ={16}>{detail}</CardItem>
                  </Link>
                </CardBody>
              </CardContainer>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
