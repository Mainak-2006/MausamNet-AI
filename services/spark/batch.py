"""MausamNet-AI weather analytics: batch job.

Reads point-in-time snapshots from either:

  * the Parquet output of `main.py` (default, --from parquet), or
  * the API's Postgres `weather_snapshots` table (--from postgres), provided
    a JDBC URL is set, e.g. via SPARK_POSTGRES_JDBC_URL.

Computes the latest snapshot per district and per-state summaries and writes
JSON files to data/output/summaries (plus optional Parquet).

Run:
    python batch.py --from parquet
    python batch.py --from postgres
"""

import argparse
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from pyspark.sql import SparkSession, Window, functions as F
from pyspark.sql.types import DoubleType

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")

OUTPUT_DIR = os.getenv(
    "SPARK_OUTPUT_DIR",
    str(Path(__file__).resolve().parent / "data" / "analytics"),
)
SUMMARY_DIR = os.getenv(
    "SPARK_SUMMARY_DIR",
    str(Path(__file__).resolve().parent / "data" / "output" / "summaries"),
)

POSTGRES_JDBC_URL = os.getenv("SPARK_POSTGRES_JDBC_URL", "")
SPARK_JDBC_JARS = os.getenv("SPARK_JDBC_JARS", "")


def read_parquet(spark):
    return spark.read.parquet(OUTPUT_DIR)


def read_postgres(spark, since_hours=None):
    if not POSTGRES_JDBC_URL:
        raise SystemExit(
            "SPARK_POSTGRES_JDBC_URL not set (e.g. "
            "jdbc:postgresql://host:5432/postgres?user=...&password=...). "
            "Pass --parquet instead."
        )
    reader = (
        spark.read.format("jdbc")
        .option("url", POSTGRES_JDBC_URL)
        .option("driver", "org.postgresql.Driver")
    )
    if since_hours:
        reader = reader.option(
            "query",
            f"SELECT * FROM weather_snapshots "
            f"WHERE observed_at >= NOW() - INTERVAL '{int(since_hours)} hours'",
        )
    else:
        reader = reader.option("dbtable", "weather_snapshots")
    # Normalize Postgres column names to the same schema main.py writes to
    # Parquet (temperature_c, humidity_pct, ...) so downstream code is
    # source-agnostic.
    return reader.load().select(
        F.col("location_id"),
        F.col("city").alias("location_name"),
        F.col("state"),
        F.col("latitude").cast(DoubleType()).alias("latitude"),
        F.col("longitude").cast(DoubleType()).alias("longitude"),
        F.col("temperature").cast(DoubleType()).alias("temperature_c"),
        F.col("feels_like").cast(DoubleType()).alias("feels_like_c"),
        F.col("humidity").cast(DoubleType()).alias("humidity_pct"),
        F.col("pressure").cast(DoubleType()).alias("pressure_mb"),
        F.col("wind_speed").cast(DoubleType()).alias("wind_kph"),
        F.col("wind_direction").cast(DoubleType()).alias("wind_deg"),
        F.col("condition"),
        F.col("source"),
        F.col("observed_at"),
        F.col("run_id"),
    )


def latest_snapshot_per_location(snapshots):
    """Keep the most recent snapshot per location_id."""
    return (
        snapshots.select(
            F.col("location_id"),
            F.col("location_name").alias("name"),
            F.col("state"),
            F.col("temperature_c"),
            F.col("humidity_pct"),
            F.col("pressure_mb"),
            F.col("wind_kph"),
            F.col("condition"),
            F.col("observed_at"),
        )
        .withColumn(
            "rank",
            F.row_number().over(
                Window.partitionBy("location_id").orderBy(
                    F.col("observed_at").desc()
                )
            ),
        )
        .where(F.col("rank") == 1)
        .drop("rank")
    )


def summarize_state(latest):
    return (
        latest.dropna(subset=["state"])
        .groupBy("state")
        .agg(
            F.count(F.lit(1)).alias("location_count"),
            F.avg("temperature_c").alias("avg_temp_c"),
            F.max("temperature_c").alias("max_temp_c"),
            F.min("temperature_c").alias("min_temp_c"),
            F.avg("humidity_pct").alias("avg_humidity_pct"),
            F.max_by("name", "temperature_c").alias("hottest_location"),
            F.max("observed_at").alias("latest_observed_at"),
        )
        .orderBy(F.col("avg_temp_c").desc())
        .coalesce(1)
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="MausamNet weather batch analytics")
    parser.add_argument("--from", dest="source", choices=["parquet", "postgres"], default="parquet")
    parser.add_argument(
        "--since-hours",
        type=int,
        default=None,
        help="Only include snapshots newer than N hours (postgres source)",
    )
    args = parser.parse_args()

    spark_builder = (
        SparkSession.builder.appName("MausamNetWeatherBatch")
        .config("spark.sql.shuffle.partitions", "8")
    )
    if SPARK_JDBC_JARS:
        spark_builder = spark_builder.config("spark.jars", SPARK_JDBC_JARS)
    spark = spark_builder.getOrCreate()

    snapshots = (
        read_parquet(spark)
        if args.source == "parquet"
        else read_postgres(spark, args.since_hours)
    )
    snapshots = snapshots.where(F.col("temperature_c").isNotNull())

    latest = latest_snapshot_per_location(snapshots)
    by_state = summarize_state(latest)

    out = Path(SUMMARY_DIR)
    out.mkdir(parents=True, exist_ok=True)

    latest.write.mode("overwrite").parquet(str(out / "latest_per_location"))
    by_state.write.mode("overwrite").parquet(str(out / "by_state"))

    # Export human-readable JSON for the admin dashboard / debugging.
    state_rows = by_state.collect()
    generated_at = spark.sql("SELECT current_timestamp() AS ts").collect()[0]["ts"]
    payload = {
        "generated_at": str(generated_at),
        "states": [
            {
                "state": row.state,
                "location_count": row.location_count,
                "avg_temp_c": round(float(row.avg_temp_c), 2) if row.avg_temp_c is not None else None,
                "max_temp_c": round(float(row.max_temp_c), 2) if row.max_temp_c is not None else None,
                "min_temp_c": round(float(row.min_temp_c), 2) if row.min_temp_c is not None else None,
                "avg_humidity_pct": round(float(row.avg_humidity_pct), 1) if row.avg_humidity_pct is not None else None,
                "hottest_location": row.hottest_location,
            }
            for row in state_rows
        ],
    }
    with open(out / "by_state.json", "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, default=str)

    print(f"Wrote {len(payload['states'])} state summaries to {out}")
    for row in state_rows[:10]:
        print(f"  {row.state}, avg {row.avg_temp_c:.2f}C, hottest {row.hottest_location}")


if __name__ == "__main__":
    main()