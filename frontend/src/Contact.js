import React, { useEffect, useRef, useState } from 'react';

const Contact = () => {
  const cardRef = useRef(null);
  useEffect(() => {
    const card = cardRef.current;
    card.style.opacity = 0;
    card.style.transform = 'translateY(40px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.8s cubic-bezier(.4,0,.2,1), transform 0.8s cubic-bezier(.4,0,.2,1)';
      card.style.opacity = 1;
      card.style.transform = 'translateY(0)';
    }, 100);
  }, []);

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // basic validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: 'error', text: 'Please fill out all fields.' });
      return;
    }
    // Mock submit - in real app you'd POST to an API
    setStatus({ type: 'sending', text: 'Sending...' });
    setTimeout(() => {
      setStatus({ type: 'success', text: 'Thanks! Your message was sent.' });
      setForm({ name: '', email: '', message: '' });
      // Add a notification for admins so AdminNotification picks it up
      try {
        const raw = localStorage.getItem('programHeadNotifications');
        const arr = raw ? JSON.parse(raw) : [];
        const note = {
          id: `msg_${Date.now()}`,
          title: 'New Contact Message',
          name: form.name,
          email: form.email,
          message: form.message,
          created_at: new Date().toISOString()
        };
        const updated = [note].concat(Array.isArray(arr) ? arr : []);
        localStorage.setItem('programHeadNotifications', JSON.stringify(updated));
        try { window.dispatchEvent(new Event('programHeadNotificationsUpdated')); } catch (e) {}
      } catch (e) {
        // ignore storage errors
      }
    }, 900);
  };

  return (
    <div style={{ color: '#fff', background: 'linear-gradient(135deg, #0f2c3e 0%, #1a4b6d 50%, #2a6b97 100%)', minHeight: '100vh', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background elements (match About.js) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `
          radial-gradient(circle at 15% 25%, rgba(37, 85, 124, 0.18) 0%, transparent 20%),
          radial-gradient(circle at 85% 65%, rgba(255, 215, 0, 0.12) 0%, transparent 20%),
          radial-gradient(circle at 50% 40%, rgba(25, 118, 210, 0.08) 0%, transparent 30%)
        `, zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `, backgroundSize: '40px 40px', zIndex: 0 }} />
      <style>{`
        .contact-card {
          background: rgba(30,30,40,0.98);
          border-radius: 24px;
          box-shadow: 0 8px 32px #1976d288, 0 1.5px 8px #0008;
          padding: 40px 32px 32px 32px;
          max-width: 720px;
          width: 92vw;
          margin: 0 auto;
          text-align: left;
          position: relative;
          opacity: 0;
          transform: translateY(40px);
        }
        .contact-title {
          color: #ffd600;
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 18px;
          letter-spacing: 2px;
          text-align: center;
        }
        .contact-desc {
          font-size: 1.15rem;
          color: #e0e0e0;
          margin-bottom: 24px;
          text-align: center;
          line-height: 1.7;
        }
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .contact-info-row {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 1.08rem;
          color: #fff;
          background: rgba(25,118,210,0.08);
          border-radius: 10px;
          padding: 10px 16px;
          box-shadow: 0 1px 4px #1976d222;
          transition: background 0.2s;
        }
        .contact-info-row:hover {
          background: #1976d2;
          color: #ffd600;
        }
        .contact-icon {
          font-size: 1.5rem;
          color: #ffd600;
          min-width: 28px;
          text-align: center;
        }

        /* Contact form layout - professional styling */
        .contact-grid { display: block; }
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .form-row { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .input-label { font-size: 0.9rem; color: #cfd8dc; margin-bottom: 6px; display:block; }
        .input-control { width: 80%; padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); color: #fff; outline: none; transition: box-shadow .15s, border-color .15s, transform .08s; }
        .input-control:focus { box-shadow: 0 6px 20px rgba(25, 118, 210, 0.12); border-color: rgba(255,255,255,0.14); transform: translateY(-1px); }
        textarea.input-control { min-height: 140px; resize: vertical; }
        .form-actions { display:flex; gap:12px; align-items:center; justify-content:flex-start; margin-top: 6px; }
        .btn-primary { background: linear-gradient(90deg,#ffd600,#ffb300); color: #0b0b0b; padding: 10px 18px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; box-shadow: 0 6px 18px rgba(255,182,18,0.14); }
        .status { min-height: 22px; font-size: 0.95rem; color: #b9f6ca; }

        .contact-side { background: rgba(255,255,255,0.02); border-radius: 12px; padding: 14px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.02); }
        .side-title { color: #ffd600; font-weight: 700; margin-bottom: 8px; }
        .side-row { display:flex; gap:12px; align-items:flex-start; padding:10px 8px; border-radius:8px; }
        .side-row b { color: #fff; }

        @media (min-width: 900px) {
          .contact-grid { display: grid; grid-template-columns: 1fr 320px; gap: 28px; align-items: start; }
          .form-grid { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr 1fr; }
          .contact-card { max-width: 980px; }
        }

        @media (max-width: 600px) {
          .contact-card {
            padding: 24px 8px 18px 8px;
            max-width: 98vw;
          }
          .contact-title {
            font-size: 2rem;
          }
        }
      `}</style>
  <div ref={cardRef} className="contact-card">
        <div className="contact-title">Feedback</div>
        <div className="contact-desc">
         Do you have a feedback about the system?<br />
        
        </div>
        <div className="contact-info" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="contact-grid">
            <div className="form-grid">
              <form onSubmit={handleSubmit} className="form-inner" aria-label="Contact form">
                <div className="form-row">
                  <div>
                    <label className="input-label" htmlFor="name">Name</label>
                    <input id="name" className="input-control" name="name" value={form.name} onChange={handleChange} placeholder="Your Name" />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="email">Email address</label>
                    <input id="email" className="input-control" name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@domain.com" />
                  </div>
                </div>
                <div>
                  <label className="input-label" htmlFor="message">Message</label>
                  <textarea id="message" className="input-control" name="message" value={form.message} onChange={handleChange} placeholder="How can we help?" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Send feedback</button>
                  <div className="status" role="status" aria-live="polite" style={{ color: status?.type === 'error' ? '#ff8a80' : '#b9f6ca' }}>{status?.text}</div>
                </div>
              </form>
            </div>
            <div className="contact-side">
              <div className="side-title">Contact details</div>
              <div className="side-row">
                <div className="contact-icon" role="img" aria-label="email">📧</div>
                <div><b>Email</b><div><a href="mailto:info@dorsu.edu.ph" style={{ color: '#ffd600', textDecoration: 'none' }}>@dorsu.edu.ph</a></div></div>
              </div>
              <div className="side-row">
                <div className="contact-icon" role="img" aria-label="phone">📞</div>
                <div><b>Phone</b><div><a href="tel:+63873883235" style={{ color: '#ffd600', textDecoration: 'none' }}>(087) 388-3195</a></div></div>
              </div>
              <div className="side-row">
                <div className="contact-icon" role="img" aria-label="address">📍</div>
                <div><b>Address</b><div>Guang-Guang, Dahican, City of Mati, 8200 Davao Oriental, Philippines</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Google Maps location */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <div style={{ width: '100%', maxWidth: 900, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 24px #1976d244' }}>
          <iframe
            title="DORSU Location"
            src="https://www.google.com/maps?q=Davao+Oriental+State+University&output=embed"
            width="100%"
            height="480"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default Contact;
