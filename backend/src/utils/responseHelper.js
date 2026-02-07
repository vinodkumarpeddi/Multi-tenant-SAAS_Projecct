/**
 * Standard success response
 */
const success = (res, data, message = null, statusCode = 200) => {
    const response = { success: true };
    if (message) response.message = message;
    if (data !== undefined) response.data = data;
    return res.status(statusCode).json(response);
};

/**
 * Standard error response
 */
const error = (res, message, statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        message
    });
};

/**
 * Created response (201)
 */
const created = (res, data, message = 'Created successfully') => {
    return success(res, data, message, 201);
};

/**
 * Not found response (404)
 */
const notFound = (res, message = 'Resource not found') => {
    return error(res, message, 404);
};

/**
 * Unauthorized response (401)
 */
const unauthorized = (res, message = 'Unauthorized') => {
    return error(res, message, 401);
};

/**
 * Forbidden response (403)
 */
const forbidden = (res, message = 'Access denied') => {
    return error(res, message, 403);
};

/**
 * Conflict response (409)
 */
const conflict = (res, message = 'Resource already exists') => {
    return error(res, message, 409);
};

module.exports = {
    success,
    error,
    created,
    notFound,
    unauthorized,
    forbidden,
    conflict
};
