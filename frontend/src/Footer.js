
import React from 'react';
import './Footer.css';

const Footer = ({ onNavigate }) => (
  <footer className="app-footer">
    <div className="footer-section">
      <div className="footer-left">
        <img src={require('./image.png')} alt="DORSU Logo" className="footer-logo" />
        <div className="footer-contact">
          <div className="contact-row">
            <span role="img" aria-label="school">🏫</span>
            <span>Davao Oriental State University</span>
          </div>
          <div className="contact-row">
            <span role="img" aria-label="location">📍</span>
            <span>Guang-guang, Dahican, City of Mati 8200, Davao Oriental, Philippines</span>
          </div>
          <div className="contact-row">
            <span role="img" aria-label="email">✉️</span>
            <span>@dorsu.edu.ph</span>
          </div>
        </div>
      </div>

      <div className="footer-right">
        <div className="footer-ict">Information, Communications and Technology Unit</div>
        <div className="footer-email">mikemisoles74@gmail.com</div>
        <div className="footer-copy"> © 2025</div>
        <div className="socials">
          <a href="https://www.facebook.com/share/1LqEunNqXx/" target="_blank" rel="noopener noreferrer">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="social-icon" />
          </a>
          <a href="https://www.instagram.com/dorsu_official/" target="_blank" rel="noopener noreferrer">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" className="social-icon" />
          </a>
          <a href="https://www.youtube.com/@dorsuofficial" target="_blank" rel="noopener noreferrer">
            <img src={process.env.PUBLIC_URL + '/youtube.png'} alt="YouTube" className="social-icon" />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
