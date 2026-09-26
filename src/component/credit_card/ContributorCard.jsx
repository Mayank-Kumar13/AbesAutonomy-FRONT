import React from 'react'
import "./ContributorCard.css"

// Same visual language as Credit_Card (full-bleed photo, gradient overlay,
// hover lift + zoom) but smaller, and without the socials/URL row — this is
// the compact "Contributor Badge" card.
const ContributorCard = (props) => {
  return (
    <div className="contributor-card">
      <img src={props.image} alt={props.name} />
      <div className="contributor-overlay"></div>
      <div className="contributor-content">
        {props.year && <span className="contributor-year">{props.year}</span>}
        <h2>{props.name}</h2>
        {props.role && <h4>{props.role}</h4>}
      </div>
    </div>
  )
}

export default ContributorCard