import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { ToastProvider, ConfirmProvider } from './components/Feedback.jsx';
import './index.css';

// MotionConfig reducedMotion="user": animations switch off for people whose device asks for reduced motion.
ReactDOM.createRoot(document.getElementById('root')).render(
  <MotionConfig reducedMotion="user">
    <AppProvider><ToastProvider><ConfirmProvider><App /></ConfirmProvider></ToastProvider></AppProvider>
  </MotionConfig>
);
