import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginPage.css';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { authApi } from '../../auth/authApi';

function App() {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [otpStep, setOtpStep] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState('signup');
  const [otpUserId, setOtpUserId] = useState(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login, register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data =
        activeTab === 'login'
          ? await login(formData.email, formData.password)
          : await register(formData.name, formData.email, formData.password);

      setOtpUserId(data.userId);
      setOtpEmail(data.email);
      setOtpPurpose(data.purpose || (activeTab === 'login' ? 'login' : 'signup'));
      setOtpValue('');
      setOtpStep(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpValue(val);
    if (error) setError('');
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await verifyOtp(otpUserId, otpValue, otpPurpose);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
      setOtpValue('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await resendOtp(otpUserId, otpPurpose);
      setOtpValue('');
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBackToSignup = () => {
    setOtpStep(false);
    setOtpValue('');
    setError('');
  };

  const handleGoogleLogin = () => {
    try {
      window.location.href = authApi.googleLoginUrl();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGithubLogin = () => {
    try {
      window.location.href = authApi.githubLoginUrl();
    } catch (err) {
      setError(err.message);
    }
  };

  if (otpStep) {
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-content">

            <h2 className="modal-title">VERIFY YOUR<br />IDENTITY</h2>

            <p style={{ textAlign: 'center', fontSize: '0.9rem', marginBottom: '1rem', color: '#e2e8f0' }}>
              We sent a 6-digit code to <strong>{otpEmail}</strong>
            </p>

            <form className="auth-form" onSubmit={handleOtpSubmit}>
              <div className="input-group">
                <label>OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="otp"
                  value={otpValue}
                  onChange={handleOtpChange}
                  placeholder="123456"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

              <button type="submit" className="submit-btn" disabled={isLoading || otpValue.length !== 6}>
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Verifying...
                  </div>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </form>

            <div className="modal-footer">
              <p className="create-account">
                Didn't get the code?{' '}
                <span
                  onClick={handleResendOtp}
                  style={{ cursor: resendCooldown > 0 ? 'default' : 'pointer', opacity: resendCooldown > 0 ? 0.6 : 1 }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : '[Resend OTP]'}
                </span>
              </p>
              <p className="create-account">
                <span onClick={handleBackToSignup}>[Back]</span>
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content">
          
          <h2 className="modal-title">THE SCHOLAR'S<br />GATEWAY</h2>

          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              LOG IN
            </button>
            <button
              className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              SIGN UP
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {activeTab === 'signup' && (
              <div className="input-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Processing...
                </div>
              ) : (
                activeTab === 'login' ? 'Log In' : 'Sign Up'
              )}
            </button>
          </form>

          <div className="divider">or</div>
          
          <button type="button" className="google-btn" onClick={handleGoogleLogin}>
            <svg className="google-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Continue with Google
          </button>

          <button type="button" className="google-btn" onClick={handleGithubLogin} style={{ marginTop: '10px' }}>
            <svg className="google-icon" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.06-.02-2.08-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.08 1.84 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.02 2.89-.02 3.29 0 .32.22.7.83.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>

          {activeTab === 'login' && (
            <div className="modal-footer">
              <a href="/forgot-password" className="forgot-link">Forgot Password?</a>
              <p className="create-account">
                Don't have an account? <span onClick={() => setActiveTab('signup')}>[Create One]</span>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;