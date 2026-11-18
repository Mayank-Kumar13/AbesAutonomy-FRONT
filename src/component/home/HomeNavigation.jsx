import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import logo from '../../../IMAGES/ABES_LOGO.svg';

const links = [ ['/', 'Home'], ['/resources', 'Resources'], ['/premium', 'Premium'], ['/mvp-projects', 'MVP Projects'], ['/credits', 'Credits'] ];

export default function HomeNavigation({ onSkipNotes }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const accountRef = useRef(null);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'keydown' || !accountRef.current?.contains(event.target)) {
        if (accountRef.current) accountRef.current.open = false;
      }
      if (event.type === 'keydown') {
        setOpen(false);
        if (open) toggleRef.current?.focus();
      } else if (!menuRef.current?.contains(event.target) && !toggleRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', close);
    };
  }, [open]);

  return (
    <header className="home-header">
      <a className="home-skip" href="#all-notes" onClick={onSkipNotes}>Skip to notes</a>
      <Link className="home-brand" to="/" aria-label="ABES Autonomy home"><img src={logo} alt="" width="34" height="42" /><span>ABES<span>AUTONOMY</span></span></Link>
      <button ref={toggleRef} className="home-menu-toggle" aria-expanded={open} aria-controls="home-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      <nav id="home-navigation" aria-label="Main navigation" ref={menuRef} className={`home-navigation${open ? ' is-open' : ''}`}>
        {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>)}
        {isAuthenticated ? (
          <details className="home-account" ref={accountRef}>
            <summary>{user?.name?.split(' ')[0] || 'Account'}<ChevronDown size={14} /></summary>
            <div className="home-account-menu">
              <Link to="/profile">My profile</Link>
              {(user?.role === 'admin' || user?.role === 'coordinator') && <Link to="/admin">Admin panel</Link>}
              <button onClick={async () => { await logout(); setOpen(false); navigate('/'); }}>Log out</button>
            </div>
          </details>
        ) : <Link className="home-signin" to="/login">Sign in <ArrowUpRight size={15} /></Link>}
      </nav>
    </header>
  );
}
