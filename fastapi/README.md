# FastAPI ML Service — ISC LMS

Hanya untuk ML inference/recommendation (AGENTS.md §3). Jangan taruh LMS business logic di sini.

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# test
curl -H "X-Internal-Secret: dev-secret" -X POST http://localhost:8000/api/v1/ml/recommendation -H "Content-Type: application/json" -d "{\"user_id\":\"test\",\"learning_progress\":75}"
```

Next.js panggil dari server-only (`src/lib/ml/client.ts`) dengan `FASTAPI_INTERNAL_SECRET`.
