class ServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class NotFound(ServiceError):
    def __init__(self, message: str) -> None:
        super().__init__(message, 404)


class Conflict(ServiceError):
    def __init__(self, message: str) -> None:
        super().__init__(message, 409)


class Invalid(ServiceError):
    def __init__(self, message: str) -> None:
        super().__init__(message, 422)
