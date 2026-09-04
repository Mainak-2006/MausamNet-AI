"""Train and persist the multilingual weather event text classifier.

Loads the curated training data, preprocesses each sample through the same
transliteration + cleaning pipeline used at inference time, builds a combined
word + character n-gram TF-IDF feature space and fits a linear classifier, then
serializes the vectorizer and model into the ``models/`` directory.

Usage:
    python train.py
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

import joblib
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.svm import LinearSVC

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT: Path = Path(__file__).resolve().parent
MODEL_DIR: Path = PROJECT_ROOT / "models"
DATA_MODULE_PATH: Path = PROJECT_ROOT / "data"

# Ensure the project root and data package are importable regardless of CWD.
for path in (PROJECT_ROOT, DATA_MODULE_PATH):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from app.services.preprocess import preprocess  # noqa: E402
from data.training_data import TRAINING_DATA  # noqa: E402


def _feature_union() -> FeatureUnion:
    """Combine word-level and character-level TF-IDF features."""
    return FeatureUnion(
        [
            (
                "words",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 3),
                    max_features=10000,
                    sublinear_tf=True,
                ),
            ),
            (
                "chars",
                TfidfVectorizer(
                    lowercase=True,
                    analyzer="char_wb",
                    ngram_range=(2, 5),
                    max_features=10000,
                    sublinear_tf=True,
                ),
            ),
        ]
    )


def _preprocessed_texts(raw_texts: list[str]) -> list[str]:
    """Run every training sample through the shared preprocessing pipeline."""
    return [" ".join(preprocess(text)) for text in raw_texts]


def _cross_validate(texts: list[str], labels: list[str], n_folds: int = 5) -> None:
    """Run stratified k-fold cross-validation and log results."""
    pipeline = Pipeline(
        [
            ("features", _feature_union()),
            (
                "clf",
                CalibratedClassifierCV(
                    LinearSVC(C=1.0, max_iter=5000, class_weight="balanced"),
                    cv=3,
                    method="sigmoid",
                ),
            ),
        ]
    )

    skf = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=42)
    scores = cross_val_score(pipeline, texts, labels, cv=skf, scoring="accuracy")

    logger.info("Cross-validation accuracy: %.4f (+/- %.4f)", scores.mean(), scores.std())
    for i, score in enumerate(scores, 1):
        logger.info("  Fold %d: %.4f", i, score)


def _grid_search(texts: list[str], labels: list[str]) -> Pipeline:
    """Tune key hyperparameters via GridSearchCV and return the best pipeline."""
    pipeline = Pipeline(
        [
            ("features", _feature_union()),
            (
                "clf",
                CalibratedClassifierCV(
                    LinearSVC(max_iter=5000, class_weight="balanced"),
                    cv=3,
                    method="sigmoid",
                ),
            ),
        ]
    )

    param_grid = {
        "features__words__ngram_range": [(1, 2), (1, 3)],
        "features__words__max_features": [8000, 12000],
        "features__chars__ngram_range": [(2, 4), (2, 5)],
        "features__chars__max_features": [8000, 12000],
        "clf__estimator__C": [0.5, 1.0, 2.0],
    }

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid = GridSearchCV(
        pipeline,
        param_grid,
        cv=skf,
        scoring="accuracy",
        n_jobs=-1,
        verbose=0,
    )
    grid.fit(texts, labels)

    logger.info("GridSearch best accuracy: %.4f", grid.best_score_)
    logger.info("GridSearch best params: %s", grid.best_params_)

    return grid.best_estimator_


def train_model(save: bool = True, validation_split: float = 0.2) -> Pipeline:
    """Fit the word+char TF-IDF + LinearSVC pipeline with grid search."""
    raw_texts = [text for text, _ in TRAINING_DATA]
    labels = [label for _, label in TRAINING_DATA]

    if len(set(labels)) < 2:
        raise ValueError("Training data must contain at least two distinct labels.")

    texts = _preprocessed_texts(raw_texts)

    logger.info("Running %d-fold cross-validation...", 5)
    _cross_validate(texts, labels)

    logger.info("Running grid search for best hyperparameters...")
    best_pipeline = _grid_search(texts, labels)

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=validation_split, random_state=42, stratify=labels
    )

    best_pipeline.fit(X_train, y_train)

    y_pred = best_pipeline.predict(X_test)
    logger.info("Hold-out accuracy: %.4f", accuracy_score(y_test, y_pred))
    logger.info(
        "Classification report:\n%s",
        classification_report(y_test, y_pred, zero_division=0),
    )

    if save:
        save_model(best_pipeline)

    return best_pipeline


def save_model(pipeline: Pipeline) -> None:
    """Serialize the fitted pipeline to the models directory."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    features = pipeline.named_steps["features"]
    classifier = pipeline.named_steps["clf"]

    vectorizer_path = MODEL_DIR / "vectorizer.joblib"
    classifier_path = MODEL_DIR / "classifier.joblib"

    joblib.dump(features, vectorizer_path)
    joblib.dump(classifier, classifier_path)
    logger.info("Saved feature extractor to %s", vectorizer_path)
    logger.info("Saved classifier to %s", classifier_path)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Train and save the multilingual weather event classifier"
    )
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Train and evaluate only, do not write model artifacts",
    )
    parser.add_argument(
        "--split",
        type=float,
        default=0.2,
        help="Validation split fraction (default: 0.2)",
    )
    args = parser.parse_args()

    train_model(save=not args.no_save, validation_split=args.split)


if __name__ == "__main__":
    main()
