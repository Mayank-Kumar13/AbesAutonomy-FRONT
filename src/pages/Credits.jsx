import React, { useState, useEffect } from 'react';
import Credit_Card from '../component/credit_card/Credit_Card.jsx';
import ContributorCard from '../component/credit_card/ContributorCard.jsx';
import { creditsApi } from '../services/api';
import './Credits.css';

const Credits = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await creditsApi.getPublicCredits();
        setSections(response.data || []);
      } catch (err) {
        console.error("Failed to fetch credits:", err);
        setError("Our credits are being updated. Please check back later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, []);

  if (loading) {
    return (
      <div className="details" style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Loading Credits...</h2>
      </div>
    );
  }

  if (error || sections.length === 0) {
    return (
      <div className="details" style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>{error || "Our credits are being updated. Please check back later."}</h2>
      </div>
    );
  }

  return (
    <>
      <div className="details" style={{ marginBottom: '2rem' }}>
        <h2>Credits</h2>
        <p>Special thanks to the team of ABES Autonomy</p>
      </div>
      
      {sections.map((section) => (
        <React.Fragment key={section._id}>
          <div className="details">
            <h3 id="contributor-heading">{section.title}</h3>
            {section.description && <p style={{ color: '#a0aec0', marginTop: '0.5rem' }}>{section.description}</p>}
          </div>
          <div
            id="contributor-card"
            className={section.type === 'contributor' ? 'credits-container contributors-grid' : 'credits-container'}
          >
            {section.members && section.members.map(member => (
              section.type === 'contributor' ? (
                <ContributorCard
                  key={member._id}
                  name={member.name}
                  year={member.year}
                  image={member.photoUrl || '/avatar-placeholder.png'}
                  github={member.github}
                  linkedin={member.linkedin}
                  instagram={member.instagram}
                  role={member.role}
                />
              ) : (
                <Credit_Card
                  key={member._id}
                  name={member.name}
                  year={member.year}
                  description={member.description}
                  image={member.photoUrl || '/avatar-placeholder.png'}
                  github={member.github}
                  linkedin={member.linkedin}
                  instagram={member.instagram}
                  role={member.role}
                />
              )
            ))}
          </div>
        </React.Fragment>
      ))}
    </>
  );
};

export default Credits;