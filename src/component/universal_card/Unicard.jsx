import React from "react";
import "./Unicard.css";

const Unicard = (props) => {
  return (
    <div className="card">

      <div className="logo">
        {props.icon}
      </div>

      <h2 className="heading">{props.heading}</h2>

      <p className="para">{props.para}</p>

      <button className="btnn">
        {props.btnn}
      </button>
    </div>
  );
};

export default Unicard;