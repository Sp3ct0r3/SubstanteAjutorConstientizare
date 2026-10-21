/* Date generale ale aplicației „Minte Clară”.
   Toate valorile statistice au sursă, an și link. Nu adăuga cifre fără sursă verificabilă. */

window.MC_SITE = {
  dataVerificare: "2026-10-21",

  urgenta: {
    numar: "112",
    text: "Sună 112 doar în situații reale de urgență: persoana nu răspunde, respiră greu sau deloc, are convulsii, a luat o cantitate periculoasă de substanță sau este în pericol imediat."
  },

  sectiuniFiseSubstanta: [
    "Ce este substanța?",
    "Cum afectează creierul și organismul?",
    "Efecte pe termen scurt",
    "Riscuri pe termen lung",
    "Riscuri de intoxicație și supradoză",
    "Factori care cresc riscul de dependență",
    "Semne care pot indica un consum problematic",
    "Interacțiuni și riscuri ale combinării substanțelor",
    "Mituri și realități",
    "Opțiuni de tratament susținute de dovezi",
    "Cum poate ajuta familia?",
    "Unde poate fi solicitat ajutor?",
    "Bibliografie și data ultimei verificări"
  ],

  glosar: [
    {
      termen: "Consum",
      def: "Utilizarea unei substanțe, indiferent de frecvență sau cantitate. Nu înseamnă automat o problemă."
    },
    {
      termen: "Consum problematic",
      def: "Consum care aduce daune sănătății, relațiilor, școlii sau muncii, chiar dacă persoana nu are încă un diagnostic."
    },
    {
      termen: "Tulburare de consum",
      def: "Diagnostic clinic, stabilit de un profesionist, pe baza unui set de criterii (control redus, continuarea consumului în ciuda consecințelor, sevraj, pierderea activităților). Nu poate fi stabilit de o aplicație."
    },
    {
      termen: "Dependență",
      def: "Termen folosit uneori informal. În clasificările medicale actuale se vorbește mai precis despre tulburare de consum, cu grade diferite de severitate."
    },
    {
      termen: "Sevraj",
      def: "Set de simptome care apar când se reduce sau se oprește consumul unei substanțe. Unele sevraje (alcool, sedative) pot fi periculoase și necesită supraveghere medicală."
    },
    {
      termen: "Supradoză",
      def: "Cantitate de substanță care afectează grav funcțiile vitale. Este o urgență medicală: sună 112."
    }
  ],

  /* Statistici: fiecare intrare are valoare, populație, locație, an de colectare,
     an de publicare, sursă și link. Valorile naționale pentru România nu sunt inventate:
     sunt marcate ca „în curs de verificare". */
  statistici: [
    {
      id: "ue-decese-supradoza-2024",
      indicator: "Decese prin supradoză",
      valoare: "cel puțin 7.600",
      populatie: "Decese prin supradoză, în principal cu mai multe substanțe",
      locatie: "Uniunea Europeană (EU-27)",
      anColectare: 2024,
      anPublicare: 2026,
      sursa: "EUDA — Raportul european privind drogurile 2026",
      link: "https://www.euda.europa.eu/publications/european-drug-report/2026_en",
      nota: "Estimare EUDA, formulată ca „cel puțin”, adică un minim estimat, nu o cifră exactă. Opioidele, de obicei în combinație cu alte substanțe, rămân principala cauză a deceselor legate de droguri în Europa.",
      verificat: true
    },
    {
      id: "ue-cocaina-decese-2024",
      indicator: "Decese în care a fost implicată cocaina",
      valoare: "1.133 (27%) în 2024; 1.053 (26%) în 2023",
      populatie: "Decese legate de droguri, în cele 20 de țări care au furnizat date pentru ambii ani",
      locatie: "20 de țări europene (grupul comparabil de date)",
      anColectare: 2024,
      anPublicare: 2026,
      sursa: "EUDA — Raportul european privind drogurile 2026 (date comunicate și de HRB Irlanda)",
      link: "https://www.hrb.ie/news-stories/drug-and-alcohol-evidence-news-stories/european-drug-report-2026/",
      nota: "Comparația se referă doar la cele 20 de țări care au date pentru ambii ani. Nu este o cifră pentru toată Europa.",
      verificat: true
    },
    {
      id: "ro-date-nationale",
      indicator: "Date naționale pentru România",
      valoare: "În curs de verificare",
      populatie: "—",
      locatie: "România",
      anColectare: null,
      anPublicare: null,
      sursa: "Ministerul Sănătății / Agenția Națională Antidrog — verificați publicațiile oficiale",
      link: "https://www.ms.ro/",
      nota: "Nu am confirmat încă un indicator național cu an și populație. Nu folosiți cifrele europene ca date pentru România.",
      verificat: false
    }
  ]
};
