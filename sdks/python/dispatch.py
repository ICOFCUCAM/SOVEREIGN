"""Dispatch Platform API — official Python client.

Dependency-free (standard library only: urllib, hmac, json). Wraps the credential
flow (exchange client_id/secret for a short-lived bearer token, cached and
auto-refreshed) and the governed record lifecycle, plus webhook signature
verification. The contract is docs/api/openapi.yaml.

    from dispatch import DispatchClient, verify_webhook
    d = DispatchClient(base_url, client_id, secret)
    res = d.create_record(request, idempotency_key=str(uuid4()))
"""
from __future__ import annotations

import hmac
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from hashlib import sha256
from typing import Any, Optional


class DispatchApiError(Exception):
    def __init__(self, status: int, code: str, message: str, field: Optional[str] = None, request_id: Optional[str] = None):
        super().__init__(f"{code}: {message}")
        self.status = status
        self.code = code
        self.message = message
        self.field = field
        self.request_id = request_id


class DispatchClient:
    def __init__(self, base_url: str, client_id: str, secret: str, timeout: float = 30.0):
        if not (base_url and client_id and secret):
            raise ValueError("base_url, client_id and secret are required")
        self.base_url = base_url.rstrip("/")
        self.client_id = client_id
        self.secret = secret
        self.timeout = timeout
        self._token: Optional[str] = None
        self._expires_at = 0.0

    # ── auth ──────────────────────────────────────────────────────────────────
    def token(self) -> str:
        """Exchange the credential for a bearer token, cached until ~30s before expiry."""
        if self._token and time.time() < self._expires_at - 30:
            return self._token
        res = self._raw("POST", "/v1/token", body={"client_id": self.client_id, "secret": self.secret}, auth=False)
        self._token = res["access_token"]
        self._expires_at = time.time() + res.get("expiresIn", 3600)
        return self._token

    def _raw(self, method: str, path: str, body: Any = None, query: Optional[dict] = None,
             idempotency_key: Optional[str] = None, auth: bool = True) -> Any:
        url = self.base_url + path
        if query:
            clean = {k: v for k, v in query.items() if v is not None}
            if clean:
                url += "?" + urllib.parse.urlencode(clean)
        headers = {}
        data = None
        if body is not None:
            data = json.dumps(body).encode()
            headers["content-type"] = "application/json"
        if auth:
            headers["authorization"] = "Bearer " + self.token()
        if idempotency_key:
            headers["idempotency-key"] = idempotency_key
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                raw = resp.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                err = json.loads(raw).get("error", {})
            except Exception:
                err = {}
            raise DispatchApiError(e.code, err.get("code", f"HTTP_{e.code}"),
                                   err.get("message", e.reason or "request failed"),
                                   err.get("field"), err.get("requestId")) from None

    # ── records ───────────────────────────────────────────────────────────────
    def create_record(self, request: dict, idempotency_key: Optional[str] = None) -> dict:
        """Submit a document as an Official Record. idempotency_key makes retries safe."""
        return self._raw("POST", "/v1/documents", body=request, idempotency_key=idempotency_key)

    def get_record(self, document_id: str) -> dict:
        return self._raw("GET", f"/v1/documents/{urllib.parse.quote(document_id)}")

    def list_records(self, state=None, doc_type=None, q=None, limit=None) -> dict:
        return self._raw("GET", "/v1/documents", query={"state": state, "docType": doc_type, "q": q, "limit": limit})

    # ── lifecycle ─────────────────────────────────────────────────────────────
    def decide(self, document_id: str, decision: str, comment=None, outputs=None) -> dict:
        return self._raw("POST", f"/v1/documents/{urllib.parse.quote(document_id)}/decision",
                         body={"decision": decision, "comment": comment, "outputs": outputs})

    def publish(self, document_id: str) -> dict:
        return self._raw("POST", f"/v1/documents/{urllib.parse.quote(document_id)}/publish", body={})

    def withdraw(self, document_id: str) -> dict:
        return self._raw("POST", f"/v1/documents/{urllib.parse.quote(document_id)}/withdraw", body={})

    def archive(self, document_id: str) -> dict:
        return self._raw("POST", f"/v1/documents/{urllib.parse.quote(document_id)}/archive", body={})

    # ── evidence ──────────────────────────────────────────────────────────────
    def governance_certificate(self, document_id: str) -> dict:
        return self._raw("GET", f"/v1/documents/{urllib.parse.quote(document_id)}/governance-certificate")

    def preservation_certificate(self, document_id: str) -> dict:
        return self._raw("GET", f"/v1/documents/{urllib.parse.quote(document_id)}/certificate")

    def audit(self, target=None, limit=None) -> dict:
        return self._raw("GET", "/v1/audit", query={"target": target, "limit": limit})

    def job(self, job_id: str) -> dict:
        return self._raw("GET", f"/v1/jobs/{urllib.parse.quote(job_id)}")

    # ── webhooks (admin) ──────────────────────────────────────────────────────
    def list_webhooks(self) -> dict:
        return self._raw("GET", "/v1/admin/webhooks")

    def create_webhook(self, url: str, events=None, description=None) -> dict:
        return self._raw("POST", "/v1/admin/webhooks", body={"url": url, "events": events or [], "description": description})

    def delete_webhook(self, webhook_id: str) -> dict:
        return self._raw("DELETE", "/v1/admin/webhooks", body={"id": webhook_id})


def verify_webhook(raw_body: bytes | str, signature_header: Optional[str], secret: str) -> bool:
    """Verify an inbound webhook. Pass the RAW request body, the X-Dispatch-Signature
    header, and the endpoint's signing secret. Constant-time; True iff authentic."""
    if not signature_header:
        return False
    body = raw_body.encode() if isinstance(raw_body, str) else raw_body
    expected = "sha256=" + hmac.new(secret.encode(), body, sha256).hexdigest()
    return hmac.compare_digest(signature_header, expected)
