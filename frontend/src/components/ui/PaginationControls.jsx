export const PaginationControls = ({ page, limit, total, onPageChange }) => {
  if (!total || total <= limit) {
    return null;
  }

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="pagination-controls">
      <button
        className="secondary-button"
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      <p className="pagination-summary">
        Page {page} of {totalPages}
      </p>
      <button
        className="secondary-button"
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  );
};

