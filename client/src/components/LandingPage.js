import React, { useState } from "react";
import AuthModal from "./AuthModal";
import "./LandingPage.css";

const LandingPage = ({ onAuthSuccess }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'register'

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Learn Programming with
              <span className="highlight"> AI Personas</span>
            </h1>
            <p className="hero-description">
              Chat with Hitesh Choudhary and Piyush Garg's AI personas. Get
              personalized programming guidance with their unique teaching
              styles - from Hitesh's warm chai-powered explanations to Piyush's
              practical industry insights.
            </p>
            <div className="hero-buttons">
              <button
                className="cta-button primary"
                onClick={() => openAuthModal("register")}
              >
                Start Learning Free
              </button>
              <button
                className="cta-button secondary"
                onClick={() => openAuthModal("login")}
              >
                Sign In
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="persona-cards">
              <div className="persona-card hitesh">
                <div className="persona-avatar">
                  <span>HC</span>
                </div>
                <h3>Hitesh Choudhary</h3>
                <p>Warm, encouraging teacher</p>
                <div className="persona-features">
                  <span>🫖 Chai-powered coding</span>
                  <span>💝 Hindi/Hinglish support</span>
                  <span>🎯 Beginner-friendly</span>
                </div>
              </div>
              <div className="persona-card piyush">
                <div className="persona-avatar">
                  <span>PG</span>
                </div>
                <h3>Piyush Garg</h3>
                <p>Industry-focused educator</p>
                <div className="persona-features">
                  <span>🚀 Real-world projects</span>
                  <span>💼 Industry insights</span>
                  <span>⚡ Fast-paced learning</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={onAuthSuccess}
        initialMode={authMode}
      />
    </div>
  );
};

export default LandingPage;
