# Google Play — Data safety (hrvatski referentni tekst)

> Play Console ima jedan Data safety obrazac za cijelu aplikaciju, ne po jeziku.
> Ovo je hrvatski prijevod odgovora iz `data-safety.md` za internu provjeru.

## Prikuplja li aplikacija podatke?
- **Prikuplja:** da
- **Dijeli:** ne (pružatelji usluga obrađuju podatke u naše ime)
- **Enkripcija u prijenosu:** da
- **Korisnik može zatražiti brisanje:** da
- **URL za brisanje:** https://logistic-management-ui.pages.dev/delete-account

## Vrste podataka

| Vrsta podatka | Prikuplja se | Neobavezno | Svrha |
| --- | --- | --- | --- |
| Ime i prezime | Da | Ne | Račun, dodjela transporta, dostava |
| E-mail adresa | Da | Ne | Prijava, pozivnice, poveznice za lozinku |
| Broj telefona | Da | Da | Kontakt dispečera i dostava |
| Korisnički ID | Da | Ne | Autentifikacija i izolacija tvrtki |
| Adresa (tvrtka / mjesta rute) | Da | Ne | Ruta, utovar i dostava |
| Poruke u aplikaciji | Da | Da | Razgovor dispečer ↔ vozač, podrška |
| Sadržaj koji stvara korisnik | Da | Da | Opis tereta, napomene, incidenti, POD/CMR |
| Aktivnost u aplikaciji | Da | Ne | Status transporta, vremena utovara/istovara |

## Ne prikuplja se
- Precizna ni približna lokacija uređaja (aplikacija ne traži dopuštenje za lokaciju)
- Financijski podaci
- Zdravstveni podaci
- Kontakti, kalendar, fotografije, datoteke, SMS, zapisi poziva
- Oglašivački ID
- Povijest pregledavanja

## Sigurnost
- Samo HTTPS. Android aplikacija ima onemogućen cleartext promet.
- Lozinke se na poslužitelju spremaju kao BCrypt hash.
- Pristup je ograničen po tvrtki i ulozi.
- JWT ključ se generira po instalaciji i sprema u bazu.

## Obrada podataka
- Podaci se obrađuju za transportne operacije, autentifikaciju, e-mail
  pozivnice, izračun rute i podršku.
- Podaci se ne prodaju i ne koriste za oglašavanje.
- Obrađivači: Microsoft SQL Server hosting, Cloudflare Pages (web),
  Google Gmail SMTP (transakcijski e-mail), OpenStreetMap/OSRM (ruta).
- Rok čuvanja: dok je račun tvrtke aktivan, zatim brisanje na zahtjev, uz
  zakonske obveze čuvanja.

## Brisanje računa
- Voditelji mogu ukloniti vozače unutar aplikacije.
- Zahtjevi za brisanje računa/tvrtke obrađuju se preko javne stranice za
  brisanje u roku od 30 dana nakon provjere.
