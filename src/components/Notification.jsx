// components/Notification.jsx
import React from 'react';
import './Notification.css';

export const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <div className={`notification notification-${type}`}>
      <span className="notification-message">{message}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
};