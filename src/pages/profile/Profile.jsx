import { useEffect, useState } from "react";
import "./Profile.css";
import { FiEdit2, FiMail } from "react-icons/fi";
import { useAuth } from "../../auth/AuthContext";

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [student, setStudent] = useState({
    name: "",
    email: "",
    mobile: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setStudent({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setStudent({
      ...student,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateProfile({
        name: student.name,
        mobile: student.mobile,
      });
      setMessage("Profile updated successfully");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="profile-page">Loading...</div>;
  }

  return (
    <div className="profile-page">

      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">
        Manage your personal information and account settings.
      </p>

      <div className="profile-card">

        <div className="profile-header">
          <div className="profile-left">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="avatar" className="avatar" style={{ objectFit: "cover" }} />
            ) : (
              <div className="avatar">
                {student.name
                  ? student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : "?"}
              </div>
            )}

            <div>
              <h2>{student.name}</h2>

              <div className="email-line">
                <FiMail />
                <span>{student.email}</span>
              </div>
            </div>
          </div>
        </div>

        <hr />

        <div className="field">
          <div className="label">
            <h4>Full Name</h4>
          </div>

          <div className="input-box">
            <input
              type="text"
              name="name"
              value={student.name}
              onChange={handleChange}
            />
            <FiEdit2 />
          </div>
        </div>

        <div className="field">
          <div className="label">
            <h4>Email Address</h4>
          </div>

          <div className="input-box">
            <input
              type="email"
              name="email"
              value={student.email}
              disabled
            />
          </div>
        </div>

        <div className="field">
          <div className="label">
            <h4>Mobile Number</h4>
          </div>

          <div className="input-box">
            <input
              type="text"
              name="mobile"
              value={student.mobile}
              onChange={handleChange}
            />
            <FiEdit2 />
          </div>
        </div>

        <div className="field">
          <div className="label">
            <h4>Sign-in Provider</h4>
          </div>
          <p>{user.provider}</p>
        </div>

        <div className="field">
          <div className="label">
            <h4>Account Created</h4>
          </div>
          <p>{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="field">
          <div className="label">
            <h4>Last Login</h4>
          </div>
          <p>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}</p>
        </div>

        <div className="field">
          <div className="label">
            <h4>Login Count</h4>
          </div>
          <p>{user.loginCount}</p>
        </div>

        {message && <p style={{ color: message.includes("success") ? "green" : "red" }}>{message}</p>}

        <div className="buttons">
          <button className="cancel">Cancel</button>
          <button className="save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </div>

    </div>
  );
}