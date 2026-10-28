'use strict';
const dutchTafsirLinks={
  "1": {
    "title": "1: Soerat al-Faatihah",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/1-soerat-al-faatihah/"
  },
  "95": {
    "title": "95: Soerat at-Tien",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/95-soerat-at-tien/"
  },
  "111": {
    "title": "111: Soerat al-Masad",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/111-soerat-al-masad/"
  },
  "80": {
    "title": "80: Soerat cAbasa",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/80-soerat-cabasa/"
  },
  "96": {
    "title": "96: Soerat al-cAlaq",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/96-soerat-al-calaq/"
  },
  "112": {
    "title": "112: Soerat al-Ikhlaas",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/112-soerat-al-ikhlaas/"
  },
  "81": {
    "title": "81: Soerat at-Takwier",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/81-soerat-at-takwier/"
  },
  "97": {
    "title": "97: Soerat al-Qadr",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/97-soerat-al-qadr/"
  },
  "113": {
    "title": "113: Soerat al-Falaq",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/113-soerat-al-falaq/"
  },
  "82": {
    "title": "82: Soerat al-Infitaar",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/82-soerat-al-infitaar/"
  },
  "98": {
    "title": "98: Soerat al-Bayyinah",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/98-soerat-al-bayyinah/"
  },
  "114": {
    "title": "114: Soerat an-Naas",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/114-soerat-an-naas/"
  },
  "83": {
    "title": "83: Soerat al-Moetaffifien",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/83-soerat-al-moetaffifien/"
  },
  "99": {
    "title": "99: Soerat az-Zalzalah",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/99-soerat-az-zalzalah/"
  },
  "84": {
    "title": "84: Soerat al-Inshiqaaq",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/84-soerat-al-inshiqaaq/"
  },
  "100": {
    "title": "100: Soerat al-cAadiyaat",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/100-soerat-al-caadiyaat/"
  },
  "85": {
    "title": "85: Soerat al-Boeroedj",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/85-soerat-al-boeroedj/"
  },
  "101": {
    "title": "101: Soerat al-Qaaricah",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/101-soerat-al-qaaricah/"
  },
  "86": {
    "title": "86: Soerat at-Taariq",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/86-soerat-at-taariq/"
  },
  "102": {
    "title": "102: Soerat at-Takaathoer",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/102-soerat-at-takaathoer/"
  },
  "90": {
    "title": "90: Soerat  al-Balad",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/90-soerat-al-balad/"
  },
  "106": {
    "title": "106: Soerat Qoeraysh",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/106-soerat-qoeraysh/"
  },
  "91": {
    "title": "91: Soerat ash-Shams",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/91-soerat-ash-shams/"
  },
  "107": {
    "title": "107: Soerat al-Maacoen",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/107-soerat-al-maacoen/"
  },
  "92": {
    "title": "92: Soerat al-layl",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/92-soerat-al-layl/"
  },
  "108": {
    "title": "108: Soerat al-Kauthar",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/108-soerat-al-kauthar/"
  },
  "93": {
    "title": "93: Soerat ad-Doeha",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/93-soerat-ad-doeha/"
  },
  "109": {
    "title": "109: Soerat al-Kaafiroen",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/109-soerat-al-kaafiroen/"
  },
  "94": {
    "title": "94: Soerat ash-Sharh",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/94-soerat-ash-sharh/"
  },
  "110": {
    "title": "110: Soerat al-Nasr",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/110-soerat-al-nasr/"
  },
  "77": {
    "title": "77: Soerat Al-Mursalat: De Opgestuurden",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/77-soerat-al-mursalat-de-opgestuurden/"
  },
  "78": {
    "title": "78: Soerat an-Naba’ : De tijding",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/78-soerat-an-naba-de-tijding/"
  },
  "79": {
    "title": "79: Soerat an-Nazicaat",
    "url": "https://www.al-yaqeen.com/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/79-soerat-an-nazicaat/"
  }
};
