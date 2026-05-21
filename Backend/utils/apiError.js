class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g., 400, 401, 500)
   * @param {string} message - Human‑readable error message
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    // Maintaining proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

module.exports = { ApiError };
