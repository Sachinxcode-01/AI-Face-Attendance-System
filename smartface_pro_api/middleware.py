"""
Enterprise middleware stack for SmartFace API:
- Request ID injection (UUID per request)
- Structured JSON request/response logging
- Security headers
- Response time measurement
"""
import time
import uuid
import logging
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("smartface.api")


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Injects a unique X-Request-ID into every request and response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs every request with method, path, status code, and latency."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        request_id = getattr(request.state, "request_id", "-")

        response = await call_next(request)

        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        log_data = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "latency_ms": latency_ms,
            "client": request.client.host if request.client else "unknown",
        }

        if response.status_code >= 500:
            logger.error(json.dumps(log_data))
        elif response.status_code >= 400:
            logger.warning(json.dumps(log_data))
        else:
            logger.info(json.dumps(log_data))

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds industry-standard security headers to every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        # Note: HSTS is only meaningful over HTTPS — add when behind TLS termination
        # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
