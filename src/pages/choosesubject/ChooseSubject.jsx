import React, { useState, useEffect } from 'react';
import './ChooseSubject.css';
import Unicard from "../../component/universal_card/Unicard";
import Credit_Card from "../../component/credit_card/Credit_Card";
import {Link, useLocation} from 'react-router-dom';
import { 
  LineChart, 
  BrainCircuit, 
  Cog, 
  Monitor, 
  Code, 
  ArrowRight,
  Atom,     // For Physics
  Zap,      // For Electrical
  Cpu,      // For Electronics
  Leaf,     // For EVS
  BookOpen, // Fallback icon
} from 'lucide-react';
import { metaApi } from '../../services/api';

// Icon mapping for known subjects
const SUBJECT_ICONS = {
  DSA: <LineChart size={35} strokeWidth={1.5} />,
  MATHS: <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 'bold', fontSize: '28px', lineHeight: '1' }}>f(x)</span>,
  PHYSICS: <Atom size={35} strokeWidth={1.5} />,
  EVS: <Leaf size={35} strokeWidth={1.5} />,
  AI: <BrainCircuit size={35} strokeWidth={1.5} />,
  ELECTRICAL: <Zap size={35} strokeWidth={1.5} />,
  'SOFT SKILL': <Code size={35} strokeWidth={1.5} />,
  DT: <Monitor size={35} strokeWidth={1.5} />,
  MECHANICS: <Cog size={35} strokeWidth={1.5} />,
  ELECTRONICS: <Cpu size={35} strokeWidth={1.5} />,
};

// Descriptions for known subjects
const SUBJECT_DESC = {
  DSA: "Data Structures and Algorithms",
  MATHS: "Mathematics for Problem Solving",
  PHYSICS: "Engineering Physics and Applications",
  EVS: "Environmental Studies and Sustainability",
  AI: "Artificial Intelligence Fundamentals",
  ELECTRICAL: "Basic Electrical Engineering",
  'SOFT SKILL': "Soft Skills and Personal Development",
  DT: "Digital Techniques and Logic Design",
  MECHANICS: "Engineering Mechanics and Dynamics",
  ELECTRONICS: "Fundamentals of Electronics Engineering",
};

// Fallback hardcoded subjects per branch
const FALLBACK_SUBJECTS = {
  electrical: ['DSA', 'MATHS', 'PHYSICS', 'EVS', 'AI', 'ELECTRICAL'],
  electronics: ['DSA', 'MATHS', 'SOFT SKILL', 'DT', 'MECHANICS', 'ELECTRONICS'],
};


const HANDWRITTEN_CREDIT = {
  name: "NITIN",
  year: "2nd Year",
  description:
    "Topper student with 10 SGPA. Contributed high-quality handwritten notes to help fellow students excel in their academics.",
  image: "/NITIN.jpeg",
  github: "https://github.com/nitinbhhardwaj",
  linkedin: "https://www.linkedin.com/in/nitin-bhardwaj-8bb880395/",
  instagram: "https://www.instagram.com/nitinbhhardwaz?igsh=MWlwbDFsZmVrY28wYQ%3D%3D&igsi=MWlwbDFsZmVrY28wYQ%3D%3D&utm_source=qr",
};

const ChooseSubject = () => {
  const location = useLocation();
  const { year = 1, resourceType = 'theory', resourceTitle = 'THEORY NOTES' } = location.state || {};

  const [activeGroup, setActiveGroup] = useState('electrical');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const isHandwritten = resourceType === 'handwritten';

  // Always use the static subjects configuration as requested by the user.
  // We do not want to hide subjects just because they lack MongoDB records.
  useEffect(() => {
    setSubjects(FALLBACK_SUBJECTS[activeGroup] || []);
    setLoading(false);
  }, [activeGroup]);

  const displayedSubjects = subjects.map(subjectName => ({
    heading: subjectName,
    para: SUBJECT_DESC[subjectName] || `${subjectName} Study Materials`,
    icon: SUBJECT_ICONS[subjectName] || <BookOpen size={35} strokeWidth={1.5} />,
  }));

  return (
    <div className="choose-subject-wrapper">
      <div className="choose-subject-container">
        <div className="header-section">
          <div className="title-container">
            <h1 className="page-title">CHOOSE SUBJECT</h1>
            <p className="page-subtitle">Select a subject to explore all related resources, notes, previous papers and more.</p>
          </div>
          <div className="semester-container">
            <span className="semester-label">GROUP</span>
            <div className="semester-buttons">
              <button className={`sem-btn ${activeGroup === 'electrical' ? 'active' : ''}`} onClick={() => setActiveGroup('electrical')}>Electrical</button>
              <button className={`sem-btn ${activeGroup === 'electronics' ? 'active' : ''}`} onClick={() => setActiveGroup('electronics')}>Electronics</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <p>Loading subjects...</p>
          </div>
        ) : displayedSubjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <p>No subjects found for this combination.</p>
          </div>
        ) : (
          <div className="subject-grid">
            {displayedSubjects.map((subject, index) => (
              <Link
                to="/subject"
                state={{
                  heading: subject.heading,
                  para: subject.para,
                  year: year,
                  resourceType: resourceType,
                  branch: activeGroup,
                }}
                style={{ textDecoration: 'none', color: 'inherit' }}
                key={index}
              >
                <Unicard 
                  key={index} heading={subject.heading} para={subject.para} icon={subject.icon}
                  btnn={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Explore <ArrowRight size={16} /></div>}
                />
              </Link>
            ))}
          </div>
        )}

        {/* ─── Credit Card — Only for Handwritten Notes ─── */}
        {isHandwritten && (
          <div className="handwritten-credit-section">
            <div className="handwritten-credit-header">
              <h2 className="handwritten-credit-title">Notes Contributed By</h2>
              <p className="handwritten-credit-subtitle">
                Special thanks to the student who made these handwritten notes available for everyone.
              </p>
            </div>
            <div className="handwritten-credit-card-wrapper">
              <Credit_Card
                name={HANDWRITTEN_CREDIT.name}
                year={HANDWRITTEN_CREDIT.year}
                description={HANDWRITTEN_CREDIT.description}
                image={HANDWRITTEN_CREDIT.image}
                github={HANDWRITTEN_CREDIT.github}
                linkedin={HANDWRITTEN_CREDIT.linkedin}
                instagram={HANDWRITTEN_CREDIT.instagram}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChooseSubject;