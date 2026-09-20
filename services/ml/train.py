"""Train the weather-event text classifier across multiple Indian languages.

Generates a labelled synthetic dataset of weather reports in English plus
Hindi, Bengali, Tamil, Telugu, Marathi, Punjabi and Nepali, trains a
word + character n-gram TF-IDF pipeline that works on Indic scripts, reports
metrics and saves:
  services/ml/artifacts/classifier.joblib
  services/ml/artifacts/vectorizer.joblib
"""

import argparse
import csv
import io
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "artifacts"
DATA_DIR = BASE_DIR / "data"
DATASET_CSV = DATA_DIR / "dataset.csv"

LANGUAGES = ["en", "hi", "bn", "ta", "te", "mr", "pa", "ne"]

LANG_CITIES: dict[str, list[str]] = {
    "en": [
        "Siliguri", "Kolkata", "Mumbai", "Delhi", "Chennai", "Bengaluru",
        "Hyderabad", "Ahmedabad", "Pune", "Jaipur", "Bhubaneswar", "Guwahati",
        "Patna", "Lucknow", "Dehradun", "Shimla", "Kochi", "Varanasi", "Nagpur",
    ],
    "hi": ["दिल्ली", "मुंबई", "कोलकाता", "चेन्नई", "बेंगलुरु", "जयपुर", "लखनऊ", "पटना", "भुवनेश्वर", "गुवाहाटी"],
    "bn": ["কলকাতা", "সিলিগুড়ি", "দিল্লি", "মুম্বাই", "গুয়াহাটি", "পাটনা", "ভুবনেশ্বর"],
    "ta": ["சென்னை", "பெங்களூரு", "கோயம்புத்தூர்", "மதுரை", "திருச்சிராப்பள்ளி"],
    "te": ["హైదరాబాద్", "విశాఖపట్నం", "విజయవాడ", "వరంగల్"],
    "mr": ["मुंबई", "पुणे", "नागपूर", "औरंगाबाद", "नाशिक"],
    "pa": ["ਅੰਮ੍ਰਿਤਸਰ", "ਲੁਧਿਆਣਾ", "ਜਲੰਧਰ", "ਪਟਿਆਲਾ"],
    "ne": ["काठमाडौं", "पोखरा", "विराटनगर", "भैरहवा"],
}

# English: (title, optional detail) pairs kept from the original generator.
EN_TEMPLATES: dict[str, list[tuple[str, str]]] = {
    "RAINFALL": [
        ("Light rainfall in {city} this evening", "gentle showers across the city keeping roads damp"),
        ("Steady monsoon rain reported in {city}", "continuous drizzle expected through the night"),
        ("Rainfall observed near {city} outskirts", "light to moderate rain with cloudy skies"),
    ],
    "HEAVY_RAINFALL": [
        ("Heavy rainfall lashes {city}", "torrential downpour caused water splash on roads"),
        ("Torrential rain in {city} overnight", "extreme rainfall intensity recorded"),
        ("Cloudburst-like heavy rain over {city}", "near record rainfall totals in a short window"),
    ],
    "FLOOD": [
        ("Flooding in {city} low lying areas", "scores of homes inundated after the river rose"),
        ("Roads flooded after heavy rain in {city}", "knee deep water disrupted traffic"),
        ("Severe flood situation developing in {city}", "water levels rising across the district"),
    ],
    "FLASH_FLOOD": [
        ("Flash flood hits {city} after cloudburst", "sudden surge of water swept through streets"),
        ("Rapid flash flooding near {city}", "water levels rose within minutes after intense rain"),
        ("Cloudburst triggers flash flood in {city}", "fast moving water trapped vehicles"),
    ],
    "THUNDERSTORM": [
        ("Severe thunderstorm over {city}", "dark clouds with lightning and rumbling"),
        ("Thunderstorm with gusty winds in {city}", "frequent lightning and heavy rain bursts"),
        ("Thunderstorm activity reported at {city}", "stormy conditions with loud thunder"),
    ],
    "LIGHTNING": [
        ("Lightning strikes reported in {city}", "intermittent cloud to ground lightning"),
        ("Multiple lightning incidents near {city}", "volatile weather with frequent strikes"),
        ("Thunderbolts observed over {city}", "continuous lightning flashes overnight"),
    ],
    "CYCLONE": [
        ("Cyclonic storm forming near {city} coast", "storm surge and gales expected"),
        ("Cyclone warning for {city} coast", "very severe intensity winds accompanied by rain"),
        ("Tropical cyclone approaches {city}", "storm surge threat along the shoreline"),
    ],
    "HEATWAVE": [
        ("Heatwave conditions in {city}", "temperatures above 45 celsius for days"),
        ("Scorching heatwave grips {city}", "parched conditions with record highs"),
        ("Extreme heatwave warning for {city}", "oppressive heat and no rain relief"),
    ],
    "COLD_WAVE": [
        ("Cold wave sweeping {city}", "temperatures dropped sharply overnight"),
        ("Bitterly cold conditions in {city}", "freezing mornings with frost"),
        ("Cold wave alert for {city}", "unusually low minimum temperatures"),
    ],
    "FOG": [
        ("Fog patches in {city} morning", "reduced visibility on highways"),
        ("Light fog reported around {city}", "misty conditions at dawn"),
        ("Foggy start to the day in {city}", "visibility down to one hundred metres"),
    ],
    "DENSE_FOG": [
        ("Dense fog shrouds {city}", "visibility below fifty metres across the city"),
        ("Thick fog disrupts travel in {city}", "flights delayed due to zero visibility"),
        ("Extremely dense fog blanket over {city}", "near zero visibility on roads"),
    ],
    "DUST_STORM": [
        ("Dust storm sweeps across {city}", "winds carried thick dust and sand"),
        ("Sandstorm hits {city} region", "visibility dropped sharply with blowing sand"),
        ("Haboob like dust storm near {city}", "massive dust wall moved over the area"),
    ],
    "STRONG_WIND": [
        ("Gusty winds in {city}", "high winds uprooted trees and hoardings"),
        ("Strong wind conditions persist in {city}", "gale force gusts recorded"),
        ("Windy conditions disrupt {city}", "wind speed peaking through the day"),
    ],
    "HAILSTORM": [
        ("Hailstorm damages crops near {city}", "hailstones the size of marbles fell"),
        ("Hail reported in {city} during storm", "pelting hailstones damaged rooftops"),
        ("Sudden hailstorm over {city}", "accumulated hail covered the ground"),
    ],
    "SNOWFALL": [
        ("Snowfall in {city} highlands", "fresh snow blanketed the upper reaches"),
        ("Heavy snowfall reported at {city}", "roads closed after a foot of snow"),
        ("Blizzard conditions near {city}", "strong winds with continuous snow"),
    ],
    "DROUGHT": [
        ("Drought conditions in {city} district", "reservoirs at critical low levels"),
        ("Water shortage worsens in {city}", "dry spell continues for months"),
        ("Drought like situation near {city}", "crops failing due to lack of rain"),
    ],
    "LANDSLIDE": [
        ("Landslide blocks highway near {city}", "debris collapsed onto the road"),
        ("Mudslide reported at {city} hills", "slope gave way after steady rain"),
        ("Landslide cuts off {city} village", "rutted roads buried under earth and rock"),
    ],
    "WATERLOGGING": [
        ("Waterlogging on roads in {city}", "rivers of water flowing on streets"),
        ("Streets waterlogged after rain in {city}", "puddles made commuting difficult"),
        ("Waterlogging reported in {city} market", "shops flooded in low lying area"),
    ],
    "CLOUDBURST": [
        ("Cloudburst over {city} causes havoc", "sudden intense rain overwhelmed drains"),
        ("Cloudburst like event at {city}", "cascades of water in a short time"),
        ("Possible cloudburst reported near {city}", "flash flooding followed immediately"),
    ],
}

# Non-English templates: full sentences per language per category.
INDIC_TEMPLATES: dict[str, dict[str, list[str]]] = {
    "hi": {
        "RAINFALL": ["{city} में हल्की बारिश हो रही है", "शहर में रुकरुक कर बारिश से सड़कें गीली रहीं"],
        "HEAVY_RAINFALL": ["{city} में भारी बारिश से जनजीवन अस्तव्यस्त", "मुसलाधार बारिश ने शहर को भिगो दिया"],
        "FLOOD": ["{city} के निचले इलाकों में बाढ़ आ गई", "बाढ़ का पानी लगातार बढ़ रहा है"],
        "FLASH_FLOOD": ["{city} में अचानक आई बाढ़ ने तबाही मचाई", "तेज बारिश के बाद सड़कों पर अचानक बाढ़ का पानी"],
        "THUNDERSTORM": ["{city} में गरज के साथ आंधी और तूफान", "तेज आंधी के साथ जोरदार बारिश हुई"],
        "LIGHTNING": ["{city} में बिजली गिरने की घटनाएं जारी", "आसमान में बिजली चमकती रही"],
        "CYCLONE": ["चक्रवात {city} के तट के करीब पहुंचा", "चक्रवाती तूफान से तटीय इलाकों में तेज हवाएं"],
        "HEATWAVE": ["{city} में लू चलने से पारा 45 डिग्री के पार", "भीषण गर्मी से लोगों का हाल बेहाल"],
        "COLD_WAVE": ["{city} में शीत लहर से कड़ाके की ठंड", "भीषण ठंड के कारण स्कूल बंद रहे"],
        "FOG": ["{city} में सुबह कोहरा छाया रहा", "कोहरे के कारण दृश्यता कम रही"],
        "DENSE_FOG": ["{city} में घना कोहरा छाया, दृश्यता शून्य के करीब", "घने कोहरे के कारण उड़ानें रद्द"],
        "DUST_STORM": ["{city} में धूल भरी आंधी चली", "आंधी के साथ उड़ी धूल से दृश्यता घटी"],
        "STRONG_WIND": ["{city} में तेज हवाएं चल रही हैं", "तेज हवाओं के कारण पेड़ गिर गए"],
        "HAILSTORM": ["{city} में ओलावृष्टि से फसलों को नुकसान", "ओलों की बारिश से छतों को नुकसान"],
        "SNOWFALL": ["{city} के ऊंचाई वाले इलाकों में बर्फबारी", "पहाड़ों पर बर्फ गिरने से ठंड बढ़ी"],
        "DROUGHT": ["{city} जिले में सूखे जैसे हालात", "बारिश न होने से सूखा पड़ गया"],
        "LANDSLIDE": ["{city} के पास भूस्खलन से पहाड़ी रास्ता बंद", "भूस्खलन से गांव का संपर्क टूटा"],
        "WATERLOGGING": ["{city} की सड़कों पर जलभराव", "बारिश के बाद सड़कों पर पानी जमा हो गया"],
        "CLOUDBURST": ["{city} में मेघ फटने से भारी तबाही", "मेघ फटने जैसी बारिश से नाले उफन गए"],
    },
    "bn": {
        "RAINFALL": ["{city} তে হালকা বৃষ্টি হচ্ছে", "মাঝে মাঝে বৃষ্টিতে রাস্তা ভিজে গেছে"],
        "HEAVY_RAINFALL": ["{city} তে ভারী বৃষ্টিতে জনজীবন বিপর্যস্ত", "সারারাত মুষলধারে বৃষ্টি হয়েছে"],
        "FLOOD": ["{city} এর নিচু এলাকায় বন্যা হয়েছে", "বন্যার জল ক্রমাগত বাড়ছে"],
        "FLASH_FLOOD": ["{city} এ হঠাৎ বন্যা হয়ে বিপর্যয়", "প্রবল বৃষ্টির পর রাস্তায় হঠাৎ বন্যার জল"],
        "THUNDERSTORM": ["{city} এ বজ্রসহ ঝড় বৃষ্টি হয়েছে", "জোরে বজ্রপাতসহ ঝড় বইছে"],
        "LIGHTNING": ["{city} এ বজ্রপাতের ঘটনা চলছে", "আকাশে বিদ্যুৎ চমকাতে দেখা গেছে"],
        "CYCLONE": ["ঘূর্ণিঝড় {city} উপকূলের কাছে পৌঁছেছে", "ঘূর্ণিঝড়ের প্রভাবে উপকূলে প্রবল বাতাস"],
        "HEATWAVE": ["{city} তে তাপপ্রবাহে তাপমাত্রা ৪৫ ছাড়াল", "প্রচণ্ড গরমে জনজীবন দুর্বিষহ"],
        "COLD_WAVE": ["{city} তে শৈত্যপ্রবাহে তীব্র শীত", "প্রচণ্ড ঠান্ডায় স্কুল বন্ধ রয়েছে"],
        "FOG": ["{city} তে সকালে কুয়াশা ছড়িয়ে ছিল", "কুয়াশার কারণে দৃশ্যমানতা কম ছিল"],
        "DENSE_FOG": ["{city} তে ঘন কুয়াশা, দৃশ্যমানতা প্রায় শূন্য", "ঘন কুয়াশায় ফ্লাইট বাতিল হয়েছে"],
        "DUST_STORM": ["{city} তে ধুলিঝড় বইছে", "ধুলিঝড়ের কারণে দৃশ্যমানতা কমেছে"],
        "STRONG_WIND": ["{city} তে প্রবল বাতাস বইছে", "প্রবল বাতাসে গাছ উপড়ে গেছে"],
        "HAILSTORM": ["{city} তে শিলাবৃষ্টিতে ফসলের ক্ষতি", "শিলাবৃষ্টিতে ঘরবাড়ির ক্ষতি হয়েছে"],
        "SNOWFALL": ["{city} এর উচ্চ এলাকায় তুষারপাত", "পাহাড়ে তুষারপাতে শীত বেড়েছে"],
        "DROUGHT": ["{city} জেলায় খরার মতো পরিস্থিতি", "বৃষ্টির অভাবে খরা দেখা দিয়েছে"],
        "LANDSLIDE": ["{city} এর কাছে ভূমিধসে রাস্তা বন্ধ", "ভূমিধসে গ্রামের যোগাযোগ বিচ্ছিন্ন"],
        "WATERLOGGING": ["{city} এর রাস্তায় জলজমাট", "বৃষ্টির পর রাস্তায় জল জমে আছে"],
        "CLOUDBURST": ["{city} তে মেঘ বিস্ফোরণে ক্ষয়ক্ষতি", "মেঘ বিস্ফোরণের মতো বৃষ্টিতে নর্দমা উপচে পড়েছে"],
    },
    "ta": {
        "RAINFALL": ["{city} ல் லேசான மழை பெய்கிறது", "இடைவிடாமல் மழை பெய்து சாலைகள் நனைந்தன"],
        "HEAVY_RAINFALL": ["{city} ல் கனமழை பெய்தது", "பலத்த மழையால் நகரம் பாதிப்படைந்தது"],
        "FLOOD": ["{city} ல் தாழ்வான பகுதிகளில் வெள்ளம்", "வெள்ள நீர் தொடர்ந்து அதிகரித்து வருகிறது"],
        "FLASH_FLOOD": ["{city} ல் திடீர் வெள்ளம் பேரழிவை ஏற்படுத்தியது", "கனமழைக்கு பிறகு திடீர் வெள்ளம் புகுந்தது"],
        "THUNDERSTORM": ["{city} ல் இடியுடன் கூடிய மழையும் புயலும்", "பலத்த இடிமுழக்கத்துடன் மழை பெய்தது"],
        "LIGHTNING": ["{city} ல் மின்னல் தாக்குதல்கள் பதிவாயின", "வானத்தில் மின்னல் மின்னியது"],
        "CYCLONE": ["சூறாவளி {city} கடற்கரையை நெருங்குகிறது", "புயல் எச்சரிக்கை விடுக்கப்பட்டது"],
        "HEATWAVE": ["{city} ல் வெப்ப அலை வீசுகிறது", "கடும் வெயிலால் மக்கள் அவதியடைந்தனர்"],
        "COLD_WAVE": ["{city} ல் குளிர் அலை வீசுகிறது", "கடும் குளிரால் பள்ளிகள் மூடப்பட்டன"],
        "FOG": ["{city} ல் காலையில் பனிமூட்டம்", "பனிமூட்டத்தால் சாலை தெரிவுநிலை குறைந்தது"],
        "DENSE_FOG": ["{city} ல் அடர்ந்த பனிமூட்டம், தெரிவுநிலை கிட்டத்தட்ட இல்லை", "அடர்ந்த பனிமூட்டத்தால் விமானங்கள் ரத்து"],
        "DUST_STORM": ["{city} ல் புழுதிப்புயல் வீசியது", "புழுதியால் தெரிவுநிலை குறைந்தது"],
        "STRONG_WIND": ["{city} ல் பலத்த காற்று வீசுகிறது", "பலத்த காற்றில் மரங்கள் சாய்ந்தன"],
        "HAILSTORM": ["{city} ல் ஆலங்கட்டி மழையால் பயிர்கள் சேதம்", "ஆலங்கட்டி மழையால் வீடுகள் சேதமடைந்தன"],
        "SNOWFALL": ["{city} ல் மலைப்பகுதிகளில் பனிப்பொழிவு", "மலைகளில் பனி பெய்து விட்டது"],
        "DROUGHT": ["{city} மாவட்டத்தில் வறட்சி நிலை", "மழை இல்லாததால் வறட்சி ஏற்பட்டது"],
        "LANDSLIDE": ["{city} அருகே மண்சரிவில் சாலை மூடப்பட்டது", "மண்சரிவில் கிராமத்தின் தொடர்பு துண்டிக்கப்பட்டது"],
        "WATERLOGGING": ["{city} ல் சாலைகளில் நீர் தேக்கம்", "மழைக்குப் பிறகு சாலைகளில் தண்ணீர் தேங்கியது"],
        "CLOUDBURST": ["{city} ல் மேக வெடிப்பு பாதிப்பு", "மேக வெடிப்பு போன்ற மழையில் வடிகால்கள் நிரம்பின"],
    },
    "te": {
        "RAINFALL": ["{city} లో తేలికపాటి వర్షం కురుస్తోంది", "ఎడతెరిపి లేకుండా వర్షం పడి రోడ్లు తడిశాయి"],
        "HEAVY_RAINFALL": ["{city} లో భారీ వర్షం కురిసింది", "కురిసిన భారీ వర్షంతో నగరం అతలాకుతలమైంది"],
        "FLOOD": ["{city} లో పల్ల ప్రాంతాల్లో వరదలు", "వరద నీరు నిరంతరం పెరుగుతోంది"],
        "FLASH_FLOOD": ["{city} లో ఆకస్మిక వరదలు విధ్వంసం", "భారీ వర్షం తర్వాత ఆకస్మిక వరదలు వచ్చాయి"],
        "THUNDERSTORM": ["{city} లో ఉరుముతో కూడిన తుఫాను", "ఉరుములు మెరుపులతో వర్షం కురిసింది"],
        "LIGHTNING": ["{city} లో మెరుపు దాడి సంఘటనలు", "ఆకాశంలో మెరుపులు మెరిశాయి"],
        "CYCLONE": ["తుఫాను {city} తీరం వైపు దూసుకుపోతోంది", "తుఫాను హెచ్చరిక జారీ చేశారు"],
        "HEATWAVE": ["{city} లో వేడి గాలులు వీస్తున్నాయి", "తీవ్ర ఉక్కతో ప్రజలు ఇబ్బందుల్లో"],
        "COLD_WAVE": ["{city} లో చలి గాలులు వీస్తున్నాయి", "తీవ్రమైన చలితో పాఠశాలలు మూసివేశారు"],
        "FOG": ["{city} లో ఉదయం పొగమంచు", "పొగమంచు వల్ల రహదారి దృశ్యం తగ్గింది"],
        "DENSE_FOG": ["{city} లో దట్టమైన పొగమంచు, దృశ్యం దాదాపు లేదు", "దట్టమైన పొగమంచుతో విమానాలు రద్దు"],
        "DUST_STORM": ["{city} లో ఇసుక తుఫాను వీచింది", "ధూళి వల్ల దృశ్యం తగ్గింది"],
        "STRONG_WIND": ["{city} లో గాలివాన వీస్తోంది", "బలమైన ఈదురు గాలులతో చెట్లు కూలాయి"],
        "HAILSTORM": ["{city} లో వడగళ్ళ వానతో పంటలు దెబ్బతిన్నాయి", "వడగళ్ళ వానతో ఇళ్లు దెబ్బతిన్నాయి"],
        "SNOWFALL": ["{city} లో కొండ ప్రాంతాల్లో మంచు కురుస్తోంది", "కొండల్లో మంచు కురిసింది"],
        "DROUGHT": ["{city} జిల్లాలో కరువు పరిస్థితి", "వర్షాలు లేక కరువు ఏర్పడింది"],
        "LANDSLIDE": ["{city} సమీపంలో కొండచరియలు విరిగి రహదారి మూసుకుపోయింది", "కొండచరియలు విరగడంతో గ్రామ సంబంధాలు తెగిపోయాయి"],
        "WATERLOGGING": ["{city} లో రోడ్లపై నీరు నిలిచి ఉంది", "వర్షం తర్వాత రోడ్లపై నీళ్లు నిలిచాయి"],
        "CLOUDBURST": ["{city} లో మేఘ విస్ఫోటనం నష్టం", "మేఘ విస్ఫోటనం లాంటి వర్షంతో డ్రైన్లు పొంగిపోయాయి"],
    },
    "mr": {
        "RAINFALL": ["{city} मध्ये हल्का पाऊस सुरू आहे", "शहरात अधूनमधून पाऊस पडून रस्ते ओले आहेत"],
        "HEAVY_RAINFALL": ["{city} मध्ये मुसळधार पाऊस", "सतत पडणाऱ्या मुसळधार पावसाने नागरिक हैराण"],
        "FLOOD": ["{city} च्या खालच्या भागात पूर आला", "पूराचे पाणी सतत वाढत आहे"],
        "FLASH_FLOOD": ["{city} मध्ये अचानक आलेल्या पुराने थैमान घातले", "जोरदार पावसानंतर रस्त्यांवर अचानक पूर आला"],
        "THUNDERSTORM": ["{city} मध्ये मेघगर्जनेसह वादळ आले", "गडगडाटासह जोरदार पाऊस झाला"],
        "LIGHTNING": ["{city} मध्ये विजेच्या कडकडाटाच्या घटना", "आकाशात विजा चमकत राहिल्या"],
        "CYCLONE": ["चक्रीवादळ {city} किनाऱ्याजवळ पोहोचले", "चक्रीवादळाचा इशारा देण्यात आला"],
        "HEATWAVE": ["{city} मध्ये उष्णतेची लाट", "कडकडीत उन्हाने नागरिक हैराण"],
        "COLD_WAVE": ["{city} मध्ये थंडीची लाट", "कडाक्याच्या थंडीमुळे शाळा बंद राहिल्या"],
        "FOG": ["{city} मध्ये सकाळी धुके पडले", "धुक्यामुळे दृश्यमानता कमी झाली"],
        "DENSE_FOG": ["{city} मध्ये दाट धुके, दृश्यमानता जवळजवळ शून्य", "दाट धुक्यामुळे विमानसेवा रद्द"],
        "DUST_STORM": ["{city} मध्ये धुळीचे वादळ आले", "धुळीमुळे दृश्यमानता कमी झाली"],
        "STRONG_WIND": ["{city} मध्ये जोरदार वारे वाहत आहेत", "जोरदार वाऱ्याने झाडे उन्मळून पडली"],
        "HAILSTORM": ["{city} मध्ये गारपीटीने पिकांचे नुकसान", "गारपीटीने घरांचे नुकसान झाले"],
        "SNOWFALL": ["{city} च्या उंच भागात बर्फवृष्टी", "डोंगरात बर्फवृष्टी होऊन शीत वाढली"],
        "DROUGHT": ["{city} जिल्ह्यात दुष्काळसदृश स्थिती", "पाऊस न पडल्याने दुष्काळाची स्थिती"],
        "LANDSLIDE": ["{city} जवळ भूस्खलनामुळे रस्ता बंद", "भूस्खलनामुळे गावाचा संपर्क तुटला"],
        "WATERLOGGING": ["{city} च्या रस्त्यांवर पाणी साचले", "पावसानंतर रस्त्यांवर तळी राहिली"],
        "CLOUDBURST": ["{city} मध्ये ढगफुटीमुळे नुकसान", "ढगफुटीसारख्या पावसाने नाले उफाळले"],
    },
    "pa": {
        "RAINFALL": ["{city} ਵਿੱਚ ਹਲਕੀ ਬਾਰਸ਼ ਹੋ ਰਹੀ ਹੈ", "ਰੁਕਰੁਕ ਕੇ ਹੋ ਰਹੀ ਬਾਰਸ਼ ਨਾਲ ਸੜਕਾਂ ਗਿੱਲੀਆਂ ਹਨ"],
        "HEAVY_RAINFALL": ["{city} ਵਿੱਚ ਭਾਰੀ ਬਾਰਸ਼", "ਮੌਸਮ ਮੁਤਾਬਕ ਭਾਰੀ ਮੀਂਹ ਪਿਆ"],
        "FLOOD": ["{city} ਦੇ ਹੇਠਲੇ ਇਲਾਕਿਆਂ ਵਿੱਚ ਹੜ੍ਹ", "ਹੜ੍ਹ ਦਾ ਪਾਣੀ ਲਗਾਤਾਰ ਵਧ ਰਿਹਾ ਹੈ"],
        "FLASH_FLOOD": ["{city} ਵਿੱਚ ਅਚਾਨਕ ਹੜ੍ਹ ਨੇ ਤਬਾਹੀ ਮਚਾਈ", "ਭਾਰੀ ਮੀਂਹ ਤੋਂ ਬਾਅਦ ਸੜਕਾਂ 'ਤੇ ਪਾਣੀ ਭਰ ਗਿਆ"],
        "THUNDERSTORM": ["{city} ਵਿੱਚ ਗਰਜ ਨਾਲ ਤੂਫਾਨ ਆਇਆ", "ਗਰਜ ਅਤੇ ਤੇਜ਼ ਮੀਂਹ ਨਾਲ ਤੂਫਾਨ ਆਇਆ"],
        "LIGHTNING": ["{city} ਵਿੱਚ ਬਿਜਲੀ ਡਿੱਗਣ ਦੀਆਂ ਘਟਨਾਵਾਂ", "ਅਸਮਾਨ ਵਿੱਚ ਬਿਜਲੀ ਚਮਕਦੀ ਰਹੀ"],
        "CYCLONE": ["ਚੱਕਰਵਾਤ {city} ਦੇ ਤੱਟ ਦੇ ਨੇੜੇ ਪਹੁੰਚ ਗਿਆ", "ਚੱਕਰਵਾਤ ਦੀ ਚੇਤਾਵਨੀ ਜਾਰੀ ਕੀਤੀ ਗਈ"],
        "HEATWAVE": ["{city} ਵਿੱਚ ਲੂ ਚੱਲ ਰਹੀ ਹੈ", "ਤੇਜ਼ ਗਰਮੀ ਨਾਲ ਲੋਕ ਪ੍ਰੇਸ਼ਾਨ ਹਨ"],
        "COLD_WAVE": ["{city} ਵਿੱਚ ਠੰਡ ਦੀ ਲਹਿਰ", "ਸਖ਼ਤ ਠੰਡ ਕਾਰਨ ਸਕੂਲ ਬੰਦ ਰਹੇ"],
        "FOG": ["{city} ਵਿੱਚ ਸਵੇਰੇ ਧੁੰਦ ਛਾਈ", "ਧੁੰਦ ਕਾਰਨ ਨਜ਼ਰ ਕਮਜ਼ੋਰ ਰਹੀ"],
        "DENSE_FOG": ["{city} ਵਿੱਚ ਸੰਘਣੀ ਧੁੰਦ, ਨਜ਼ਰ ਲਗਭਗ ਨਾ ਦੇ ਬਰਾਬਰ", "ਸੰਘਣੀ ਧੁੰਦ ਕਾਰਨ ਉਡਾਣਾਂ ਰੱਦ"],
        "DUST_STORM": ["{city} ਵਿੱਚ ਧੂੜ ਭਰੀ ਆਂਧੀ ਚੱਲੀ", "ਧੂੜ ਕਾਰਨ ਨਜ਼ਰ ਘਟ ਗਈ"],
        "STRONG_WIND": ["{city} ਵਿੱਚ ਤੇਜ਼ ਹਵਾਵਾਂ ਚੱਲ ਰਹੀਆਂ ਹਨ", "ਤੇਜ਼ ਹਵਾਵਾਂ ਕਾਰਨ ਦਰੱਖਤ ਡਿੱਗੇ"],
        "HAILSTORM": ["{city} ਵਿੱਚ ਗੜ੍ਹੇਮਾਰੀ ਨਾਲ ਫਸਲਾਂ ਨੂੰ ਨੁਕਸਾਨ", "ਗੜ੍ਹੇਮਾਰੀ ਕਾਰਨ ਘਰਾਂ ਨੂੰ ਨੁਕਸਾਨ ਹੋਇਆ"],
        "SNOWFALL": ["{city} ਦੇ ਉੱਚੇ ਇਲਾਕਿਆਂ ਵਿੱਚ ਬਰਫਬਾਰੀ", "ਪਹਾੜਾਂ 'ਤੇ ਬਰਫ ਪੈਣ ਨਾਲ ਠੰਡ ਵਧੀ"],
        "DROUGHT": ["{city} ਜ਼ਿਲ੍ਹੇ ਵਿੱਚ ਸੋਕੇ ਵਰਗੀ ਸਥਿਤੀ", "ਬਾਰਸ਼ ਨਾ ਹੋਣ ਕਾਰਨ ਸੋਕਾ ਪੈ ਗਿਆ"],
        "LANDSLIDE": ["{city} ਨੇੜੇ ਜ਼ਮੀਨ ਖਿਸਕਣ ਕਾਰਨ ਸੜਕ ਬੰਦ", "ਜ਼ਮੀਨ ਖਿਸਕਣ ਨਾਲ ਪਿੰਡ ਦਾ ਸੰਪਰਕ ਟੁੱਟਿਆ"],
        "WATERLOGGING": ["{city} ਦੀਆਂ ਸੜਕਾਂ 'ਤੇ ਪਾਣੀ ਭਰ ਗਿਆ", "ਮੀਂਹ ਤੋਂ ਬਾਅਦ ਸੜਕਾਂ 'ਤੇ ਪਾਣੀ ਖੜ੍ਹਾ ਹੋ ਗਿਆ"],
        "CLOUDBURST": ["{city} ਵਿੱਚ ਬੱਦਲ ਫਟਣ ਕਾਰਨ ਨੁਕਸਾਨ", "ਬੱਦਲ ਫਟਣ ਵਰਗੇ ਮੀਂਹ ਕਾਰਨ ਨਾਲੇ ਉਭੜ ਗਏ"],
    },
    "ne": {
        "RAINFALL": ["{city} मा हल्का पानी परिरहेको छ", "रुकरुक पानी परेर सडकहरु भिजेका छन्"],
        "HEAVY_RAINFALL": ["{city} मा भारी वर्षा भइरहेको छ", "मुसलधारे वर्षाले नगर प्रभावित भएको छ"],
        "FLOOD": ["{city} को तल्लो क्षेत्रमा बाढी आयो", "बाढीको पानी निरन्तर बढ्दै गएको छ"],
        "FLASH_FLOOD": ["{city} मा अचानक आएको बाढीले क्षति पुर्‍यायो", "भारी वर्षापछि सडकमा अचानक बाढी आयो"],
        "THUNDERSTORM": ["{city} मा आँधीसहित वर्षा भयो", "ठूलो गर्जनका साथ पानी परिरहेको छ"],
        "LIGHTNING": ["{city} मा चट्याङ परेका घटनाहरु", "आकाशमा बिजुली चम्किरहेको छ"],
        "CYCLONE": ["चक्रवात {city} तट नजिक पुगेको छ", "चक्रवातको चेतावनी जारी गरियो"],
        "HEATWAVE": ["{city} मा गर्मी लहर चलिरहेको छ", "अत्यधिक गर्मीले जनजीवन प्रभावित"],
        "COLD_WAVE": ["{city} मा जाडो लहर चलिरहेको छ", "अत्यधिक चिसोका कारण विद्यालय बन्द"],
        "FOG": ["{city} मा बिहान कुहिरो लाग्यो", "कुहिरोका कारण दृश्यता घट्यो"],
        "DENSE_FOG": ["{city} मा घना कुहिरो, दृश्यता लगभग शून्य", "घना कुहिरोका कारण उडान रद्द भयो"],
        "DUST_STORM": ["{city} मा धुलिलो आँधी चल्यो", "आँधीका कारण दृश्यता घट्यो"],
        "STRONG_WIND": ["{city} मा तीव्र हावा चलिरहेको छ", "तीव्र हावाले रुख ढलायो"],
        "HAILSTORM": ["{city} मा असिना परेर बालीनाली क्षति", "असिनाले घरहरुमा क्षति पुर्‍यायो"],
        "SNOWFALL": ["{city} को उच्च भागमा हिमपात", "हिमालमा हिमपात भएपछि चिसो बढ्यो"],
        "DROUGHT": ["{city} जिल्लामा खडेरीको अवस्था", "पानी नपरेपछि खडेरी पर्यो"],
        "LANDSLIDE": ["{city} नजिक पहिरोले सडक बन्द", "पहिरोले गाउँको सम्पर्क टुट्यो"],
        "WATERLOGGING": ["{city} का सडकमा पानी जम्मा भयो", "वर्षापछि सडकमा पानी जम्मा भयो"],
        "CLOUDBURST": ["{city} मा बादल फुटेर क्षति", "बादल फुटेजस्तो वर्षाले नहर भरिए"],
    },
}


def _english_sentences() -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for category, pairs in EN_TEMPLATES.items():
        sentences = []
        for title, desc in pairs:
            sentences.append(title)
            sentences.append(f"{title}, {desc}")
        out[category] = sentences
    return out


def build_dataset(samples_per_language: int = 12) -> str:
    rng = random.Random(42)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["category", "language", "text"])

    en_sentences = _english_sentences()
    for category, templates in en_sentences.items():
        for _ in range(samples_per_language):
            tpl = rng.choice(templates)
            city = rng.choice(LANG_CITIES["en"])
            writer.writerow([category, "en", tpl.format(city=city)])

    for lang in ("hi", "bn", "ta", "te", "mr", "pa", "ne"):
        cities = LANG_CITIES[lang]
        for category, templates in INDIC_TEMPLATES[lang].items():
            for _ in range(samples_per_language):
                tpl = rng.choice(templates)
                text = tpl.format(city=rng.choice(cities))
                writer.writerow([category, lang, text])
    return buf.getvalue()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples", type=int, default=12,
                        help="synthetic samples per category per language")
    args = parser.parse_args()

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import accuracy_score, classification_report
        from sklearn.model_selection import train_test_split
        from sklearn.pipeline import FeatureUnion
        import joblib
        import pandas as pd
    except ImportError as exc:
        print(f"Scikit-learn / pandas not installed: {exc}")
        print("Install requirements with: pip install -r requirements.txt")
        return

    DATA_DIR.mkdir(exist_ok=True)
    ARTIFACT_DIR.mkdir(exist_ok=True)
    DATASET_CSV.write_text(build_dataset(args.samples), encoding="utf-8")
    print(f"Wrote synthetic multilingual dataset -> {DATASET_CSV}")

    df = pd.read_csv(DATASET_CSV)
    df = df[(df["text"].notna()) & (df["text"].str.len() > 5)]
    print(f"Loaded {len(df)} samples across {len(df['category'].unique())} categories "
          f"and {len(df['language'].unique())} languages")

    # Word TF-IDF splits on whitespace so it works for scripts with combining
    # marks (Devanagari, Bengali, Gurmukhi, Tamil, Telugu). Char n-grams capture
    # Indic morphology/agglutination. English stop words are kept: dropping them
    # would be wrong for the other seven languages.
    # \S+ keeps Indic words whole (their combining marks break the default
    # \b\w\w+\b pattern) and is a plain string so joblib can pickle it.
    word_tfidf = TfidfVectorizer(
        lowercase=True, token_pattern=r"\S+",
        ngram_range=(1, 2), sublinear_tf=True, max_features=25000,
    )
    char_tfidf = TfidfVectorizer(
        lowercase=True, analyzer="char_wb", ngram_range=(2, 5),
        min_df=2, sublinear_tf=True, max_features=25000,
    )
    vectorizer = FeatureUnion([("word", word_tfidf), ("char", char_tfidf)])

    X_train, X_test, y_train, y_test = train_test_split(
        df["text"], df["category"], test_size=0.2, random_state=42,
        stratify=df["category"],
    )
    model = LogisticRegression(max_iter=1000, C=1.5)
    X_train_vec = vectorizer.fit_transform(X_train)
    model.fit(X_train_vec, y_train)

    preds = model.predict(vectorizer.transform(X_test))
    print(
        f"\nTest accuracy: {accuracy_score(y_test, preds):.3f}\n"
        f"{classification_report(y_test, preds)}"
    )

    test_df = df.loc[X_test.index]
    for lang in sorted(test_df["language"].unique()):
        mask = test_df["language"] == lang
        lang_acc = accuracy_score(test_df.loc[mask, "category"], preds[mask])
        print(f"  [{lang}] accuracy: {lang_acc:.3f}  (n={mask.sum()})")

    joblib.dump(model, ARTIFACT_DIR / "classifier.joblib")
    joblib.dump(vectorizer, ARTIFACT_DIR / "vectorizer.joblib")
    print("Saved artifacts:\n  ", ARTIFACT_DIR / "classifier.joblib",
          "\n  ", ARTIFACT_DIR / "vectorizer.joblib")


if __name__ == "__main__":
    main()