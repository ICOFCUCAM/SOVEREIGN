"""Example: submit a record, then verify an inbound webhook."""
import os
from uuid import uuid4

from dispatch import DispatchClient, DispatchApiError, verify_webhook

d = DispatchClient(
    base_url=os.environ.get("DISPATCH_API", "https://api.dispatch.sovereigndo.com"),
    client_id=os.environ["DISPATCH_CLIENT_ID"],
    secret=os.environ["DISPATCH_SECRET"],
)

record = {
    "schemaVersion": "1.0",
    "source": {"system": "ministry-erp"},
    "document": {
        "ddmVersion": "1.0",
        "docType": "executive_briefing",
        "metadata": {"title": "Regional Stability Brief", "date": "2026-06-26", "status": "final"},
        "classification": {"scheme": "none", "level": "UNCLASSIFIED"},
        "sections": [
            {"id": "s1", "role": "executive_summary", "heading": "Executive Summary", "level": 1,
             "blocks": [{"id": "b1", "type": "paragraph", "text": "BLUF.", "style": "lead"}]},
            {"id": "s2", "role": "key_judgements", "heading": "Key Judgements", "level": 1,
             "blocks": [{"id": "b2", "type": "bullets", "ordered": True, "items": [{"text": "One."}]}]},
            {"id": "s3", "role": "analysis", "heading": "Analysis", "level": 1,
             "blocks": [{"id": "b3", "type": "paragraph", "text": "Body."}]},
            {"id": "s4", "role": "recommendation", "heading": "Recommendation", "level": 1,
             "blocks": [{"id": "b4", "type": "callout", "style": "recommendation", "text": "Proceed."}]},
        ],
    },
    "outputs": ["pdf"],
    "delivery": {"mode": "async", "storage": "signed_url", "ttlSeconds": 604800},
}

try:
    res = d.create_record(record, idempotency_key=str(uuid4()))
    print("submitted", res["documentId"], "→", res["lifecycle"])
    print(d.get_record(res["documentId"]))
except DispatchApiError as e:
    print(f"Dispatch refused: {e.code} — {e.message}")

# In your webhook receiver (Flask-style):
#   @app.post("/hooks/dispatch")
#   def hook():
#       if not verify_webhook(request.get_data(), request.headers.get("X-Dispatch-Signature"), SECRET):
#           return "", 401
#       evt = request.get_json()
#       # ... react (idempotent on request.headers["X-Dispatch-Delivery"]) ...
#       return "", 200
_ = verify_webhook
