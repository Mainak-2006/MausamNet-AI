"""Curated training data for weather event text classification.

Each entry is a (text, event_type) tuple. Event types mirror the shared
WeatherEvent enum: rainfall, flood, thunderstorm, heatwave, strong_wind,
cyclone, drought, other.
"""

from typing import Final

from data.cyclone_training_data import CYCLONE_DATA
from data.drought_training_data import DROUGHT_TRAINING_DATA
from data.flood_training_data import FLOOD_TRAINING_DATA
from data.heatwave_training_data import HEATWAVE_DATA
from data.other_training_data import OTHER_TRAINING_DATA
from data.rainfall_training_data import RAINFALL_DATA
from data.strong_wind_training_data import STRONG_WIND_DATA
from data.thunderstorm_training_data import THUNDERSTORM_TRAINING_DATA

# Valid event types used by the platform.
EVENT_TYPES: Final[list[str]] = [
    "rainfall",
    "flood",
    "thunderstorm",
    "heatwave",
    "strong_wind",
    "cyclone",
    "drought",
    "other",
]

# Combined training data from all event-specific files.
TRAINING_DATA: Final[list[tuple[str, str]]] = (
    RAINFALL_DATA
    + FLOOD_TRAINING_DATA
    + THUNDERSTORM_TRAINING_DATA
    + HEATWAVE_DATA
    + STRONG_WIND_DATA
    + CYCLONE_DATA
    + DROUGHT_TRAINING_DATA
    + OTHER_TRAINING_DATA
)

