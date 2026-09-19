export const USS_PRINCETON_SOURCE_RETRIEVED_AT = "2026-09-19T00:00:00.000Z" as const;

export const USS_PRINCETON_OFFICIAL_SOURCE_EXTRACTS = Object.freeze({
  commandAbout: Object.freeze({
    sourceRecordId: "source:us-navy:surfpac:uss-princeton-about:2026-09-19",
    sourceTitle: "USS Princeton (CG 59) — About",
    authority: "Naval Surface Force, U.S. Pacific Fleet",
    publisher: "United States Navy",
    canonicalUrl: "https://www.surfpac.navy.mil/Warships/USS-Princeton-CG-59/About/",
    publicationTime: undefined,
    sourceRevisionLabel: "Retrieved official command page 2026-09-19",
    authoritativeScope: Object.freeze([
      "USS Princeton identity and hull designation",
      "USS Princeton commissioning statement",
      "USS Princeton command-published mission and system description",
    ]),
    citationLocator: "About > A Proud Namesake; About > Our Ship / The Crest; About > The Mission",
    retainedFacts: Object.freeze([
      "The page identifies USS Princeton as CG 59 and the sixth U.S. Navy ship named Princeton.",
      "The page states that the sixth Princeton was commissioned on 11 February 1989 in Pascagoula, Mississippi.",
      "The page describes SPY-1B radar arrays and the AEGIS Combat System in its ship-specific crest explanation.",
      "The page describes anti-air, antisubmarine, and surface/strike warfare as the ship's multi-mission roles.",
    ]),
  }),
  cruiserFactFile: Object.freeze({
    sourceRecordId: "source:us-navy:fact-file:cruisers-cg:2025-04-23",
    sourceTitle: "Cruisers - CG",
    authority: "United States Navy",
    publisher: "United States Navy",
    canonicalUrl: "https://www.navy.mil/Resources/Fact-Files/Display-FactFiles/Article/2169861/cruisers-cg/",
    publicationTime: "2025-04-23T00:00:00.000Z",
    sourceRevisionLabel: "Last updated 23 April 2025",
    authoritativeScope: Object.freeze([
      "Ticonderoga-class general characteristics",
      "Hull-number-to-builder mapping",
      "Cruiser mission and capability description",
      "Official class ship listing",
    ]),
    citationLocator: "Description; Background; General Characteristics, Ticonderoga Class; Ships",
    retainedFacts: Object.freeze([
      "The official ship list identifies USS Princeton as CG 59 in the Ticonderoga class.",
      "The builder mapping assigns CG 59 to Ingalls Shipbuilding.",
      "Ticonderoga-class general characteristics list four GE LM2500 gas turbines, two shafts, and 80,000 total shaft horsepower.",
      "Ticonderoga-class general characteristics list length 567 feet, beam 55 feet, full-load displacement 9,600 long tons, and speed 30-plus knots.",
      "Cruisers are described as large multi-mission surface combatants supporting air, undersea, naval surface fire support, and surface warfare roles.",
    ]),
  }),
  aegisSystem: Object.freeze({
    sourceRecordId: "source:navsea:nswc-phd:aegis-combat-system:2026-09-19",
    sourceTitle: "Aegis Combat System",
    authority: "Naval Sea Systems Command, NSWC Port Hueneme Division",
    publisher: "United States Navy",
    canonicalUrl: "https://www.navsea.navy.mil/Home/Warfare-Centers/NSWC-Port-Hueneme/What-We-Do/Aegis-Combat-System/",
    publicationTime: undefined,
    sourceRevisionLabel: "Retrieved official NAVSEA page 2026-09-19",
    authoritativeScope: Object.freeze([
      "Aegis Combat System identity, integration, and class applicability",
    ]),
    citationLocator: "Aegis Combat System introduction",
    retainedFacts: Object.freeze([
      "Aegis is a fully integrated surface combat system combining missile launching, computer programs, radar, and displays.",
      "Aegis is deployed on Ticonderoga-class cruisers and is designed to detect, identify, and engage incoming threats.",
    ]),
  }),
  nhhcHoldings: Object.freeze({
    sourceRecordId: "source:nhhc:z-files:princeton-cg59:2026-09-19",
    sourceTitle: "ZC Files - P",
    authority: "Naval History and Heritage Command",
    publisher: "United States Navy",
    canonicalUrl: "https://www.history.navy.mil/research/library/z-files/zc-files/zc-files-p.html",
    publicationTime: undefined,
    sourceRevisionLabel: "Retrieved official NHHC holdings index 2026-09-19",
    authoritativeScope: Object.freeze([
      "Repository identity and holdings coverage for Princeton (CG-59)",
    ]),
    citationLocator: "Princeton (CG-59) entry",
    retainedFacts: Object.freeze([
      "The Navy Department Library index lists Princeton (CG-59) holdings for 1987-1997, including christening, change-of-command, and welcome-aboard brochures.",
    ]),
  }),
} as const);

export type UssPrincetonOfficialSourceKey = keyof typeof USS_PRINCETON_OFFICIAL_SOURCE_EXTRACTS;
