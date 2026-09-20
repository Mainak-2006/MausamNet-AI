import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "classifier.joblib"
VECTORIZER_PATH = ARTIFACT_DIR / "vectorizer.joblib"

try:
    import joblib
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer

    _SKLEARN_AVAILABLE = True
except Exception:  # pragma: no cover
    _SKLEARN_AVAILABLE = False

KEYWORD_RULES = [
    (r"\b(cloudburst|flash flood|flash-flood)\b", "FLASH_FLOOD"),
    (r"\b(flood|flooding|inundat|submerg|waterlog)\b", "FLOOD"),
    (r"\b(heavy rain|torrential|downpour|heavy rainfall)\b", "HEAVY_RAINFALL"),
    (r"\b(thunder|thunderstorm|storm cloud|electrical storm)\b", "THUNDERSTORM"),
    (r"\b(lightning|thunderbolt|struck by lightning)\b", "LIGHTNING"),
    (r"\b(cyclone|typhoon|hurricane|storm surge)\b", "CYCLONE"),
    (r"\b(heatwave|heat wave|scorching heat|record temperature)\b", "HEATWAVE"),
    (r"\b(cold wave|coldwave|bitterly cold|freezing)\b", "COLD_WAVE"),
    (r"\b(dense fog|thick fog|zero visibility)\b", "DENSE_FOG"),
    (r"\b(fog|low visibility|misty)\b", "FOG"),
    (r"\b(dust storm|sandstorm|haboob)\b", "DUST_STORM"),
    (r"\b(strong wind|gale|high wind|gusty winds)\b", "STRONG_WIND"),
    (r"\b(hail|hailstorm|hailstones)\b", "HAILSTORM"),
    (r"\b(snow|snowfall|blizzard|heavy snow)\b", "SNOWFALL"),
    (r"\b(drought|water shortage|dry spell|reservoir empty)\b", "DROUGHT"),
    (r"\b(landslide|landslip|mudslide|slope collapse)\b", "LANDSLIDE"),
    (r"\b(rain|rainfall|shower|drizzle|wet conditions)\b", "RAINFALL"),
]

# Fallback keywords in Hindi, Bengali, Tamil, Telugu, Marathi, Punjabi, Nepali.
# Ordered specific-before-general so e.g. "अचानक बाढ़" is caught before "बाढ़".
MULTILANG_RULES = [
    (r"\b(अचानक बाढ़|হঠাৎ বন্যা|திடீர் வெள்ளம்|ఆకస్మిక వరద|अचानक पूर|ਅਚਾਨਕ ਹੜ੍ਹ|अचानक बाढी)\b", "FLASH_FLOOD"),
    (r"\b(भारी बारिश|मुसलाधार|মুসলধারে|கனமழை|భారీ వర్షం|मुसळधार|ਭਾਰੀ ਬਾਰਸ਼|ভারী বৃষ্টি|भारी वर्षा)\b", "HEAVY_RAINFALL"),
    (r"\b(बाढ़|বন্যা|வெள்ளம்|వరద|పూర్|पूर|ਹੜ੍ਹ|बाढी)\b", "FLOOD"),
    (r"\b(भूस्खलन|ভূমিধস|மண்சரிவு|కొండచరియలు|भूस्खलन|ਜ਼ਮੀਨ ਖਿਸਕਣ|पहिरो)\b", "LANDSLIDE"),
    (r"\b(जलभराव|জলজমাট|நீர் தேக்கம்|నీటి నిల్వ|पाणी साचले|ਪਾਣੀ ਭਰ|पानी जम्मा|நீர் தேங்க|నీళ్లు నిలిచి)\b", "WATERLOGGING"),
    (r"\b(मेघ फटना|মেঘ বিস্ফোরণ|மேக வெடிப்பு|మేఘ విస్ఫోటనం|ढगफुटी|ਬੱਦਲ ਫਟਣਾ|बादल फुट)\b", "CLOUDBURST"),
    (r"\b(घना कोहरा|ঘন কুয়াশা|அடர்ந்த பனிமூட்டம்|దట్టమైన పొగమంచు|दाट धुके|ਸੰਘਣੀ ਧੁੰਦ|घना कुहिरो)\b", "DENSE_FOG"),
    (r"\b(चक्रवात|ঘূর্ণিঝড়|சூறாவளி|తుఫాను|चक्रीवादळ|ਚੱਕਰਵਾਤ)\b", "CYCLONE"),
    (r"\b(लू|তাপপ্রবাহ|வெப்ப அலை|వేడి గాలులు|उष्णतेची लाट|ਗਰਮੀ ਦੀ ਲਹਿਰ|गर्मी लहर)\b", "HEATWAVE"),
    (r"\b(शीत लहर|শৈত্যপ্রবাহ|குளிர் அலை|చలి గాలులు|थंडीची लाट|ਠੰਡ ਦੀ ਲਹਿਰ|जाडो लहर)\b", "COLD_WAVE"),
    (r"\b(आंधी|तूफान|तूफ़ान|ঝড়|புயல்|తుఫాను|वादळ|ਤੂਫਾਨ|ਗਰਜ|गर्जन|आँधी)\b", "THUNDERSTORM"),
    (r"\b(बिजली|বজ্রপাত|বিদ্যুৎ|மின்னல்|మెరుపు|विजा|ਬਿਜਲੀ|चट्याङ|बिजुली)\b", "LIGHTNING"),
    (r"\b(धूल भरी आंधी|ধুলিঝড়|புழுதிப்புயல்|ఇసుక తుఫాను|धुळीचे वादळ|ਧੂੜ ਭਰੀ ਆਂਧੀ|धुलिलो आँधी)\b", "DUST_STORM"),
    (r"\b(तेज हवा|প্রবল বাতাস|பலத்த காற்று|గాలివాన|जोरदार वारे|ਤੇਜ਼ ਹਵਾ|तीव्र हावा)\b", "STRONG_WIND"),
    (r"\b(ओलावृष्टि|শিলাবৃষ্টি|ஆலங்கட்டி|వడగళ్ళు|गारपीट|ਗੜ੍ਹੇਮਾਰੀ|असिना)\b", "HAILSTORM"),
    (r"\b(बर्फबारी|তুষারপাত|பனிப்பொழிவு|మంచు|बर्फवृष्टि|ਬਰਫਬਾਰੀ|हिमपात)\b", "SNOWFALL"),
    (r"\b(सूखा|খরা|வறட்சி|కరువు|दुष्काळ|ਸੋਕਾ|खडेरी)\b", "DROUGHT"),
    (r"\b(कोहरा|কুয়াশা|பனிமூட்டம்|పొగమంచు|धुके|ਧੁੰਦ|कुहिरो)\b", "FOG"),
    (r"\b(बारिश|बरसात|वर्षा|বৃষ্টি|மழை|వర్షం|వాన|पाऊस|ਬਾਰਸ਼|ਮੀਂਹ)\b", "RAINFALL"),
]

KEYWORD_RULES = KEYWORD_RULES + MULTILANG_RULES

FALLBACK_CATEGORY = "OTHER"


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"[!\"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]", " ", text)
    text = re.sub(r"[\x00-\x1f\x7f]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


class WeatherClassifier:
    """Loads a trained sklearn pipeline if present, otherwise falls back to
    deterministic keyword rules so the service always answers."""

    def __init__(self) -> None:
        self.model = None
        self.vectorizer = None
        self.using_model = False
        self._load()

    def _load(self) -> None:
        if not _SKLEARN_AVAILABLE:
            return
        if MODEL_PATH.exists() and VECTORIZER_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                self.vectorizer = joblib.load(VECTORIZER_PATH)
                self.using_model = True
            except Exception:
                self.using_model = False

    def classify(self, text: str) -> dict:
        cleaned = clean_text(text)
        if self.using_model:
            vector = self.vectorizer.transform([cleaned])
            if hasattr(self.model, "predict_proba"):
                proba = self.model.predict_proba(vector)[0]
                idx = int(np.argmax(proba))
                category = self.model.classes_[idx]
                confidence = float(proba[idx])
                return {
                    "category": category,
                    "confidence": round(confidence, 4),
                    "method": "model",
                }
            category = self.model.predict(vector)[0]
            return {"category": category, "confidence": 0.9, "method": "model"}
        return self._keyword(cleaned)

    def _keyword(self, cleaned: str) -> dict:
        for pattern, category in KEYWORD_RULES:
            if re.search(pattern, cleaned):
                return {
                    "category": category,
                    "confidence": 0.65,
                    "method": "keyword",
                }
        return {"category": FALLBACK_CATEGORY, "confidence": 0.4, "method": "keyword"}


classifier = WeatherClassifier()