import React from 'react'
import { FaGithub, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import "./ContributorCard.css"

const ContributorCard = (props) => {
  const hasSocials = props.github || props.linkedin || props.instagram;

  return (
    <div className="contributor-card">
      <div className="contributor-card-stripe" />

      <div className="contributor-card-header">
        <span>CONTRIBUTOR</span>
        {props.year && <span>{props.year}</span>}
      </div>

      <div className="contributor-card-body">
        <img
          className="contributor-card-photo"
          src={props.image || '/avatar-placeholder.png'}
          alt={props.name}
        />
        <div className="contributor-card-info">
          <h4 className="contributor-card-name">{props.name}</h4>
          {props.role && <p className="contributor-card-role">{props.role}</p>}
        </div>
      </div>

      {hasSocials && (
        <div className="contributor-card-socials">
          {props.github && (
            <a href={props.github} target="_blank" rel="noreferrer" aria-label="GitHub">
              <FaGithub />
            </a>
          )}
          {props.linkedin && (
            <a href={props.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <FaLinkedinIn />
            </a>
          )}
          {props.instagram && (
            <a href={props.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default ContributorCard