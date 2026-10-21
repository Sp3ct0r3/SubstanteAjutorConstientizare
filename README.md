# Minte Clară

Platformă informativă despre consumul de substanțe, prevenție, semnele consumului problematic și accesul la ajutor.
Versiune inițială, fără dependențe: HTML, CSS și JavaScript simplu. Nu necesită Node.js, npm sau server pentru a fi vizualizată.

> Informațiile au scop educațional și nu înlocuiesc evaluarea medicală. În urgență sunați **112**.

## Structura proiectului

```
minte-clara/
├── index.html            Pagina principală și shell-ul aplicației
├── assets/styles.css     Stilurile (responsive, contrast, focus vizibil, reduced-motion)
├── js/app.js             Router, pagini, căutare, filtre, formulare, quizuri, Q&A demonstrativ
├── data/
│   ├── site.js           Date generale, glosar, statistici cu surse, secțiunile fișelor
│   ├── substances.js     10 fișe de substanțe × 13 secțiuni
│   ├── studies.js        Biblioteca de cercetare (înregistrări cu surse și stare de verificare)
│   ├── services.js       Directorul de servicii (gol până la verificarea oficială)
│   └── quizzes.js        6 quizuri, 12 întrebări, cu explicații și surse
└── README.md
```

Datele sunt separate de interfață. Pentru o bază de date viitoare, înlocuiți fișierele din `data/` cu apeluri către API, păstrând aceleași structuri.

## Pornire pe calculator

Varianta 1 (cea mai simplă): deschideți `index.html` cu un browser modern (Chrome, Firefox, Edge, Safari). Funcționează și direct din fișier.

Varianta 2 (server local, recomandată pentru teste):

```bash
cd minte-clara
python3 -m http.server 8080
```

Apoi deschideți `http://localhost:8080`.

## Cum o testez

1. Navigați prin meniu și verificați că fiecare pagină se încarcă.
2. Pe pagina „Substanțe”, căutați „opioide” și apoi „zzzz”. Apăsați butonul de reafișare.
3. Deschideți o fișă și folosiți cuprinsul pentru a sări la secțiuni.
4. Pe pagina „Biblioteca de cercetare”, combinați filtrele (substanță, an, tip). Verificați mesajul pentru rezultate goale.
5. Pe pagina „Găsește ajutor”, verificați că nu apar servicii neconfirmate.
6. Pe pagina „Educație”, începeți un quiz. Trimiteți fără să răspundeți la toate întrebările (trebuie să apară un mesaj de eroare), apoi răspundeți și verificați scorul. Apăsați „Repetă quizul”.
7. Pe pagina „Vreau să schimb ceva”, încercați să salvați un plan gol (trebuie să apară erori de validare).
8. Pe pagina „Întreabă în siguranță”, scrieți „nu respiră bine” și verificați mesajul de urgență.
9. Redimensionați fereastra sau folosiți instrumentele pentru dezvoltatori la 390 px lățime. Nu trebuie să existe derulare orizontală a paginii.

## Cum o public online

Aplicația este statică. Puteți publica folderul `minte-clara` gratuit pe orice serviciu de hosting static, de exemplu:

- **GitHub Pages**: creați un repository, încărcați fișierele, activați Pages din Settings, pe branch-ul `main`, folderul `/ (root)`.
- **Netlify** sau **Cloudflare Pages**: trageți folderul în interfața de upload, fără configurare suplimentară.

Înainte de publicare: completați directorul de servicii doar cu date verificate, confirmați sursele din `data/studies.js` și validați conținutul medical cu un specialist.

## Ce este complet funcțional

- Navigare între pagini, pagină inexistentă redirecționată la pagina principală.
- Căutare și filtre pentru substanțe, studii și servicii.
- Fișe detaliate pentru 10 categorii de substanțe, cu cele 13 secțiuni cerute.
- Biblioteca de cercetare cu filtre multiple, detalii extensibile și stare de verificare pentru fiecare sursă.
- Grafic interactiv cu explicația sursei și a limitelor comparației.
- Quizuri cu validare, scor calculat, explicații și posibilitatea de a le repeta.
- Formulare cu validare: planul personal și jurnalul local.
- Butoane de urgență 112 în mai multe pagini.
- Stări goale pentru rezultate lipsă.

## Ce necesită date sau integrări suplimentare

- **Directorul de servicii**: este gol deliberat. Adăugați servicii în `data/services.js` doar după verificarea site-ului oficial și cu sursă și dată. Nu adăugați numere sau adrese neconfirmate.
- **Statistici naționale pentru România**: sunt marcate ca „în curs de verificare”. Trebuie căutate în publicațiile oficiale ale Ministerului Sănătății și ale Agenției Naționale Antidrog.
- **Biblioteca de cercetare**: are 6 înregistrări. Pentru majoritatea nu sunt confirmate ediția exactă, anul sau linkul profund. Acestea sunt marcate ca neverificate.
- **„Întreabă în siguranță”**: funcționează în mod demonstrativ, prin căutare în fișe. Nu este un model AI. Pentru un asistent real, ar trebui un server care să țină cheia API în variabile de mediu, cu citarea surselor, ceea ce nu se poate face într-o pagină statică.
- **Jurnalul și planul** sunt salvate doar în browser (localStorage). Nu sunt criptate.

## Ce trebuie verificat înainte de lansarea publică

- Toate fișele de substanțe, de către un medic sau un specialist în dependențe.
- Fiecare cifră și fiecare an din pagina de statistici.
- Titlurile, autorii și concluziile studiilor din bibliotecă, plus DOI-urile, unde există.
- Mesajele de urgență și textul despre sevraj.
- Quizurile, care trebuie să fie corecte din punct de vedere medical.
