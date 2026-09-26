import React, { useState, useEffect, useRef } from 'react';
import { creditsApi } from '../../services/api';
import './AdminPanel.css'; // Reuse AdminPanel styles where applicable

export default function CreditsManagement() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editor State
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [sectionData, setSectionData] = useState(null);
  const [members, setMembers] = useState([]);
  
  // Inline Member Edit State
  const [editingMemberId, setEditingMemberId] = useState(null); // 'new' for new member, or ID for existing
  const [memberForm, setMemberForm] = useState({
    name: '',
    role: '',
    description: '',
    year: '',
    github: '',
    linkedin: '',
    instagram: '',
    isVisible: true
  });
  const [memberPhoto, setMemberPhoto] = useState(null);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setLoading(true);
    try {
      const res = await creditsApi.getAllSections();
      setSections(res.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load credit sections.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewSection = async () => {
    try {
      // Create a draft section immediately to get an ID for members
      const res = await creditsApi.createSection({
        title: 'New Section',
        description: '',
        displayOrder: sections.length + 1,
        isPublished: false
      });
      loadSections();
      openSectionEditor(res.data);
    } catch (err) {
      alert('Error creating section: ' + err.message);
    }
  };

  const openSectionEditor = async (section) => {
    setActiveSectionId(section._id);
    setSectionData({ ...section });
    
    // Load members
    try {
      const res = await creditsApi.getMembersBySection(section._id);
      setMembers(res.data || []);
    } catch (err) {
      alert('Failed to load members.');
    }
  };

  const closeSectionEditor = () => {
    setActiveSectionId(null);
    setSectionData(null);
    setMembers([]);
    setEditingMemberId(null);
    loadSections();
  };

  const handleSaveSection = async () => {
    try {
      await creditsApi.updateSection(activeSectionId, {
        title: sectionData.title,
        description: sectionData.description,
        isPublished: true // Publish it
      });
      closeSectionEditor();
    } catch (err) {
      alert('Error saving section: ' + err.message);
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      await creditsApi.deleteSection(id);
      loadSections();
    } catch (err) {
      alert('Error deleting section: ' + err.message);
    }
  };

  // --- Member Handlers ---

  const handleStartAddMember = () => {
    setEditingMemberId('new');
    setMemberForm({
      name: '',
      role: '',
      description: '',
      year: '',
      github: '',
      linkedin: '',
      instagram: '',
      isVisible: true
    });
    setMemberPhoto(null);
  };

  const handleStartEditMember = (member) => {
    setEditingMemberId(member._id);
    setMemberForm({
      name: member.name,
      role: member.role,
      description: member.description,
      year: member.year,
      github: member.github,
      linkedin: member.linkedin,
      instagram: member.instagram,
      isVisible: member.isVisible
    });
    setMemberPhoto(null);
  };

  const handleSaveMember = async () => {
    if (!memberForm.name) {
      alert("Name is required");
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(memberForm).forEach((key) => {
        formData.append(key, memberForm[key]);
      });
      if (memberPhoto) {
        formData.append('photo', memberPhoto);
      }

      if (editingMemberId === 'new') {
        await creditsApi.createMember(activeSectionId, formData);
      } else {
        await creditsApi.updateMember(editingMemberId, formData);
      }
      
      setEditingMemberId(null);
      // Reload members
      const res = await creditsApi.getMembersBySection(activeSectionId);
      setMembers(res.data || []);
    } catch (err) {
      alert('Error saving member: ' + err.message);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await creditsApi.deleteMember(id);
      const res = await creditsApi.getMembersBySection(activeSectionId);
      setMembers(res.data || []);
    } catch (err) {
      alert('Error deleting member: ' + err.message);
    }
  };

  if (loading) return <div className="admin-loading">Loading Credits...</div>;

  return (
    <div className="admin-table-wrap" style={{ padding: '2rem', background: '#0b0d10' }}>
      
      {!activeSectionId ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: '"Times New Roman", Georgia, serif', color: '#e2e8f0', margin: 0, fontSize: '1.8rem' }}>Credits Management</h2>
            <button className="upload-submit-btn" style={{ width: 'auto' }} onClick={handleCreateNewSection}>
              + Create Credit Section
            </button>
          </div>

          {error && <p className="admin-error">{error}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sections.length === 0 ? (
              <p style={{ color: '#a0aec0', textAlign: 'center', padding: '3rem' }}>No credit sections found.</p>
            ) : (
              sections.map(section => (
                <div key={section._id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: '#121418', border: '1px solid #2d3748', borderRadius: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#c89b63', fontSize: '1.4rem', fontFamily: '"Times New Roman", Georgia, serif' }}>{section.title}</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span className={`badge ${section.isPublished ? 'live-badge' : 'admin-badge'}`}>
                        {section.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span style={{ color: '#718096', fontSize: '0.9rem' }}>{section.description || 'No description'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="upload-reset-btn" onClick={() => openSectionEditor(section)}>Edit Section</button>
                    <button className="delete-note-btn" onClick={() => handleDeleteSection(section._id)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* --- SECTION EDITOR MATCHING THE USER'S SKETCH --- */
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <button className="upload-reset-btn" style={{ marginBottom: '1.5rem', border: 'none', padding: 0 }} onClick={closeSectionEditor}>
            ← Back to all sections
          </button>

          <div style={{ background: '#121418', border: '1px solid #2d3748', borderRadius: '12px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            
            {/* Section Title & Description */}
            <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid #2d3748', paddingBottom: '2rem' }}>
              <input 
                type="text" 
                value={sectionData.title}
                onChange={e => setSectionData({...sectionData, title: e.target.value})}
                placeholder="Section Title (e.g. Backend Team)"
                style={{ background: 'transparent', border: 'none', borderBottom: '2px solid #2d3748', color: '#c89b63', fontSize: '2rem', fontFamily: '"Times New Roman", Georgia, serif', outline: 'none', padding: '0.5rem 0', width: '100%' }}
              />
              <input 
                type="text" 
                value={sectionData.description}
                onChange={e => setSectionData({...sectionData, description: e.target.value})}
                placeholder="Optional description for this section..."
                style={{ background: 'transparent', border: 'none', color: '#a0aec0', fontSize: '1rem', outline: 'none', padding: '0.5rem 0', width: '100%' }}
              />
            </div>

            <h3 style={{ color: '#e2e8f0', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Members</h3>

            {/* Members List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {members.map(member => (
                <React.Fragment key={member._id}>
                  {editingMemberId === member._id ? (
                    /* Inline Edit Form for existing member */
                    <MemberInlineForm 
                      memberForm={memberForm} 
                      setMemberForm={setMemberForm}
                      memberPhoto={memberPhoto}
                      setMemberPhoto={setMemberPhoto}
                      onSave={handleSaveMember}
                      onCancel={() => setEditingMemberId(null)}
                      existingPhotoUrl={member.photoUrl}
                    />
                  ) : (
                    /* Display Row */
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem', background: '#0b0d10', borderRadius: '8px', border: '1px solid #2d3748' }}>
                      <img src={member.photoUrl || '/avatar-placeholder.png'} alt={member.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1a202c' }} />
                      
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.5fr 2.5fr 1fr', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '1.1rem' }}>{member.name}</div>
                          <div style={{ color: '#c89b63', fontSize: '0.85rem' }}>{member.role || 'Member'}</div>
                        </div>
                        <div style={{ color: '#a0aec0', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.description || 'No description'}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                          {member.year}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="upload-reset-btn" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleStartEditMember(member)}>Edit</button>
                        <button className="delete-note-btn" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleDeleteMember(member._id)}>Delete</button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* Inline Edit Form for new member */}
              {editingMemberId === 'new' && (
                <MemberInlineForm 
                  memberForm={memberForm} 
                  setMemberForm={setMemberForm}
                  memberPhoto={memberPhoto}
                  setMemberPhoto={setMemberPhoto}
                  onSave={handleSaveMember}
                  onCancel={() => setEditingMemberId(null)}
                />
              )}
            </div>

            {/* Add Member Button */}
            {editingMemberId !== 'new' && (
              <button 
                onClick={handleStartAddMember}
                style={{ width: '100%', padding: '1rem', background: 'transparent', border: '2px dashed #2d3748', borderRadius: '8px', color: '#a0aec0', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s', marginBottom: '3rem' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#c89b63'; e.currentTarget.style.color = '#c89b63'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#2d3748'; e.currentTarget.style.color = '#a0aec0'; }}
              >
                + Add Member
              </button>
            )}

            {/* Save / Publish Button */}
            <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #2d3748', paddingTop: '2rem' }}>
              <button 
                onClick={handleSaveSection}
                className="upload-submit-btn" 
                style={{ width: '100%', maxWidth: '300px', fontSize: '1.1rem', padding: '0.8rem' }}
              >
                Save / Publish Section
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Inline Form Component to keep the file clean
function MemberInlineForm({ memberForm, setMemberForm, memberPhoto, setMemberPhoto, onSave, onCancel, existingPhotoUrl }) {
  return (
    <div style={{ padding: '1.5rem', background: '#1a202c', borderRadius: '8px', border: '1px solid #c89b63', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Photo Upload Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100px' }}>
          {memberPhoto ? (
             <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#2d3748', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '0.8rem' }}>Selected</div>
          ) : existingPhotoUrl ? (
             <img src={existingPhotoUrl} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
             <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#2d3748', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', fontSize: '0.8rem' }}>No Photo</div>
          )}
          <label style={{ color: '#c89b63', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'center' }}>
            Choose File
            <input type="file" accept="image/*" onChange={e => setMemberPhoto(e.target.files[0])} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Form Fields */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <input type="text" placeholder="Name *" required value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Role (e.g. Developer)" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Year (e.g. 2nd Year)" value={memberForm.year} onChange={e => setMemberForm({...memberForm, year: e.target.value})} style={inputStyle} />
          <input type="url" placeholder="GitHub URL" value={memberForm.github} onChange={e => setMemberForm({...memberForm, github: e.target.value})} style={inputStyle} />
          <input type="url" placeholder="LinkedIn URL" value={memberForm.linkedin} onChange={e => setMemberForm({...memberForm, linkedin: e.target.value})} style={inputStyle} />
          <input type="url" placeholder="Instagram URL" value={memberForm.instagram} onChange={e => setMemberForm({...memberForm, instagram: e.target.value})} style={inputStyle} />
          <textarea placeholder="Description" value={memberForm.description} onChange={e => setMemberForm({...memberForm, description: e.target.value})} style={{ ...inputStyle, gridColumn: 'span 2', minHeight: '60px' }} />
        </div>

      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #2d3748', paddingTop: '1rem' }}>
        <button onClick={onCancel} className="upload-reset-btn" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
        <button onClick={onSave} className="upload-submit-btn" style={{ padding: '0.5rem 1.5rem', width: 'auto' }}>Save Member</button>
      </div>
    </div>
  );
}

const inputStyle = {
  background: '#0b0d10',
  border: '1px solid #2d3748',
  borderRadius: '6px',
  padding: '0.75rem',
  color: '#e2e8f0',
  outline: 'none',
  fontSize: '0.9rem',
  fontFamily: 'inherit'
};
