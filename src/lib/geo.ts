// Shared country + nationality lists for form selects, so members choose from a
// canonical list instead of free-typing (keeps duty-station search and profiles
// consistent). Ordered alphabetically.

export const COUNTRIES: string[] = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina",
  "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia",
  "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China",
  "Colombia", "Comoros", "Congo (Brazzaville)", "Congo (Kinshasa)", "Costa Rica", "Croatia",
  "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
  "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives",
  "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
  "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
  "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
]

export const NATIONALITIES: string[] = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentine",
  "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi",
  "Barbadian", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian",
  "Bosnian", "Botswanan", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe",
  "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Chadian",
  "Chilean", "Chinese", "Colombian", "Comorian", "Congolese", "Costa Rican", "Croatian",
  "Cuban", "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican", "Dutch", "Ecuadorian",
  "Egyptian", "Emirati", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian", "Fijian",
  "Filipino", "Finnish", "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian",
  "Greek", "Grenadian", "Guatemalan", "Guinean", "Guyanese", "Haitian", "Honduran",
  "Hungarian", "Icelandic", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli",
  "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakh", "Kenyan", "Kosovar",
  "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner",
  "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivian",
  "Malian", "Maltese", "Mauritanian", "Mauritian", "Mexican", "Moldovan", "Monegasque",
  "Mongolian", "Montenegrin", "Moroccan", "Mozambican", "Namibian", "Nepali", "New Zealander",
  "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "Norwegian", "Omani", "Pakistani",
  "Palauan", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian",
  "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian",
  "Salvadoran", "Samoan", "Saudi", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean",
  "Singaporean", "Slovak", "Slovenian", "Somali", "South African", "South Korean",
  "South Sudanese", "Spanish", "Sri Lankan", "Sudanese", "Surinamese", "Swazi", "Swedish",
  "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Timorese", "Togolese",
  "Tongan", "Trinidadian", "Tunisian", "Turkish", "Turkmen", "Tuvaluan", "Ugandan",
  "Ukrainian", "Uruguayan", "Uzbek", "Vanuatuan", "Venezuelan", "Vietnamese", "Yemeni",
  "Zambian", "Zimbabwean",
]

// Major cities and UN / international-organisation duty stations, for the
// searchable city picker. The biggest hubs lead so they show first before any
// typing; any other city can still be entered freely.
export const CITIES: string[] = [
  "Geneva", "New York", "Nairobi", "Vienna", "Rome", "Bangkok", "Addis Ababa",
  "Copenhagen", "Bonn", "The Hague", "Brussels", "Paris", "London", "Washington D.C.",
  "Amman", "Beirut", "Cairo", "Tunis", "Rabat", "Dakar", "Abidjan", "Accra", "Abuja",
  "Dar es Salaam", "Kampala", "Kigali", "Kinshasa", "Juba", "Khartoum", "Mogadishu",
  "Pretoria", "Johannesburg", "Panama City", "Santiago", "Bogotá", "Lima", "Quito",
  "Mexico City", "Guatemala City", "Port-au-Prince", "Buenos Aires", "Brasília",
  "Kathmandu", "Islamabad", "New Delhi", "Dhaka", "Colombo", "Jakarta",
  "Manila", "Hanoi", "Phnom Penh", "Yangon", "Ulaanbaatar", "Beijing", "Tokyo", "Seoul",
  "Suva", "Kabul", "Baghdad", "Damascus", "Sanaa", "Tehran", "Istanbul", "Ankara",
  "Kyiv", "Sarajevo", "Belgrade", "Pristina", "Tbilisi", "Tashkent", "Almaty",
  "Madrid", "Berlin", "Turin", "Budapest", "Warsaw", "Stockholm", "Oslo", "Helsinki",
]

// Demand tiers for the nightly points valuation (HomeExchange-style: location
// influences a home's value). Tier 1 = highest-demand cities, tier 2 = major
// duty stations / capitals, everything else is tier 3 (no location bonus).
export const CITY_TIER1: string[] = [
  "Geneva", "New York", "London", "Paris", "Rome", "Vienna", "Washington D.C.",
  "Copenhagen", "Brussels", "Madrid", "Berlin", "Tokyo", "Singapore", "Istanbul",
]
export const CITY_TIER2: string[] = [
  "Nairobi", "Bangkok", "Addis Ababa", "Bonn", "The Hague", "Amman", "Beirut",
  "Cairo", "Tunis", "Rabat", "Dakar", "Accra", "Abuja", "Johannesburg", "Pretoria",
  "Panama City", "Santiago", "Bogotá", "Mexico City", "Buenos Aires", "Lima", "Quito",
  "Kathmandu", "New Delhi", "Dhaka", "Colombo", "Jakarta", "Manila", "Hanoi", "Seoul",
  "Beijing", "Ankara", "Kyiv", "Budapest", "Warsaw", "Stockholm", "Oslo", "Helsinki",
]

// City-centre coordinates [lng, lat] for the duty-station set, used only to plot
// CITY-level pins on the map. Deliberately city-centre, never a home's real
// location — map precision stays at the city, matching the privacy model.
export const CITY_COORDS: Record<string, [number, number]> = {
  "Geneva": [6.1432, 46.2044], "New York": [-74.006, 40.7128], "Nairobi": [36.8219, -1.2921],
  "Vienna": [16.3738, 48.2082], "Rome": [12.4964, 41.9028], "Bangkok": [100.5018, 13.7563],
  "Addis Ababa": [38.7469, 9.03], "Copenhagen": [12.5683, 55.6761], "Bonn": [7.0982, 50.7374],
  "The Hague": [4.3007, 52.0705], "Brussels": [4.3517, 50.8503], "Paris": [2.3522, 48.8566],
  "London": [-0.1276, 51.5072], "Washington D.C.": [-77.0369, 38.9072], "Amman": [35.9106, 31.9539],
  "Beirut": [35.5018, 33.8938], "Cairo": [31.2357, 30.0444], "Tunis": [10.1815, 36.8065],
  "Rabat": [-6.8498, 34.0209], "Dakar": [-17.4677, 14.7167], "Abidjan": [-4.0083, 5.36],
  "Accra": [-0.187, 5.6037], "Abuja": [7.4951, 9.0765], "Dar es Salaam": [39.2083, -6.7924],
  "Kampala": [32.5825, 0.3476], "Kigali": [30.0619, -1.9441], "Kinshasa": [15.2663, -4.4419],
  "Juba": [31.5825, 4.8594], "Khartoum": [32.5599, 15.5007], "Mogadishu": [45.3182, 2.0469],
  "Pretoria": [28.1881, -25.7479], "Johannesburg": [28.0473, -26.2041], "Panama City": [-79.5199, 8.9824],
  "Santiago": [-70.6693, -33.4489], "Bogotá": [-74.0721, 4.711], "Lima": [-77.0428, -12.0464],
  "Quito": [-78.4678, -0.1807], "Mexico City": [-99.1332, 19.4326], "Guatemala City": [-90.5069, 14.6349],
  "Port-au-Prince": [-72.3074, 18.5944], "Buenos Aires": [-58.3816, -34.6037], "Brasília": [-47.8825, -15.7942],
  "Kathmandu": [85.324, 27.7172], "Islamabad": [73.0479, 33.6844], "New Delhi": [77.209, 28.6139],
  "Dhaka": [90.4125, 23.8103], "Colombo": [79.8612, 6.9271], "Jakarta": [106.8456, -6.2088],
  "Manila": [120.9842, 14.5995], "Hanoi": [105.8342, 21.0278], "Phnom Penh": [104.916, 11.5564],
  "Yangon": [96.1951, 16.8409], "Ulaanbaatar": [106.9057, 47.8864], "Beijing": [116.4074, 39.9042],
  "Tokyo": [139.6917, 35.6895], "Seoul": [126.978, 37.5665], "Suva": [178.4419, -18.1416],
  "Kabul": [69.2075, 34.5553], "Baghdad": [44.3661, 33.3152], "Damascus": [36.2765, 33.5138],
  "Sanaa": [44.2067, 15.3694], "Tehran": [51.389, 35.6892], "Istanbul": [28.9784, 41.0082],
  "Ankara": [32.8597, 39.9334], "Kyiv": [30.5234, 50.4501], "Sarajevo": [18.4131, 43.8563],
  "Belgrade": [20.4489, 44.7866], "Pristina": [21.1655, 42.6629], "Tbilisi": [44.8271, 41.7151],
  "Tashkent": [69.2401, 41.2995], "Almaty": [76.8512, 43.222], "Madrid": [-3.7038, 40.4168],
  "Berlin": [13.405, 52.52], "Turin": [7.6869, 45.0703], "Budapest": [19.0402, 47.4979],
  "Warsaw": [21.0122, 52.2297], "Stockholm": [18.0686, 59.3293], "Oslo": [10.7522, 59.9139],
  "Helsinki": [24.9384, 60.1699], "Singapore": [103.8198, 1.3521],
}

/** Case-insensitive city-centre lookup; null when the city isn't in the set. */
export function cityCoords(name: string): [number, number] | null {
  if (!name) return null
  const hit = CITY_COORDS[name.trim()]
  if (hit) return hit
  const lower = name.trim().toLowerCase()
  for (const [k, v] of Object.entries(CITY_COORDS)) if (k.toLowerCase() === lower) return v
  return null
}

// Common languages spoken across the network, UN official six first. Members can
// still add any other language.
export const LANGUAGES: string[] = [
  "English", "French", "Spanish", "Arabic", "Chinese", "Russian",
  "Portuguese", "German", "Italian", "Dutch", "Swahili", "Hindi", "Urdu",
  "Bengali", "Japanese", "Korean", "Turkish", "Persian", "Amharic", "Hausa",
  "Yoruba", "Wolof", "Indonesian", "Vietnamese", "Thai", "Nepali",
]
