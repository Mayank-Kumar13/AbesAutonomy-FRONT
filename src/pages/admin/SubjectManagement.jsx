import React, { useState, useEffect } from 'react';
import { subjectsApi } from '../../services/api';
import './AdminPanel.css';
import { Edit2, Trash2, Plus, X, Check } from 'lucide-react';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    year: 1,
    group: 'common',
    icon: 'BookOpen',
    displayOrder: 0,
    isActive: true
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await subjectsApi.getAllSubjects();
      if (res.data) {
        setSubjects(res.data);
      }
    } catch (err) {
      setError('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (name === 'year' || name === 'displayOrder' ? Number(value) : value)
    });
  };

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      description: '',
      year: 1,
      group: 'common',
      icon: 'BookOpen',
      displayOrder: 0,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
      year: subject.year,
      group: subject.group,
      icon: subject.icon || 'BookOpen',
      displayOrder: subject.displayOrder,
      isActive: subject.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await subjectsApi.updateSubject(editingSubject._id, formData);
      } else {
        await subjectsApi.createSubject(formData);
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      alert('Failed to save subject. ' + (err.message || ''));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectsApi.deleteSubject(id);
        fetchSubjects();
      } catch (err) {
        alert('Failed to delete subject.');
      }
    }
  };

  const toggleStatus = async (subject) => {
    try {
      await subjectsApi.updateSubject(subject._id, { isActive: !subject.isActive });
      fetchSubjects();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  if (loading && subjects.length === 0) return <div className="admin-loading">Loading subjects...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-section subjects-management">
      <div className="admin-section-header">
        <h2>Subject Management</h2>
        <button className="admin-btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add Subject
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Year</th>
              <th>Group</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-empty-state">No subjects found.</td>
              </tr>
            ) : (
              subjects.map(subject => (
                <tr key={subject._id}>
                  <td>
                    <div className="subject-name-cell">
                      <strong>{subject.name}</strong>
                      <span className="subject-desc-small">{subject.description?.substring(0, 30)}</span>
                    </div>
                  </td>
                  <td>Year {subject.year}</td>
                  <td><span className={`badge group-${subject.group}`}>{subject.group}</span></td>
                  <td>{subject.displayOrder}</td>
                  <td>
                    <button 
                      className={`status-toggle ${subject.isActive ? 'active' : 'inactive'}`}
                      onClick={() => toggleStatus(subject)}
                    >
                      {subject.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="action-btn edit" onClick={() => openEditModal(subject)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(subject._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editingSubject ? 'Edit Subject' : 'Add Subject'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Subject Name*</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="e.g. Data Structures and Algorithms"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  placeholder="Short description of the subject..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Year*</label>
                  <select name="year" value={formData.year} onChange={handleInputChange} required>
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Group*</label>
                  <select name="group" value={formData.group} onChange={handleInputChange} required>
                    <option value="common">Common</option>
                    <option value="electrical">Electrical</option>
                    <option value="electronics">Electronics</option>
                    <option value="cs">Computer Science</option>
                    <option value="it">Information Technology</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Display Order</label>
                  <input 
                    type="number" 
                    name="displayOrder" 
                    value={formData.displayOrder} 
                    onChange={handleInputChange} 
                    min="0"
                  />
                </div>
                
                <div className="form-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox" 
                      name="isActive" 
                      checked={formData.isActive} 
                      onChange={handleInputChange} 
                    />
                    Active (Visible to students)
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingSubject ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
