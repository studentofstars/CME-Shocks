import React from 'react';
import './Header.css';

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-content">
        <div className="header-text">
          <h1>Interplanetary Shock Database</h1>
          <p>Explore shock parameters from NASA, CfA, and SHARP spanning 1996‑2023.</p>
        </div>
        <div className="header-image">
          <img
            src={`${import.meta.env.BASE_URL}images/cme_shock.png`}
            alt="Coronal Mass Ejection and interplanetary shock illustration showing the Sun, magnetic field lines, CME, and shock front"
            loading="eager"
          />
          <a
            href="https://researchfeatures.com/wp-content/uploads/2017/10/Dr-Maher-Dayeh-Southwest-Research-Institute-Heliospheric-physics.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="image-credit-btn"
            title="Image credit: Dr. Maher Dayeh / Southwest Research Institute"
            aria-label="Image credit"
          >
            i
          </a>
        </div>
      </div>
    </header>
  );
}
