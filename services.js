/* Directorul de servicii de sprijin.
   Regula: nu adăugați servicii, adrese, numere sau programe fără verificare oficială.
   Fiecare intrare trebuie să aibă: sursa oficială, data verificării și statusul.
   Un serviciu fără verificare se marchează cu verificat: false și nu este prezentat ca recomandare validată.

   Structura unei intrări (exemplu, NU este un serviciu real):
   {
     id, nume, tip: "publica" | "ong" | "familie" | "urgenta" | "medical" | "consiliere",
     judet, localitate, adresa, telefon, program, servicii: [],
     sursaOficiala, linkSursa, dataVerificarii, verificat: true
   }
*/

window.MC_SERVICES = [];

window.MC_SERVICE_TYPES = [
  { value: "publica", label: "Servicii publice de sănătate" },
  { value: "medical", label: "Servicii medicale" },
  { value: "consiliere", label: "Consiliere" },
  { value: "ong", label: "Organizații neguvernamentale" },
  { value: "familie", label: "Sprijin pentru familii" },
  { value: "urgenta", label: "Urgențe" }
];

window.MC_OFFICIAL_SOURCES = [
  {
    nume: "Ministerul Sănătății",
    link: "https://www.ms.ro/",
    nota: "Verificați listele oficiale de servicii și structurile publice de tratare a dependențelor."
  },
  {
    nume: "Medicul de familie",
    link: null,
    nota: "Primul contact recomandat pentru evaluare și orientare către servicii specializate."
  }
];
