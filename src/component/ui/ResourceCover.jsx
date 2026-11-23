import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CardBody, CardContainer, CardItem } from "./3d-card";
import "./ResourceCover.css";

const coverColours = [
  { "--cloth": "#14624e", "--foil": "#c4f2c9" },
  { "--cloth": "#284d92", "--foil": "#c9deff" },
  { "--cloth": "#92502d", "--foil": "#ffdbad" },
  { "--cloth": "#823554", "--foil": "#ffd0dd" },
  { "--cloth": "#604285", "--foil": "#e6d3ff" },
  { "--cloth": "#18616f", "--foil": "#bceff3" },
  { "--cloth": "#716027", "--foil": "#fae7a4" },
  { "--cloth": "#3e4989", "--foil": "#d6d9ff" },
];

export default function ResourceCover({ colourIndex = 0, title, detail, icon, to, state, action, heading = "h2" }) {
  return (
    <CardContainer containerClassName="h-full py-0" className="resource-tilt h-full w-full">
      <CardBody className="relative h-full w-full">
        <Link className="resource-cover" style={coverColours[colourIndex % coverColours.length]} to={to} state={state}>
          <CardItem as="span" translateZ={50} className="resource-cover__mark" aria-hidden="true">
            {icon}
          </CardItem>
          {!action && <ArrowUpRight className="resource-cover__arrow" size={18} aria-hidden="true" />}
          <CardItem as={heading} translateZ={32} className="resource-cover__title">{title}</CardItem>
          {detail && <CardItem as="p" translateZ={16}>{detail}</CardItem>}
        </Link>
        {action && <div className="resource-cover__action">{action}</div>}
      </CardBody>
    </CardContainer>
  );
}
