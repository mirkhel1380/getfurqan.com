// UTC Monday boundaries make the same published selection visible to everyone.
const WEEK=604800000, DAY=86400000, ANCHOR=Date.UTC(2026,9,26);
export const selections=[
 {ref:'13:28',surah:'Ar-Ra‘d',theme:'Remembrance & the heart',topic:'dhikr'},
 {ref:'2:153',surah:'Al-Baqarah',theme:'Patience & prayer',topic:'patience'},
 {ref:'2:152',surah:'Al-Baqarah',theme:'Remember with gratitude',topic:'dhikr'},
 {ref:'94:5',surah:'Ash-Sharh',theme:'Hope through hardship',topic:'patience'},
 {ref:'39:53',surah:'Az-Zumar',theme:'Return with hope',topic:'repentance'},
 {ref:'3:134',surah:'Ali ‘Imran',theme:'Kindness & restraint',topic:'character'},
 {ref:'17:9',surah:'Al-Isra',theme:'Guidance for your journey',topic:'quran'},
 {ref:'49:13',surah:'Al-Hujurat',theme:'Dignity & righteousness',topic:'character'}
];
export function selectionFor(date=new Date()){
 const time=date.getTime();if(!Number.isFinite(time))throw new TypeError('Invalid date');
 const week=Math.floor((time-ANCHOR)/WEEK),index=((week%selections.length)+selections.length)%selections.length;
 const start=new Date(ANCHOR+week*WEEK),end=new Date(start.getTime()+6*DAY);
 return {...selections[index],index,start,end};
}
