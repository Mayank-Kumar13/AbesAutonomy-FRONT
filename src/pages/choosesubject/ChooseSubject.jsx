import React, { useState, useEffect } from 'react';
import './ChooseSubject.css';
import ResourceCover from "../../component/ui/ResourceCover";
import Credit_Card from "../../component/credit_card/Credit_Card";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  BrainCircuit, 
  Cog, 
  Monitor, 
  Code, 
  Atom,     
  Zap,      
  Cpu,      
  Leaf,     
  BookOpen,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';

// Icon mapping for fallback or direct mapping
const SUBJECT_ICONS = {
  DSA: <LineChart size={30} strokeWidth={1.5} />,
  MATHS: <span style={{ fontFamily: 'var(--font-family-serif)', fontStyle: 'italic', fontWeight: 'bold', fontSize: '24px', lineHeight: '1' }}>f(x)</span>,
  PHYSICS: <Atom size={30} strokeWidth={1.5} />,
  EVS: <Leaf size={30} strokeWidth={1.5} />,
  AI: <BrainCircuit size={30} strokeWidth={1.5} />,
  ELECTRICAL: <Zap size={30} strokeWidth={1.5} />,
  'SOFT SKILL': <Code size={30} strokeWidth={1.5} />,
  DT: <Monitor size={30} strokeWidth={1.5} />,
  MECHANICS: <Cog size={30} strokeWidth={1.5} />,
  ELECTRONICS: <Cpu size={30} strokeWidth={1.5} />,
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

  const displayedSubjects = subjects.map(subj => {
    const subjectName = subj.subject || subj.name || "Unknown";
    let mappedIcon = SUBJECT_ICONS[subjectName.toUpperCase()] || <BookOpen size={30} strokeWidth={1.5} />;
    
    return {
      heading: subjectName,
      para: subj.description || `${subjectName} Academic Materials (${subj.count || 0} files)`,
      count: subj.count,
      icon: mappedIcon,
    };
  });

  return (
    <div className="choose-subject-wrapper">
      <div className="choose-ambient-light" aria-hidden="true" />

      <div className="choose-subject-container">
        {/* Navigation Breadcrumb */}
        <nav className="choose-breadcrumb" aria-label="Breadcrumb">
          <Link to="/resources" className="breadcrumb-link">RESOURCES</Link>
          <ChevronRight size={14} className="breadcrumb-sep" />
          <span className="breadcrumb-current">{resourceTitle.toUpperCase()}</span>
        </nav>

        {/* Page Header */}
        <header className="choose-header">
          <div className="choose-title-block">
            <h1 className="choose-title">Choose Subject</h1>
            <p className="choose-subtitle">
              Select your academic discipline to access verified unit notes, syllabi, and study resources.
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div className="choose-filters-row">
            {/* Year Selector */}
            <div className="filter-group">
              <span className="filter-group-label">YEAR</span>
              <div className="filter-pills-wrap">
                <button 
                  type="button"
                  className={`filter-pill ${selectedYear === 1 ? 'active' : ''}`} 
                  onClick={() => { setSelectedYear(1); setActiveGroup('electrical'); }}
                >
                  Year 1
                </button>
                <button 
                  type="button"
                  className={`filter-pill ${selectedYear === 2 ? 'active' : ''}`} 
                  onClick={() => { setSelectedYear(2); setActiveGroup('cse'); }}
                >
                  Year 2
                </button>
              </div>
            </div>

            {/* Branch / Group Selector */}
            <div className="filter-group">
              <span className="filter-group-label">
                {selectedYear === 1 ? 'GROUP' : 'BRANCH'}
              </span>
              <div className="filter-pills-wrap">
                {selectedYear === 1 ? (
                  <>
                    <button 
                      type="button"
                      className={`filter-pill ${activeGroup === 'electrical' ? 'active' : ''}`} 
                      onClick={() => setActiveGroup('electrical')}
                    >
                      Electrical
                    </button>
                    <button 
                      type="button"
                      className={`filter-pill ${activeGroup === 'electronics' ? 'active' : ''}`} 
                      onClick={() => setActiveGroup('electronics')}
                    >
                      Electronics
                    </button>
                  </>
                ) : (
                  <>
                    {['cse', 'ds', 'aiml', 'ece', 'elce'].map((branch) => (
                      <button
                        key={branch}
                        type="button"
                        className={`filter-pill ${activeGroup === branch ? 'active' : ''}`}
                        onClick={() => setActiveGroup(branch)}
                      >
                        {branch.toUpperCase()}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Subject Cards Section */}
        {loading ? (
          <div className="subject-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="subject-skeleton-card skeleton-shimmer" />
            ))}
          </div>
        ) : displayedSubjects.length === 0 ? (
          <div className="choose-empty-state glass-clear">
            <div className="empty-icon-bubble">
              <Inbox size={32} />
            </div>
            <h3>No Subjects Available</h3>
            <p>
              No notes uploaded for Year {selectedYear} ({activeGroup.toUpperCase()}) under {resourceTitle}.
              Please select another branch or check back soon.
            </p>
          </div>
        ) : (
          <div className="resource-shelf__grid">
            {displayedSubjects.map((subject, index) => (
              <ResourceCover key={subject.heading} colourIndex={index} title={subject.heading}
                detail={subject.count == null ? subject.para : `${subject.count} file${subject.count === 1 ? '' : 's'}`}
                icon={subject.icon} to="/subject"
                state={{ heading: subject.heading, para: subject.para, year: selectedYear, resourceType, resourceTitle, branch: activeGroup }} />
            ))}
          </div>
        )}

        {/* Notes Contributed By Topper Section (Handwritten Notes Only) */}
        {isHandwritten && (
          <section className="handwritten-credit-glass glass-frosted" aria-label="Contributor Acknowledgement">
            <div className="handwritten-credit-header">
              <h2 className="handwritten-credit-title">Notes Contributed By</h2>
              <p className="handwritten-credit-subtitle">
                Gratitude to academic toppers whose meticulously maintained notes assist hundreds of fellow ABES students.
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
          </section>
        )}
      </div>
    </div>
  );
};

export default ChooseSubject;
