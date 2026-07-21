import React from 'react';

const TAB_INFO = {
  documentation: {
    title: 'Documentation',
    message: 'Comprehensive documentation for the Interplanetary Shock Database will be available here.',
  },
  publication: {
    title: 'Publication',
    message: 'Published research papers and references related to this database will be listed here.',
  },
  contact: {
    title: 'Contact',
    message: 'Contact information and feedback channels will be provided here.',
  },
};

export default function PlaceholderTab({ tabId }) {
  const info = TAB_INFO[tabId] || { title: 'Coming Soon', message: 'This section is under development.' };

  return (
    <div className="placeholder-tab">
      <div className="placeholder-content">
        <h2 className="placeholder-title">{info.title}</h2>
        <p className="placeholder-message">{info.message}</p>
        <span className="placeholder-badge">To be updated later</span>
      </div>
    </div>
  );
}
