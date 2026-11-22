import React, { useState, useEffect } from 'react';
import { creditsApi } from '../services/api';
import CreditsExperience from './credits/CreditsExperience';
import './Credits.css';

const Credits = () => {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchCredits = async () => {
      try {
        const response = await creditsApi.getPublicCredits();
        if (isMounted && response?.data) {
          setSections(response.data);
        }
      } catch (err) {
        console.warn("Using offline verified credits dataset:", err);
      }
    };

    fetchCredits();
    return () => {
      isMounted = false;
    };
  }, []);

  return <CreditsExperience liveSections={sections} />;
};

export default Credits;
