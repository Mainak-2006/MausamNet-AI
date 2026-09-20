"""MausamNet-AI weather analytics: structured streaming job.

Consumes normalized weather snapshots published by the API on the Kafka topic
`mausamnet.weather.snapshot` and computes live district/state-level analytics:

  * district-by-district latest snapshot (raw, partitioned by state)
  * 1-hour windowed state aggregates (count, avg/min/max temperature,
    humidity, pressure, wind, hottest district)

Run:
    python main.py
"""

import os
from pathlib import Path

from dotenv import load_dotenv
import pyspark
from pyspark.sql import SparkSession, functions as F
from pyspark.sql.types import (
    DoubleType,
    StringType,
    StructField,
    StructType,
)

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")

KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "localhost:9092")
SNAPSHOT_TOPIC = os.getenv(
    "KAFKA_TOPIC_WEATHER_SNAPSHOT", "mausamnet.weather.snapshot"
)
OUTPUT_DIR = os.getenv(
    "SPARK_OUTPUT_DIR",
    str(Path(__file__).resolve().parent / "data" / "analytics"),
)
CHECKPOINT_DIR = os.getenv(
    "SPARK_CHECKPOINT_DIR",
    str(Path(__file__).resolve().parent / "data" / "checkpoints"),
)

# Keep the Kafka connector in sync with the installed pyspark: Spark 4.x is
# Scala 2.13, Spark 3.x is Scala 2.12.
_PYSPARK_MAJOR = int(pyspark.__version__.split(".")[0])
_SPARK_SCALA = "2.13" if _PYSPARK_MAJOR >= 4 else "2.12"
SPARK_KAFKA_PACKAGE = (
    f"org.apache.spark:spark-sql-kafka-0-10_{_SPARK_SCALA}:{pyspark.__version__}"
)

SNAPSHOT_SCHEMA = StructType(
    [
        StructField("locationId", StringType()),
        StructField("name", StringType()),
        StructField("state", StringType()),
        StructField("type", StringType()),
        StructField("latitude", StringType()),
        StructField("longitude", StringType()),
        StructField("temperature", StringType()),
        StructField("feelsLike", StringType()),
        StructField("humidity", StringType()),
        StructField("pressure", StringType()),
        StructField("windSpeed", StringType()),
        StructField("windDirection", StringType()),
        StructField("condition", StringType()),
        StructField("source", StringType()),
        StructField("observedAt", StringType()),
        StructField("runId", StringType()),
    ]
)


def build_spark() -> SparkSession:
    return (
        SparkSession.builder.appName("MausamNetWeatherStreaming")
        .config("spark.jars.packages", SPARK_KAFKA_PACKAGE)
        .config("spark.sql.shuffle.partitions", "8")
        .getOrCreate()
    )


def parse_snapshots(df):
    """Decode Kafka JSON values into a typed, parsed dataframe."""
    parsed = (
        df.selectExpr("CAST(value AS STRING) AS json")
        .select(F.from_json(F.col("json"), SNAPSHOT_SCHEMA).alias("s"))
        .select(
            F.col("s.locationId").alias("location_id"),
            F.col("s.name").alias("location_name"),
            F.col("s.state"),
            F.col("s.type").alias("location_type"),
            F.col("s.latitude").cast(DoubleType()).alias("latitude"),
            F.col("s.longitude").cast(DoubleType()).alias("longitude"),
            F.col("s.temperature").cast(DoubleType()).alias("temperature_c"),
            F.col("s.feelsLike").cast(DoubleType()).alias("feels_like_c"),
            F.col("s.humidity").cast(DoubleType()).alias("humidity_pct"),
            F.col("s.pressure").cast(DoubleType()).alias("pressure_mb"),
            F.col("s.windSpeed").cast(DoubleType()).alias("wind_kph"),
            F.col("s.windDirection").cast(DoubleType()).alias("wind_deg"),
            F.col("s.condition"),
            F.col("s.source"),
            F.to_timestamp(F.col("s.observedAt")).alias("observed_at"),
            F.col("s.runId").alias("run_id"),
        )
    )
    return parsed.where(F.col("observed_at").isNotNull())


def aggregates(parsed):
    """Roll district snapshots up to 1-hour windowed state summaries."""
    return (
        parsed.withWatermark("observed_at", "30 minutes")
        .groupBy(
            F.col("state"),
            F.window(F.col("observed_at"), "1 hour").alias("window"),
        )
        .agg(
            F.count(F.lit(1)).alias("snapshot_count"),
            F.avg(F.col("temperature_c")).alias("avg_temp_c"),
            F.min(F.col("temperature_c")).alias("min_temp_c"),
            F.max(F.col("temperature_c")).alias("max_temp_c"),
            F.avg(F.col("humidity_pct")).alias("avg_humidity_pct"),
            F.avg(F.col("pressure_mb")).alias("avg_pressure_mb"),
            F.avg(F.col("wind_kph")).alias("avg_wind_kph"),
            F.max_by(F.col("location_name"), F.col("temperature_c")).alias(
                "hottest_district"
            ),
        )
        .select(
            F.col("state"),
            F.to_timestamp(F.col("window.start")).alias("window_start"),
            F.to_timestamp(F.col("window.end")).alias("window_end"),
            F.col("snapshot_count"),
            F.round(F.col("avg_temp_c"), 2).alias("avg_temp_c"),
            F.round(F.col("min_temp_c"), 2).alias("min_temp_c"),
            F.round(F.col("max_temp_c"), 2).alias("max_temp_c"),
            F.round(F.col("avg_humidity_pct"), 1).alias("avg_humidity_pct"),
            F.round(F.col("avg_pressure_mb"), 1).alias("avg_pressure_mb"),
            F.round(F.col("avg_wind_kph"), 1).alias("avg_wind_kph"),
            F.col("hottest_district"),
        )
    )


def main() -> None:
    spark = build_spark()

    raw = (
        spark.readStream.format("kafka")
        .option("kafka.bootstrap.servers", KAFKA_BROKERS)
        .option("subscribe", SNAPSHOT_TOPIC)
        .option("startingOffsets", "latest")
        .option("failOnDataLoss", "false")
        .load()
    )

    parsed = parse_snapshots(raw)
    state_agg = aggregates(parsed)

    # Sink 1: parquet (state-partitioned) for batch analytics.
    state_sink = (
        state_agg.writeStream.outputMode("append")
        .format("parquet")
        .option("path", OUTPUT_DIR)
        .option("checkpointLocation", str(Path(CHECKPOINT_DIR) / "state-agg"))
        .partitionBy("state")
        .trigger(processingTime="60 seconds")
        .start()
    )

    # Sink 2: console for live observability.
    console_sink = (
        state_agg.writeStream.outputMode("append")
        .format("console")
        .option("truncate", "false")
        .trigger(processingTime="60 seconds")
        .start()
    )

    print(f"Streaming from {SNAPSHOT_TOPIC} -> {OUTPUT_DIR}")
    spark.streams.awaitAnyTermination()

    state_sink.stop()
    console_sink.stop()


if __name__ == "__main__":
    main()