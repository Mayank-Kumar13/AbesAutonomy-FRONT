// Code-drawn facade keeps the composition available without WebGL or while loading.
export default function CampusFallback() {
  return (
    <svg className="campus-fallback-building" viewBox="0 0 1440 500" fill="none">
      <defs>
        <linearGradient id="campus-wall" x2="0.3" y2="1"><stop stopColor="#dde3e3" /><stop offset="1" stopColor="#7a909c" /></linearGradient>
        <linearGradient id="campus-glass" x2="0" y2="1"><stop stopColor="#567081" /><stop offset="1" stopColor="#162d3d" /></linearGradient>
        <pattern id="campus-windows" width="82" height="66" patternUnits="userSpaceOnUse"><rect x="15" y="14" width="51" height="32" fill="url(#campus-glass)" stroke="#e2e6df" strokeWidth="4" /><path d="M32 16v28m17-28v28M16 26h48" stroke="#b3bfc0" strokeWidth="2" /><path d="M4 0v66" stroke="#d6dedd" strokeWidth="10" /></pattern>
      </defs>
      <path d="M0 450H1440V500H0Z" fill="#899494" />
      {[0, 920].map(x => <g key={x}><path d={`M${x} 122h520v328H${x}Z`} fill="url(#campus-wall)" /><path d={`M${x} 150h520v278H${x}Z`} fill="url(#campus-windows)" /><path d={`M${x} 140h520M${x} 425h520`} stroke="#edf0e9" strokeWidth="12" /></g>)}
      <path d="M585 160h270v290H585Z" fill="#233846" /><path d="M600 160h240v250H600Z" fill="url(#campus-windows)" />
      {[520, 840].map(x => <g key={x}><rect x={x} y="85" width="80" height="365" fill="url(#campus-wall)" /><path d={`M${x} 85a40 32 0 0 1 80 0Z`} fill="#d2dcd9" /><rect x={x+14} y="110" width="52" height="48" rx="24" fill="#243b4b" /><rect x={x+10} y="171" width="60" height="230" fill="url(#campus-windows)" /></g>)}
      <rect x="602" y="84" width="236" height="70" fill="#8e263b" /><text x="720" y="120" textAnchor="middle" fill="#f9f4e7" fontFamily="Georgia,serif" fontSize="38">ABES</text><text x="720" y="142" textAnchor="middle" fill="#f9f4e7" fontFamily="Arial,sans-serif" fontSize="17">Engineering College</text>
      <path d="M588 260Q720 285 852 260M588 330Q720 355 852 330" stroke="#c9d2d0" strokeWidth="15" />
      <path d="M0 453h580m280 0h580" stroke="#315c4e" strokeWidth="22" />
    </svg>
  );
}
