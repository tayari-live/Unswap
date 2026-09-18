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

// Common languages spoken across the network, UN official six first. Members can
// still add any other language.
export const LANGUAGES: string[] = [
  "English", "French", "Spanish", "Arabic", "Chinese", "Russian",
  "Portuguese", "German", "Italian", "Dutch", "Swahili", "Hindi", "Urdu",
  "Bengali", "Japanese", "Korean", "Turkish", "Persian", "Amharic", "Hausa",
  "Yoruba", "Wolof", "Indonesian", "Vietnamese", "Thai", "Nepali",
]
