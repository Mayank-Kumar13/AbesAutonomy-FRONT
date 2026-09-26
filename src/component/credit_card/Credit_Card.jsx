import React from 'react'
import { FaGithub, FaLinkedinIn, FaInstagram, FaUser } from "react-icons/fa";
import "./Credit_Card.css"
const Credit_Card = (props) => {
  return (
    <div className="credit-card">
      <img src={props.image} alt={props.name} />
      <div className="overlay"></div>
      <div className="content">
        <span className="year">{props.year}</span>
        <h2>{props.name}</h2>
        {props.role && <h3 style={{ color: '#38bdf8', marginTop: '0.2rem', marginBottom: '0.5rem', fontSize: '1rem' }}>{props.role}</h3>}
        <h4>{props.description}</h4>
        <div className="end">
          <div className="socials">
            <a href={props.github}>
              <FaGithub />
            </a>
            <a href={props.linkedin}>
              <FaLinkedinIn />
            </a>
            <a href={props.instagram}>
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Credit_Card
