class AuthenticationError(Exception):
    status_code = 400
    code = "AUTHENTICATION_ERROR"


class InvalidAccountInput(AuthenticationError):
    status_code = 400
    code = "INVALID_ACCOUNT_INPUT"


class DuplicateAccount(AuthenticationError):
    status_code = 409
    code = "ACCOUNT_UNAVAILABLE"


class InvalidCredentials(AuthenticationError):
    status_code = 401
    code = "INVALID_CREDENTIALS"


class AuthenticationRequired(AuthenticationError):
    status_code = 401
    code = "AUTHENTICATION_REQUIRED"


class CsrfRejected(AuthenticationError):
    status_code = 403
    code = "CSRF_REJECTED"


class AuthenticationRepositoryUnavailable(AuthenticationError):
    status_code = 503
    code = "AUTHENTICATION_UNAVAILABLE"
