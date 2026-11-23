import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CardBody, CardContainer, CardItem } from "./3d-card";
import "./ResourceCover.css";

export default function ResourceCover({ type, title, detail, icon, to, state, action, heading = "h2" }) {
  return (
    <CardContainer containerClassName="h-full py-0" className="resource-tilt h-full w-full">
      <CardBody className="relative h-full w-full">
        <Link className="resource-cover" data-type={type} to={to} state={state}>
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
