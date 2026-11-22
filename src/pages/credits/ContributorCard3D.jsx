import React from 'react';
import { FaGithub, FaLinkedinIn, FaInstagram } from 'react-icons/fa';
import { Sparkles } from 'lucide-react';
import './ContributorCard3D.css';

export default function ContributorCard3D({
  member,
  isActive = false,
  cardRef,
  onPointerMove,
  onPointerLeave,
}) {
  if (!member) return null;

  const {
    name,
    role,
    description,
    photoUrl,
    year,
    github,
    linkedin,
    instagram,
  } = member;

  const fallbackAvatar = '/avatar-placeholder.png';

  return (
    <article
      ref={cardRef}
      className={`card3d-root glass-frosted ${isActive ? 'is-active' : ''}`}
      onMouseMove={onPointerMove}
      onMouseLeave={onPointerLeave}
      aria-label={`${name} — ${role}`}
    >
      {/* Specular Edge Bevel (Top Light Catch) */}
      <div className="card3d-specular-top" aria-hidden="true" />

      {/* ─── PORTRAIT SECTION (65-70% height) ─── */}
      <div className="card3d-portrait-stage">
        <img
          src={photoUrl || fallbackAvatar}
          alt={name}
          className="card3d-portrait-img"
          loading="eager"
          decoding="async"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = fallbackAvatar;
          }}
        />

        {/* Ambient Vignette & Gradient Occlusion */}
        <div className="card3d-portrait-gradient" aria-hidden="true" />

        {/* Year/Badge Pill Top Left */}
        {year && (
          <div className="card3d-badge-year">
            <span>{year} Year</span>
          </div>
        )}

        {/* Subtle Brand Watermark Crest */}
        <div className="card3d-crest-watermark" aria-hidden="true">
          <Sparkles size={14} className="crest-icon" />
          <span>ABES</span>
        </div>
      </div>

      {/* ─── INFORMATION PANEL (30-35% height) ─── */}
      <div className="card3d-info-panel">
        {/* Role Tag */}
        <div className="card3d-role-row">
          <span className="card3d-role-tag">{role || 'Contributor'}</span>
        </div>

        {/* Contributor Name */}
        <h2 className="card3d-name">{name}</h2>

        {/* Contribution / Description */}
        {description && (
          <p className="card3d-description">{description}</p>
        )}

        {/* Social Links Row */}
        <div className="card3d-socials-row">
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="card3d-social-btn"
              aria-label={`${name}'s GitHub Profile`}
              title="GitHub"
            >
              <FaGithub size={15} />
            </a>
          )}
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="card3d-social-btn"
              aria-label={`${name}'s LinkedIn Profile`}
              title="LinkedIn"
            >
              <FaLinkedinIn size={14} />
            </a>
          )}
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="card3d-social-btn"
              aria-label={`${name}'s Instagram Profile`}
              title="Instagram"
            >
              <FaInstagram size={15} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
