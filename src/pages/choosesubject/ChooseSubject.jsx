import React, { useState, useEffect } from 'react';
import './ChooseSubject.css';
import Unicard from "../../component/universal_card/Unicard";
import Credit_Card from "../../component/credit_card/Credit_Card";
import {Link, useLocation, useNavigate} from 'react-router-dom';
import { 
  LineChart, 
  BrainCircuit, 
  Cog, 
  Monitor, 
  Code, 
  ArrowRight,
  Atom,     
  Zap,      
  Cpu,      
  Leaf,     
  BookOpen, 
} from 'lucide-react';
import { subjectsApi } from '../../services/api';

// Icon mapping for fallback or direct mapping
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
  const navigate = useNavigate();
  const { year: initialYear, resourceType = 'theory', resourceTitle = 'THEORY NOTES' } = location.state || {};

  const [activeGroup, setActiveGroup] = useState(() => sessionStorage.getItem('abes_activeGroup') || 'electrical');
  const [selectedYear, setSelectedYear] = useState(() => initialYear || Number(sessionStorage.getItem('abes_selectedYear')) || 1);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const isHandwritten = resourceType === 'handwritten';

  useEffect(() => {
    sessionStorage.setItem('abes_selectedYear', selectedYear);
    sessionStorage.setItem('abes_activeGroup', activeGroup);
    
    if (location.state && location.state.year) {
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, year: undefined }
      });
    }
  }, [selectedYear, activeGroup, location.state, location.pathname, navigate]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    setLoading(true);
    // Fetch only subjects that actually have notes for this specific resourceType
    import('../../services/api').then(({ metaApi }) => {
      metaApi.getSubjects({ year: selectedYear, branch: activeGroup, resourceType }, { signal: controller.signal })
        .then(res => {
          if (isMounted) {
            setSubjects(res.data || []);
            setLoading(false);
          }
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
          console.error("Failed to fetch subjects:", err);
          if (isMounted) {
            setSubjects([]);
            setLoading(false);
          }
        });
    });
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeGroup, selectedYear, resourceType]);

  // Map DB subjects to frontend format
  const displayedSubjects = subjects.map(subj => {
    const subjectName = subj.subject || subj.name || "Unknown";
    const iconName = subj.icon || 'BookOpen';
    // Fallback to our existing mapping if available, otherwise use default BookOpen
    let mappedIcon = SUBJECT_ICONS[subjectName.toUpperCase()] || <BookOpen size={35} strokeWidth={1.5} />;
    
    return {
      heading: subjectName,
      para: subj.description || `${subjectName} Study Materials (${subj.count || 0} files)`,
      icon: mappedIcon,
    };
  });

  return (
    <div className="choose-subject-wrapper">
      <div className="choose-subject-container">
        <div className="header-section">
          <div style={{ color: '#d4a373', marginBottom: '16px', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#d4a373'} onClick={() => navigate('/resources')}>RESOURCES</span>
            <span>/</span>
            <span style={{ color: '#fff' }}>{resourceTitle.toUpperCase()}</span>
          </div>
          <div className="title-container">
            <h1 className="page-title">CHOOSE SUBJECT</h1>
            <p className="page-subtitle">Select a subject to explore all related resources, notes, previous papers and more.</p>
          </div>
          
          <div className="filter-controls-container">
            {/* Year Selector */}
            <div className="semester-container">
              <span className="semester-label">YEAR</span>
              <div className="semester-buttons">
                <button className={`sem-btn ${selectedYear === 1 ? 'active' : ''}`} onClick={() => { setSelectedYear(1); setActiveGroup('electrical'); }}>YEAR 1</button>
                <button className={`sem-btn ${selectedYear === 2 ? 'active' : ''}`} onClick={() => { setSelectedYear(2); setActiveGroup('cse'); }}>YEAR 2</button>
              </div>
            </div>

            {/* Group Selector - Year 1 */}
            {selectedYear === 1 && (
              <div className="semester-container">
                <span className="semester-label">GROUP</span>
                <div className="semester-buttons">
                  <button className={`sem-btn ${activeGroup === 'electrical' ? 'active' : ''}`} onClick={() => setActiveGroup('electrical')}>Electrical</button>
                  <button className={`sem-btn ${activeGroup === 'electronics' ? 'active' : ''}`} onClick={() => setActiveGroup('electronics')}>Electronics</button>
                </div>
              </div>
            )}

            {/* Group Selector - Year 2 */}
            {selectedYear === 2 && (
              <div className="semester-container">
                <span className="semester-label">BRANCH</span>
                <div className="semester-buttons">
                  <button className={`sem-btn ${activeGroup === 'cse' ? 'active' : ''}`} onClick={() => setActiveGroup('cse')}>CSE</button>
                  <button className={`sem-btn ${activeGroup === 'ds' ? 'active' : ''}`} onClick={() => setActiveGroup('ds')}>DS</button>
                  <button className={`sem-btn ${activeGroup === 'aiml' ? 'active' : ''}`} onClick={() => setActiveGroup('aiml')}>AIML</button>
                  <button className={`sem-btn ${activeGroup === 'ece' ? 'active' : ''}`} onClick={() => setActiveGroup('ece')}>ECE</button>
                  <button className={`sem-btn ${activeGroup === 'elce' ? 'active' : ''}`} onClick={() => setActiveGroup('elce')}>ELCE</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <p>Loading subjects...</p>
          </div>
        ) : displayedSubjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <p>No subjects available for Year {selectedYear} {activeGroup} yet.</p>
            <p>Please check back later.</p>
          </div>
        ) : (
          <div className="subject-grid">
            {displayedSubjects.map((subject, index) => (
              <Link
                to="/subject"
                state={{
                  heading: subject.heading,
                  para: subject.para,
                  year: selectedYear,
                  resourceType: resourceType,
                  resourceTitle: resourceTitle,
                  branch: activeGroup,
                }}
                style={{ textDecoration: 'none', color: 'inherit' }}
                key={index}
              >
                <Unicard 
                  heading={subject.heading} 
                  para={subject.para} 
                  icon={subject.icon}
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