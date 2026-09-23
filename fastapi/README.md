# FastAPI ML Service — ISC LMS (P10 Full Spec)

Hanya untuk ML inference/recommendation — **advisory only, tidak mutate grades** (`AGENTS.md §3`, `§45`). 4 endpoints Pydantic, model real.

## Endpoints

- `POST /api/v1/ml/recommendation` — DAG-aware next materials/courses
- `POST /api/v1/ml/learning-analysis` — strengths/weaknesses overall
- `POST /api/v1/ml/student-risk` — RandomForest 50 trees, 7 features, 14k Student Performance dataset
- `POST /api/v1/ml/content-recommendation` — TF-IDF + popularity, Udemy 3678 courses

Semua butuh header `X-Internal-Secret: $FASTAPI_INTERNAL_SECRET` (Next server-only `src/lib/ml/client.ts`).

## Datasets (Kaggle — model real)

1. **Student Risk:** [Student Performance and Learning Behavior Dataset](https://www.kaggle.com/datasets/adilshamim8/student-performance-and-learning-style) — 14,003 rows, 16 attrs (adilshamim8, CC BY 4.0). Fallback synthetic 10 rows di `datasets/student_performance.csv` untuk demo/CI.
   ```bash
   kaggle datasets download adilshamim8/student-performance-and-learning-style -p datasets/ --unzip
   # atau manual download → datasets/student_performance.csv
   ```

2. **Content:** [Udemy Courses](https://www.kaggle.com/datasets/nayanack/udemy-courses) — 3,678 courses, 11 cols (nayanack). Fallback 8 rows di `datasets/udemy_courses.csv`.
   ```bash
   kaggle datasets download nayanack/udemy-courses -p datasets/ --unzip
   # → datasets/udemy_courses.csv
   ```

3. **Alternative besar:** Australian 100k (51 features) — https://www.kaggle.com/datasets/nasirayub2/australian-student-performancedata-aspd24

Model dilatih synthetic fallback jika CSV tidak ada; jika CSV ada, `pandas` akan load (lihat `app/services/student_risk.py` TODO: `raise NotImplementedError` → ganti mapping).

## Local

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt  # fastapi==0.141.1, sklearn, pandas, pydantic-settings
uvicorn app.main:app --reload --port 8000

# test
curl -H "X-Internal-Secret: dev-secret" -X POST http://localhost:8000/api/v1/ml/recommendation -H "Content-Type: application/json" -d "{\"user_id\":\"test\",\"learning_progress\":75}"
curl -H "X-Internal-Secret: dev-secret" -X POST http://localhost:8000/api/v1/ml/student-risk -H "Content-Type: application/json" -d "{\"user_id\":\"test\",\"learning_progress\":65,\"quiz_scores\":[80],\"attendance_rate\":90}"
```

## FastAPI Cloud

- Env `FASTAPI_INTERNAL_SECRET` (required, no dev-secret fallback di prod) — set di FastAPI Cloud dashboard.
- `FASTAPI_BASE_URL=https://<your>.fastapi.cloud` di Next.js `/.env` → `src/lib/ml/client.ts` + `Vercel` dashboard.
- Deploy: `Dockerfile` ada di `fastapi/Dockerfile` (`python:3.11-slim`, `uvicorn`).

## Next.js

Panggil dari server-only:
```ts
import { getMLRecommendation, getStudentRisk } from "@/lib/ml/client"; // server-only
const rec = await getMLRecommendation({ user_id, learning_progress: 65, ... });
const risk = await getStudentRisk({ user_id, learning_progress: 65, study_hours_per_week: 12, stress_level: 5 });
```

Proxy: `src/app/api/v1/ml/[...]/route.ts` → `src/lib/ml/client.ts` → FastAPI (advisory).

## Structure

```
fastapi/
├── app/
│   ├── main.py (4 endpoints)
│   ├── schemas.py (4 Request/Response)
│   ├── core/config.py (BaseSettings)
│   └── services/
│       ├── recommendation.py (DAG)
│       ├── learning_analysis.py
│       ├── student_risk.py (RandomForest)
│       └── content_recommendation.py (TF-IDF)
├── datasets/
│   ├── student_performance.csv (synthetic 10)
│   └── udemy_courses.csv (8)
├── requirements.txt (incl. sklearn, pandas)
└── Dockerfile
```
