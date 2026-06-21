import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { StateNotice } from "../components/ui/StateNotice";

const createPhoneField = () => ({ id: crypto.randomUUID(), value: "" });

export const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, user, isHydrating } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    dob: "",
    phones: [createPhoneField()],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isHydrating && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await signup({
        email: form.email,
        password: form.password,
        username: form.username,
        dob: form.dob,
        phones: form.phones.map((phone) => phone.value),
      });
      setSuccessMessage("Account created successfully. Redirecting to your home page...");
      navigate("/");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePhone = (id, value) => {
    setForm((current) => ({
      ...current,
      phones: current.phones.map((phone) => (phone.id === id ? { ...phone, value } : phone)),
    }));
  };

  return (
    <div className="auth-page">
      <div className="signup-card">
        <h1>Create a new Account!</h1>
        <form id="signup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-email">E-Mail:</label>
            <input
              type="email"
              id="signup-email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
              placeholder="xyz@mail.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="signup-password">Password:</label>
            <input
              type="password"
              id="signup-password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="signup-username">Username:</label>
            <input
              type="text"
              id="signup-username"
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              required
              placeholder="ABC_10"
            />
          </div>
          <div className="form-group">
            <label htmlFor="signup-dob">Date of Birth:</label>
            <input
              type="date"
              id="signup-dob"
              value={form.dob}
              onChange={(event) => setForm((current) => ({ ...current, dob: event.target.value }))}
              required
            />
          </div>

          <div id="phone-numbers">
            {form.phones.map((phone, index) => (
              <div className="form-group phone-group" key={phone.id}>
                <label htmlFor={`phone-${phone.id}`}>Phone Number:</label>
                <input
                  type="tel"
                  id={`phone-${phone.id}`}
                  value={phone.value}
                  onChange={(event) => updatePhone(phone.id, event.target.value)}
                  pattern="[0-9]{10}"
                  required
                  placeholder="1234567890"
                />
                {index > 0 ? (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        phones: current.phones.filter((currentPhone) => currentPhone.id !== phone.id),
                      }))
                    }
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                phones: [...current.phones, createPhoneField()],
              }))
            }
          >
            Add Another Phone Number
          </button>

          {errorMessage ? <StateNotice title="Sign-up failed" message={errorMessage} variant="error" /> : null}
          {successMessage ? <StateNotice title="Success" message={successMessage} variant="success" /> : null}

          <button type="submit" id="new-submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Submit"}
          </button>
        </form>

        <div className="switch-form">
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
