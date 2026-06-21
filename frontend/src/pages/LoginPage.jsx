import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { StateNotice } from "../components/ui/StateNotice";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user, isHydrating } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isHydrating && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await login(form);
      navigate("/");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-page-split">
      <div className="auth-card auth-card-split">
        <div className="form-container sign-in-container">
          <form id="login-form" onSubmit={handleSubmit}>
            <h2>Login to Your Account</h2>
            <div className="form-group">
              <label htmlFor="login-email">E-Mail:</label>
              <input
                type="email"
                id="login-email"
                name="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
                placeholder="xyz@mail.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password:</label>
              <input
                type="password"
                id="login-password"
                name="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
            </div>
            {errorMessage ? <StateNotice title="Login failed" message={errorMessage} variant="error" /> : null}
            <button disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign In"}</button>
          </form>
        </div>

        <div className="overlay-container">
          <div>
            <h1>Welcome Back!</h1>
            <p>To keep connected with us, please login with your personal info</p>
            <button className="ghost" type="button">
              Sign In
            </button>
            <h1>Hello! New to Our App?</h1>
            <p>Enter your personal details and start your journey with us</p>
            <Link className="ghost ghost-link" to="/signup">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
