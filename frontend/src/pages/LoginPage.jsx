import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { MessageCircleIcon, MailIcon, LoaderIcon, LockIcon } from "lucide-react";
import { Link } from "react-router";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="relative w-full h-dvh md:h-[min(800px,90dvh)] md:max-w-6xl overflow-hidden">
      {/* AMBIENT GLOW - scoped to the card, complements App's page-level glows */}
      <div className="absolute -top-10 -left-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-slate-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full h-full overflow-hidden rounded-none md:rounded-2xl border-0 md:border border-slate-700/50 bg-slate-900">
        <div className="w-full h-full flex flex-col md:flex-row">
          {/* FORM COLUMN - LEFT SIDE */}
          <div className="w-full md:w-1/2 h-full flex flex-col justify-between md:justify-center md:items-center p-6 sm:p-8 md:p-8 md:border-r border-slate-600/30 min-h-0 overflow-y-auto">
            <div className="w-full max-w-md mx-auto flex flex-col justify-between h-full md:h-auto md:block">
              {/* HEADING TEXT */}
              <div className="text-center pt-8 sm:pt-10 md:pt-0 mb-0 md:mb-8">
                <MessageCircleIcon className="w-12 h-12 sm:w-14 sm:h-14 md:w-12 md:h-12 mx-auto text-slate-400 mb-4 md:mb-4" />
                <h2 className="text-2xl sm:text-3xl md:text-2xl font-bold text-slate-200 mb-2">Welcome Back</h2>
                <p className="text-base text-slate-400">Login to access to your account</p>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 md:space-y-6 my-8 md:my-0">
                {/* EMAIL INPUT */}
                <div>
                  <label className="auth-input-label">Email</label>
                  <div className="relative">
                    <MailIcon className="auth-input-icon" />

                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      placeholder="johndoe@gmail.com"
                    />
                  </div>
                </div>

                {/* PASSWORD INPUT */}
                <div>
                  <label className="auth-input-label">Password</label>
                  <div className="relative">
                    <LockIcon className="auth-input-icon" />

                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button className="auth-btn" type="submit" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <LoaderIcon className="w-full h-5 animate-spin text-center" />
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="text-center pb-8 sm:pb-10 md:pb-0 mt-0 md:mt-6">
                <Link to="/signup" className="auth-link">
                  Don't have an account? Sign Up
                </Link>
              </div>
            </div>
          </div>

          {/* FORM ILLUSTRATION - RIGHT SIDE */}
          <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-cyan-500/10 via-slate-800/10 to-transparent min-h-0">
            <div>
              <img
                src="/login.png"
                alt="People using mobile devices"
                className="w-full h-auto object-contain"
              />
              <div className="mt-6 text-center">
                <h3 className="text-xl font-medium text-cyan-400">Connect anytime, anywhere</h3>

                <div className="mt-4 flex justify-center gap-4">
                  <span className="auth-badge">Free</span>
                  <span className="auth-badge">Easy Setup</span>
                  <span className="auth-badge">Private</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;