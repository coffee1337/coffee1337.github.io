// Decorative ML/LLM/RAG terminal wallpaper for the hero. Not real metrics.
export const LOG_LINES = `
$ python -m rag.ingest --src ./docs --chunk-size 512 --overlap 64
[ingest] 1 284 chunks → embeddings ✓  index: pgvector (hnsw, cosine)
$ alembic upgrade head
INFO  [alembic.runtime.migration] Running upgrade a1f3 -> b7c2, add embeddings table
>>> retriever.search("async sqlalchemy session", top_k=5)
[0.912] docs/sqlalchemy/async.md#L40
[0.887] docs/fastapi/dependencies.md#L12
$ uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
INFO:     Application startup complete.
POST /v1/chat/completions 200  ttft=312ms  tokens=842  stream=true
[agent] tool_call → search_docs(query="FastAPI dependency injection")
[guardrail] response matches json_schema ✓  retries=0
$ python train.py --model astar_heuristic --epochs 50 --lr 3e-4
epoch 12/50  loss=0.1834  val_loss=0.2011
>>> torch.cuda.is_available()
True
>>> knn = KNN(k=5, metric="cosine", weights="distance").fit(X_train, y_train)
$ docker compose up -d api worker postgres redis
✔ Container mentor-postgres  Healthy
[celery] task rag.reindex[8f2c…] succeeded in 4.21s
>>> tokenizer.encode("Привет, мир")  # → [52, 9013, 11, 1239]
[eval] faithfulness=… answer_relevancy=… context_precision=…
$ pytest -q  ............................  28 passed
$ ruff check app tests && ruff format --check .
All checks passed
$ redis-cli PING
PONG
>>> embed("python fastapi rag")[:8]
tensor([ 0.12, -0.44,  0.09,  0.31, -0.02,  0.18, -0.27,  0.05])
$ psql -c "SELECT count(*) FROM embeddings;"
 count
-------
  1284
$ curl -s localhost:8000/health
{"ok":true,"index":"hnsw","metric":"cosine"}
[worker] job=embed_batch id=4c1a status=done n=64
>>> session.execute(select(User).where(User.active.is_(True)))
$ git clone https://github.com/coffee1337/ai-python-mentor.git
Cloning into 'ai-python-mentor'...
$ poetry install --with dev --no-root
Installing dependencies from lock file
>>> np.linalg.norm(q / (np.linalg.norm(q) + 1e-9))
1.0
[retriever] query="k-nn cosine"  neighbors=5  dim=384
$ alembic revision -m "add hnsw index on embeddings.vector"
Generating /migrations/versions/c9e1_add_hnsw_index.py
INFO:     127.0.0.1:4312 - "GET /v1/models" 200
[cache] redis hit key=rag:q:8f2c ttl=97s
$ python -m pytest tests/test_knn.py -q
.....                                                                    [100%]
>>> next(iter(pgvector.knn(query, k=5)))
Neighbor(id=41, score=0.931)
$ docker logs mentor-api --tail 3
Waiting for postgres... ok
$ mypy app --pretty --hide-error-context
Success: no issues found in 42 source files
[gateway] stream delta tokens=12 ttft=188ms
>>> Path("egor_trefilov.md").read_text()[:24]
$ pg_dump -t embeddings --schema-only
CREATE INDEX embeddings_hnsw ON embeddings USING hnsw (vector cosine_ops);
[router] tool=search_docs → 5 chunks, 812 tokens
$ make lint test
lint: ok    test: 28 passed
$ python -c "import torch; print(torch.__version__)"
$ fastapi dev app/main.py --port 8000
$ celery -A worker worker -l info
$ docker compose ps
$ pytest tests/test_rag.py -k cosine
$ python -m rag.query --q "who is egor" --top-k 5
$ alembic current
$ redis-cli KEYS "rag:*"
$ curl -s localhost:8000/v1/models
$ git status --short
$ ruff check --fix app
$ python -m compileall app
`.trim().split("\n");
