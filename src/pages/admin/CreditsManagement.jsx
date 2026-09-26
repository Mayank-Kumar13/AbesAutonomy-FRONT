import React, { useState, useEffect } from 'react';
import { creditsApi } from '../../services/api';
import Credit_Card from '../../component/credit_card/Credit_Card';
import './AdminPanel.css'; // Reuse AdminPanel styles where applicable

export default function CreditsManagement() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Section Form State
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: '',
    displayOrder: 0,
    isPublished: false,
  });

  // Member Management State
  const [managingSection, setManagingSection] = useState(null); // the section object currently being managed
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  
  // Member Form State
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    role: '',
    description: '',
    year: '',
    github: '',
    linkedin: '',
    instagram: '',
    displayOrder: 0,
    isVisible: true,
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

  const loadMembers = async (sectionId) => {
    setMembersLoading(true);
    try {
      const res = await creditsApi.getMembersBySection(sectionId);
      setMembers(res.data || []);
    } catch (err) {
      alert('Failed to load members.');
    } finally {
      setMembersLoading(false);
    }
  };

  // --- Section Handlers ---

  const handleOpenSectionForm = (section = null) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({
        title: section.title,
        description: section.description,
        displayOrder: section.displayOrder,
        isPublished: section.isPublished,
      });
    } else {
      setEditingSection(null);
      setSectionForm({
        title: '',
        description: '',
        displayOrder: 0,
        isPublished: false,
      });
    }
    setShowSectionForm(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await creditsApi.updateSection(editingSection._id, sectionForm);
      } else {
        await creditsApi.createSection(sectionForm);
      }
      setShowSectionForm(false);
      loadSections();
    } catch (err) {
      alert('Error saving section: ' + err.message);
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section? All its members will also be deleted.')) return;
    try {
      await creditsApi.deleteSection(id);
      loadSections();
      if (managingSection && managingSection._id === id) {
        setManagingSection(null);
      }
    } catch (err) {
      alert('Error deleting section: ' + err.message);
    }
  };

  const handleTogglePublish = async (section) => {
    try {
      await creditsApi.updateSection(section._id, { isPublished: !section.isPublished });
      loadSections();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleManageMembers = (section) => {
    setManagingSection(section);
    loadMembers(section._id);
  };

  // --- Member Handlers ---

  const handleOpenMemberForm = (member = null) => {
    if (member) {
      setEditingMember(member);
      setMemberForm({
        name: member.name,
        role: member.role,
        description: member.description,
        year: member.year,
        github: member.github,
        linkedin: member.linkedin,
        instagram: member.instagram,
        displayOrder: member.displayOrder,
        isVisible: member.isVisible,
      });
    } else {
      setEditingMember(null);
      setMemberForm({
        name: '',
        role: '',
        description: '',
        year: '',
        github: '',
        linkedin: '',
        instagram: '',
        displayOrder: 0,
        isVisible: true,
      });
    }
    setMemberPhoto(null);
    setShowMemberForm(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(memberForm).forEach((key) => {
        formData.append(key, memberForm[key]);
      });
      if (memberPhoto) {
        formData.append('photo', memberPhoto);
      }

      if (editingMember) {
        await creditsApi.updateMember(editingMember._id, formData);
      } else {
        await creditsApi.createMember(managingSection._id, formData);
      }
      setShowMemberForm(false);
      loadMembers(managingSection._id);
    } catch (err) {
      alert('Error saving member: ' + err.message);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await creditsApi.deleteMember(id);
      loadMembers(managingSection._id);
    } catch (err) {
      alert('Error deleting member: ' + err.message);
    }
  };

  const handleToggleVisible = async (member) => {
    try {
      const formData = new FormData();
      formData.append('isVisible', !member.isVisible);
      await creditsApi.updateMember(member._id, formData);
      loadMembers(managingSection._id);
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  if (loading) return <div className="admin-loading">Loading Credits...</div>;

  return (
    <div className="admin-table-wrap">
      <div className="admin-toolbar">
        <h2 className="upload-form-title">Credits Management</h2>
        <button className="upload-submit-btn" style={{ margin: 0, width: 'auto' }} onClick={() => handleOpenSectionForm()}>
          + Create Credit Section
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {/* Sections List */}
      {!managingSection && (
        <div style={{ marginTop: '2rem' }}>
          {sections.length === 0 ? (
            <p style={{ color: '#a0aec0', textAlign: 'center', padding: '2rem' }}>No credit sections found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {sections.map(section => (
                <div key={section._id} className="admin-card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#c89b63', fontFamily: '"Times New Roman", Georgia, serif', fontSize: '1.4rem' }}>{section.title}</h3>
                    <span className={`badge ${section.isPublished ? 'live-badge' : 'admin-badge'}`}>
                      {section.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 1rem 0', color: '#a0aec0', fontSize: '0.9rem', flex: 1 }}>{section.description || 'No description provided.'}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2d3748' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Order: {section.displayOrder}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="upload-reset-btn" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleManageMembers(section)}>Members</button>
                      <button className="upload-reset-btn" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleOpenSectionForm(section)}>Edit</button>
                      <button className="upload-reset-btn" style={{ padding: '0.4rem 0.8rem', color: section.isPublished ? '#f87171' : '#4ade80', borderColor: section.isPublished ? '#f87171' : '#4ade80' }} onClick={() => handleTogglePublish(section)}>
                        {section.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button className="delete-note-btn" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleDeleteSection(section._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Member Management View */}
      {managingSection && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#121418', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #2d3748' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="upload-reset-btn" onClick={() => setManagingSection(null)}>← Back</button>
              <h3 style={{ margin: 0, color: '#c89b63', fontFamily: '"Times New Roman", Georgia, serif' }}>{managingSection.title} <span style={{ color: '#a0aec0', fontSize: '1rem' }}>- Members</span></h3>
            </div>
            <button className="upload-submit-btn" style={{ margin: 0, width: 'auto' }} onClick={() => handleOpenMemberForm()}>
              + Add Member
            </button>
          </div>

          {membersLoading ? (
            <p style={{ color: '#a0aec0', textAlign: 'center', padding: '2rem' }}>Loading members...</p>
          ) : members.length === 0 ? (
            <p style={{ color: '#a0aec0', textAlign: 'center', padding: '2rem' }}>No members added yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {members.map(member => (
                <div key={member._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Credit_Card
                      name={member.name}
                      year={member.year}
                      description={member.description}
                      image={member.photoUrl || '/avatar-placeholder.png'}
                      github={member.github}
                      linkedin={member.linkedin}
                      instagram={member.instagram}
                      role={member.role}
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                      <span className={`badge ${member.isVisible ? 'live-badge' : 'admin-badge'}`} style={{ backdropFilter: 'blur(5px)' }}>
                        {member.isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="admin-card" style={{ width: '100%', maxWidth: '300px', display: 'flex', gap: '0.5rem', padding: '0.75rem', marginTop: '-20px', zIndex: 10, background: '#121418', border: '1px solid #2d3748' }}>
                    <button className="upload-reset-btn" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', flex: 1 }} onClick={() => handleOpenMemberForm(member)}>Edit</button>
                    <button className="upload-reset-btn" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', flex: 1 }} onClick={() => handleToggleVisible(member)}>
                      {member.isVisible ? 'Hide' : 'Show'}
                    </button>
                    <button className="delete-note-btn" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', flex: 1 }} onClick={() => handleDeleteMember(member._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section Form Modal */}
      {showSectionForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editingSection ? 'Edit Section' : 'Create Section'}</h3>
              <button className="close-btn" onClick={() => setShowSectionForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveSection} className="admin-form">
              <div className="form-group">
                <label>Title *</label>
                <input type="text" required value={sectionForm.title} onChange={e => setSectionForm({...sectionForm, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={sectionForm.description} onChange={e => setSectionForm({...sectionForm, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Display Order</label>
                <input type="number" value={sectionForm.displayOrder} onChange={e => setSectionForm({...sectionForm, displayOrder: parseInt(e.target.value) || 0})} />
              </div>
              <div className="form-group checkbox-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <label>
                  <input type="checkbox" checked={sectionForm.isPublished} onChange={e => setSectionForm({...sectionForm, isPublished: e.target.checked})} />
                  Published to public page
                </label>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setShowSectionForm(false)}>Cancel</button>
                <button type="submit" className="admin-btn-primary">Save Section</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Form Modal */}
      {showMemberForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '700px' }}>
            <div className="admin-modal-header">
              <h3>{editingMember ? 'Edit Member' : 'Add Member'}</h3>
              <button className="close-btn" onClick={() => setShowMemberForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveMember} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" required value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input type="text" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={memberForm.description} onChange={e => setMemberForm({...memberForm, description: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Year</label>
                  <input type="text" value={memberForm.year} onChange={e => setMemberForm({...memberForm, year: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input type="number" value={memberForm.displayOrder} onChange={e => setMemberForm({...memberForm, displayOrder: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>GitHub URL</label>
                  <input type="url" value={memberForm.github} onChange={e => setMemberForm({...memberForm, github: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input type="url" value={memberForm.linkedin} onChange={e => setMemberForm({...memberForm, linkedin: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Instagram URL</label>
                  <input type="url" value={memberForm.instagram} onChange={e => setMemberForm({...memberForm, instagram: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Profile Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  {editingMember?.photoUrl && !memberPhoto && (
                    <img src={editingMember.photoUrl} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2d3748' }} />
                  )}
                  {memberPhoto && (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#2d3748', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c89b63', fontSize: '0.8rem', textAlign: 'center' }}>New</div>
                  )}
                  <input type="file" accept="image/*" onChange={e => setMemberPhoto(e.target.files[0])} style={{ background: 'transparent', border: 'none', padding: 0 }} />
                </div>
              </div>
              <div className="form-group checkbox-group" style={{ flexDirection: 'row', alignItems: 'center', marginTop: '1rem' }}>
                <label>
                  <input type="checkbox" checked={memberForm.isVisible} onChange={e => setMemberForm({...memberForm, isVisible: e.target.checked})} />
                  Visible on public page
                </label>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setShowMemberForm(false)}>Cancel</button>
                <button type="submit" className="admin-btn-primary">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
