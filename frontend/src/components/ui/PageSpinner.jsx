export const PageSpinner = ({ label = "Loading..." }) => (
  <div className="loading-state">
    <div className="spinner" />
    <p>{label}</p>
  </div>
);
