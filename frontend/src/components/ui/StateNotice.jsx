export const StateNotice = ({ title, message, variant = "empty", action }) => (
  <div className={`state-notice state-notice-${variant}`}>
    <h3>{title}</h3>
    {message ? <p>{message}</p> : null}
    {action ? <div className="state-action">{action}</div> : null}
  </div>
);
