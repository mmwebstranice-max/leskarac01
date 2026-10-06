# M&I rent a car – web stranica

Statična stranica za najam vozila u Kutini. Kupac ispuni obrazac, a upit se otvara kao gotova poruka u WhatsAppu prema broju vlasnika.

Nema poslužitelja ni baze podataka: sve je HTML, CSS i JavaScript, a podaci stranice su u `data/site.js`.

## Struktura

```
index.html      stranica
style.css       izgled (svijetla i tamna tema)
app.js          logika: obrazac, WhatsApp poruka, popis vozila, uređivanje
data/site.js    PODACI: kontakt, broj za WhatsApp, vozila, cijene
slike/          fotografije vozila
favicon.png     ikona
logo.png        logo za tamno zaglavlje
logo-svijetla-podloga.png  originalni logo (za bijelu podlogu, dijeljenje na mrežama)
_headers        sigurnosna zaglavlja za Cloudflare Pages
```

## Objava na Cloudflare Pages preko gita

1. Napravite novi repozitorij na GitHubu (npr. `mi-rent-a-car`) i u njega stavite sadržaj ove mape:
   ```bash
   cd mi-rent-a-car
   git init
   git add .
   git commit -m "Prva verzija stranice"
   git branch -M main
   git remote add origin https://github.com/VASE-KORISNICKO-IME/mi-rent-a-car.git
   git push -u origin main
   ```
2. U Cloudflareu: **Workers & Pages → Create → Pages → Connect to Git**, odaberite repozitorij.
3. Postavke builda:
   - Framework preset: **None**
   - Build command: *(prazno)*
   - Build output directory: **/** (korijen)
4. **Save and Deploy.** Dobit ćete adresu `nesto.pages.dev`.
5. Vlastita domena: u projektu **Custom domains → Set up a custom domain** (npr. `mi-rentacar.hr`).

Svaki `git push` na `main` automatski objavljuje novu verziju.

## Kako mijenjati vozila i podatke

**Način 1, kroz stranicu (bez programiranja):**
1. Otvorite stranicu s `#uredi` na kraju adrese, npr. `https://mi-rentacar.hr/#uredi`.
2. Pojavi se žuta traka. Kliknite **Uredi vozila i kontakt**: dodajte vozila, cijene i slike, promijenite kontakt.
3. Kliknite **Preuzmi site.js**.
4. Preuzetom datotekom zamijenite `data/site.js` u repozitoriju, pa commit i push (na GitHubu se može i preko web sučelja: *Add file → Upload files*).

Uređivanje preko `#uredi` je samo lokalni alat u vašem pregledniku: nitko ne može promijeniti stranicu bez pristupa vašem git repozitoriju.

**Način 2, ručno:** otvorite `data/site.js` i promijenite vrijednosti. Polje `"cijena": null` znači „Cijena na upit”. Polje `"primjer": true` prikazuje žutu oznaku *Primjer*; obrišite ga kad unesete stvarno vozilo.

**Slike:** fotografije dodane kroz `#uredi` spremaju se unutar `site.js`. Za puno vozila bolje je slike staviti u mapu `slike/` i upisati `"slika": "slike/ime.jpg"`.

## Lokalni pregled

Dovoljno je dvaput kliknuti `index.html`, ili pokrenuti mali poslužitelj:
```bash
python3 -m http.server 8000
```
pa otvoriti http://localhost:8000

## Sigurnost

- `_headers` uključuje CSP (dopušta samo vlastite skripte i Google Fonts), HSTS, zabranu prikaza u tuđim okvirima i ostala zaglavlja.
- Upiti kupaca se nigdje ne spremaju: idu izravno u WhatsApp.
- Sav tekst iz podataka prikazuje se kao običan tekst (nema ubacivanja HTML-a ni skripti).
- Na GitHubu uključite 2FA, a repozitorij može biti privatan (Cloudflare Pages radi i s privatnim repozitorijima).
