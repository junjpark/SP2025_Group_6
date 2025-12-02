import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./LandingPage.css";
import { FiScissors, FiRepeat, FiEdit3, FiLayers, FiShield, FiEye } from "react-icons/fi";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="landing-hero">
      <main className="landing-content">
        {/* Two-column hero with AI co‑choreographer badge */}
        <section className="hero-grid">
          <div className="hero-copy">
            <h1 className="title">Practice smarter. <p/> Learn faster.</h1>
            <p className="subtitle">
              Cory watches alongside you with posture overlays, looping clips,
              and timestamped notes — so you can focus on dancing, not tooling.
            </p>
            <div className="cta-row">
              <button className="primary-btn" onClick={() => navigate("/signup")}>
                Create an account
              </button>
              <button className="ghost-btn" onClick={() => navigate("/login")}>
                I already have an account
              </button>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="visual-card">
              <div className="visual-overlay" />
              <div className="visual-strip" />
            </div>
          </div>
        </section>

        {/* Feature Cards (sleek, minimal) */}
        <section className="feature-grid">
          <article className="feature-card">
            <div className="feature-head">
              <div className="feature-icon"><FiScissors /></div>
              <h3 className="feature-title">Clip editing</h3>
            </div>
            <p className="feature-text">
              Set precise start/end points to drill sections. One tap to loop.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-head">
              <div className="feature-icon"><FiRepeat /></div>
              <h3 className="feature-title">Learning Mode</h3>
            </div>
            <p className="feature-text">
              Full‑screen practice with looping, quick switching, and keyboard control.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-head">
              <div className="feature-icon"><FiEdit3 /></div>
              <h3 className="feature-title">Timestamped notes</h3>
            </div>
            <p className="feature-text">
              Keep observations tied to exact moments — they’re easy to revisit.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-head">
              <div className="feature-icon"><FiLayers /></div>
              <h3 className="feature-title">Posture overlays</h3>
            </div>
            <p className="feature-text">
              AI‑generated landmarks help you line up angles, timing, and shapes.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-head">
              <div className="feature-icon"><FiEye /></div>
              <h3 className="feature-title">Side‑by‑side views</h3>
            </div>
            <p className="feature-text">
              Compare takes with quick toggle and mirrored playback.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-head">
              <div className="feature-icon"><FiShield /></div>
              <h3 className="feature-title">Secure sign‑in</h3>
            </div>
            <p className="feature-text">
              Email or Google with server‑side sessions and HTTP‑only cookies.
            </p>
          </article>


        </section>
      </main>
    </div>
  );
}


