# PySpark service for MausamNet-AI weather analytics.

Consumes normalized weather snapshots from Kafka (topic
`mausamnet.weather.snapshot`, produced by the API sync pipeline) with
Spark Structured Streaming, and computes district/state-level analytics.

## Files

- `main.py`  — structured streaming: reads Kafka snapshots, computes 1-hour
  windowed state aggregates, writes state-partitioned Parquet + console.
- `batch.py` — batch job: reads snapshots from the Parquet output (or directly
  from Postgres via JDBC), keeps the latest snapshot per district, and writes
  per-state summaries as Parquet + JSON.

## Environment

All variables are optional with sensible defaults:

| Variable | Default |
| --- | --- |
| `KAFKA_BROKERS` | `localhost:9092` |
| `KAFKA_TOPIC_WEATHER_SNAPSHOT` | `mausamnet.weather.snapshot` |
| `SPARK_OUTPUT_DIR` | `data/analytics` |
| `SPARK_CHECKPOINT_DIR` | `data/checkpoints` |
| `SPARK_SUMMARY_DIR` | `data/output/summaries` |
| `SPARK_POSTGRES_JDBC_URL` | *(empty)* — only needed for `batch.py --postgres` |

Values are loaded from the repo-root `.env` (if present) and
`services/spark/.env` (if present).

> Java 11+ and a Kafka broker are required. `SPARK_KAFKA_PACKAGE` in `main.py`
> is auto-derived from the installed `pyspark` version (Spark 4.x -> Scala 2.13,
> Spark 3.x -> Scala 2.12), so keep `pyspark` as the single source of truth.

## Run

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# start Kafka first (see docker-compose.yml at the repo root) and the API
python main.py            # streaming analytics
python batch.py --from parquet   # batch summaries from Parquet output
python batch.py --from postgres  # batch summaries straight from Postgres
```