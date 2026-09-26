import React, { useState, useEffect } from 'react';
import { creditsApi } from '../../services/api';
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
            <p style={{ color: '#a0aec0' }}>No credit sections found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sections.map(section => (
                <div key={section._id} style={{ background: '#0b0d10', padding: '1.5rem', borderRadius: '12px', border: '1px solid #2d3748' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#e2e8f0' }}>{section.title}</h3>
                      <p style={{ margin: '0 0 1rem 0', color: '#a0aec0', fontSize: '0.9rem' }}>{section.description}</p>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: '#94a3b8' }}>Order: {section.displayOrder}</span>
                        <span style={{ color: section.isPublished ? '#4ade80' : '#f87171' }}>
                          {section.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="upload-submit-btn" style={{ padding: '0.4rem 0.8rem', width: 'auto' }} onClick={() => handleManageMembers(section)}>Manage Members</button>
                      <button className="admin-action-btn edit" onClick={() => handleOpenSectionForm(section)}>Edit</button>
                      <button className="admin-action-btn" style={{ color: '#a0aec0' }} onClick={() => handleTogglePublish(section)}>
                        {section.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button className="admin-action-btn delete" onClick={() => handleDeleteSection(section._id)}>Delete</button>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="admin-action-btn" onClick={() => setManagingSection(null)}>← Back to Sections</button>
              <h3 style={{ margin: 0, color: '#e2e8f0' }}>{managingSection.title} - Members</h3>
            </div>
            <button className="upload-submit-btn" style={{ margin: 0, width: 'auto' }} onClick={() => handleOpenMemberForm()}>
              + Add Member
            </button>
          </div>

          {membersLoading ? (
            <p style={{ color: '#a0aec0' }}>Loading members...</p>
          ) : members.length === 0 ? (
            <p style={{ color: '#a0aec0' }}>No members added yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {members.map(member => (
                <div key={member._id} style={{ background: '#0b0d10', padding: '1rem', borderRadius: '12px', border: '1px solid #2d3748', display: 'flex', gap: '1rem' }}>
                  <img src={member.photoUrl || '/avatar-placeholder.png'} alt={member.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#e2e8f0' }}>{member.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: member.isVisible ? '#4ade80' : '#f87171' }}>
                        {member.isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 0.25rem 0', color: '#a78bfa', fontSize: '0.85rem', fontWeight: 600 }}>{member.role}</p>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem' }}>Year: {member.year}</p>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button className="admin-action-btn edit" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleOpenMemberForm(member)}>Edit</button>
                      <button className="admin-action-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: '#a0aec0' }} onClick={() => handleToggleVisible(member)}>
                        {member.isVisible ? 'Hide' : 'Show'}
                      </button>
                      <button className="admin-action-btn delete" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDeleteMember(member._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section Form Modal */}
      {showSectionForm && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="upload-form-container" style={{ width: '100%', maxWidth: '500px', margin: 0, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="upload-form-title" style={{ margin: 0 }}>{editingSection ? 'Edit Section' : 'Create Section'}</h2>
              <button className="admin-action-btn delete" onClick={() => setShowSectionForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveSection}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" required value={sectionForm.title} onChange={e => setSectionForm({...sectionForm, title: e.target.value})} className="upload-input" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={sectionForm.description} onChange={e => setSectionForm({...sectionForm, description: e.target.value})} className="upload-input" style={{ minHeight: '80px' }} />
              </div>
              <div className="form-group">
                <label>Display Order</label>
                <input type="number" value={sectionForm.displayOrder} onChange={e => setSectionForm({...sectionForm, displayOrder: parseInt(e.target.value) || 0})} className="upload-input" />
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={sectionForm.isPublished} onChange={e => setSectionForm({...sectionForm, isPublished: e.target.checked})} id="isPublished" />
                <label htmlFor="isPublished" style={{ margin: 0 }}>Published</label>
              </div>
              <button type="submit" className="upload-submit-btn">Save Section</button>
            </form>
          </div>
        </div>
      )}

      {/* Member Form Modal */}
      {showMemberForm && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 0' }}>
          <div className="upload-form-container" style={{ width: '100%', maxWidth: '600px', margin: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="upload-form-title" style={{ margin: 0 }}>{editingMember ? 'Edit Member' : 'Add Member'}</h2>
              <button className="admin-action-btn delete" onClick={() => setShowMemberForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveMember}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" required value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} className="upload-input" />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input type="text" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} className="upload-input" />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={memberForm.description} onChange={e => setMemberForm({...memberForm, description: e.target.value})} className="upload-input" style={{ minHeight: '80px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Year</label>
                  <input type="text" value={memberForm.year} onChange={e => setMemberForm({...memberForm, year: e.target.value})} className="upload-input" />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input type="number" value={memberForm.displayOrder} onChange={e => setMemberForm({...memberForm, displayOrder: parseInt(e.target.value) || 0})} className="upload-input" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>GitHub URL</label>
                  <input type="url" value={memberForm.github} onChange={e => setMemberForm({...memberForm, github: e.target.value})} className="upload-input" />
                </div>
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input type="url" value={memberForm.linkedin} onChange={e => setMemberForm({...memberForm, linkedin: e.target.value})} className="upload-input" />
                </div>
                <div className="form-group">
                  <label>Instagram URL</label>
                  <input type="url" value={memberForm.instagram} onChange={e => setMemberForm({...memberForm, instagram: e.target.value})} className="upload-input" />
                </div>
              </div>
              <div className="form-group">
                <label>Profile Photo</label>
                <input type="file" accept="image/*" onChange={e => setMemberPhoto(e.target.files[0])} className="upload-input" style={{ padding: '0.5rem' }} />
                {editingMember?.photoUrl && !memberPhoto && (
                  <img src={editingMember.photoUrl} alt="Preview" style={{ width: '60px', height: '60px', marginTop: '0.5rem', borderRadius: '8px', objectFit: 'cover' }} />
                )}
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={memberForm.isVisible} onChange={e => setMemberForm({...memberForm, isVisible: e.target.checked})} id="isVisible" />
                <label htmlFor="isVisible" style={{ margin: 0 }}>Visible</label>
              </div>
              <button type="submit" className="upload-submit-btn" style={{ marginTop: '1rem' }}>Save Member</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
