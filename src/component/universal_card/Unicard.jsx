import React from "react";
import "./Unicard.css";

const Unicard = ({ icon, heading, para, btnn }) => {
  return (
    <article className="unicard-root card glass-clear">
      <div className="unicard-specular" aria-hidden="true" />
      
      <div className="unicard-icon-wrap logo">
        {icon}
      </div>

      <div className="unicard-content">
        <h2 className="unicard-heading heading">{heading}</h2>
        <p className="unicard-para para">{para}</p>
      </div>

      <div className="unicard-footer">
        <span className="unicard-btn btnn">
          {btnn}
        </span>
      </div>
    </article>
  );
};

export default Unicard;
