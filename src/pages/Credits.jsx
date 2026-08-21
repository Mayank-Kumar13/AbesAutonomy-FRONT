import React from 'react'
import Credit_Card from '../component/credit_card/Credit_Card.jsx'
import "./Credits.css"
const Credits = () => {
    let linkedin=["https://www.linkedin.com/in/mayank-kotuli-445891363/","https://www.linkedin.com/in/mayank-kumar-206209377/","https://www.linkedin.com/in/mukul-yadav-19ab44377/"]
    let instagram=["https://www.instagram.com/_mayank099_/","https://www.instagram.com/tomar.13?igsh=MWFmeWp0azkzYzZiOA==","https://www.instagram.com/oogway5001/"]
    let github=["https://github.com/mayankkotuli099","https://github.com/Mayank-Kumar13","https://github.com/mukul2007yadav-lab"]
    let description=["Passionate about technology and innovation, constantly learning, building, and turning ideas into impactful solutions while growing into a better developer every day.","Believes consistency beats talent, learning something new every day while building skills for a brighter future.","Believes in the power of continuous learning and deep problem-solving. Passionate about tackling complex data structures and building webapps "]
  return (
    <>
    <div className="details">
    <h2>Credits</h2>
    <p>Special thanks to the team of ABES Autonomy</p>
    </div>
    <div className="credits-container">
    <Credit_Card name="Mayank Kotuli" year="2nd Year" description={description[0]} image="/koutli_2.jpeg" github={github[0]} linkedin={linkedin[0]} instagram={instagram[0]}  />
    <Credit_Card name="Mayank Kumar" year="2nd Year" description={description[1]} image="/TOMAR.png" github={github[1]} linkedin={linkedin[1]} instagram={instagram[1]}  />
    <Credit_Card name="Mukul Yadav" year="2nd Year" description={description[2]} image="/image.png" github={github[2]} linkedin={linkedin[2]} instagram={instagram[2]} />
    </div>
    </>
  )
}

export default Credits
