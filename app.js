(function(){
"use strict";
var KATEGORIJE = ["Osobni automobil","Putnički kombi","Teretni kombi","Prikolica"];
var OPISI = {"Osobni automobil":"Za grad, posao i putovanja","Putnički kombi":"8+1 sjedala za grupe","Teretni kombi":"Do 3,5 t, B kategorija","Prikolica":"Zatvorena i otvorena"};
var MJENJAC = ["","Manualni","Automatski"];
var GORIVO = ["","Benzin","Dizel","Hibrid","Električni","Plin"];

var saved = window.SITE_DATA;
var state = clone(saved);
var dirty = false, canEdit = false, filter = "Sve";
var ui = {panel:false, tab:"vozila", editId:null, img:"", delArm:null, status:"", statusKind:"", sent:false};
var form = {ime:"",tel:"",vozilo:"",lok:"",d1:"",t1:"09:00",d2:"",t2:"09:00",nap:""};
var errors = {};

function clone(o){return JSON.parse(JSON.stringify(o));}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function pad(n){return (n<10?"0":"")+n;}
function iso(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function hrDate(s){if(!s)return "";var p=s.split("-");return p[2]+"."+p[1]+"."+p[0]+".";}
function digits(s){return String(s||"").replace(/\D/g,"");}
function byId(id){for(var i=0;i<state.vozila.length;i++)if(state.vozila[i].id===id)return state.vozila[i];return null;}
function carName(v){return (v.marka+" "+(v.model||"")).trim();}
function hasPrice(v){return v.cijena!==null&&v.cijena!==""&&v.cijena!==undefined&&Number(v.cijena)>0;}

(function(){var a=new Date();a.setDate(a.getDate()+1);var b=new Date(a);b.setDate(b.getDate()+3);form.d1=iso(a);form.d2=iso(b);form.lok=(state.postavke.lokacije||[])[0]||"";})();

/* ---------- drawings ---------- */
function wheel(x,y,r){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="var(--ink)"/><circle cx="'+x+'" cy="'+y+'" r="'+(r*.42)+'" fill="var(--muted)"/>';}
function draw(k){
 var body="var(--red)", glass="var(--night-2)", ground='<ellipse cx="160" cy="132" rx="140" ry="6" fill="var(--line)"/>';
 var s;
 if(k==="Putnički kombi"||k==="Teretni kombi"){
  s='<path d="M22,112 L22,40 Q22,22 42,22 L232,22 Q246,22 254,34 L284,70 Q300,74 300,92 L300,112 Z" fill="'+body+'"/>'+
    (k==="Putnički kombi"?'<path d="M40,34 L90,34 L90,62 L40,62 Z M98,34 L148,34 L148,62 L98,62 Z M156,34 L206,34 L206,62 L156,62 Z" fill="'+glass+'"/>':'<rect x="40" y="40" width="160" height="3" rx="1.5" fill="rgba(0,0,0,.18)"/>')+
    '<path d="M216,34 L238,34 Q246,34 250,42 L266,64 L216,64 Z" fill="'+glass+'"/>'+wheel(76,112,19)+wheel(250,112,19);
 } else if(k==="Prikolica"){
  s='<rect x="60" y="56" width="200" height="50" rx="6" fill="'+body+'"/><rect x="60" y="50" width="200" height="10" rx="4" fill="var(--ink)"/><path d="M260,90 L304,98" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/><circle cx="306" cy="98" r="5" fill="var(--ink)"/>'+wheel(160,112,19);
 } else if(k==="Traktor"){
  s='<path d="M70,104 L70,62 L150,62 L156,28 L214,28 L222,62 L262,66 Q276,68 276,84 L276,104 Z" fill="'+body+'"/><path d="M164,36 L206,36 L212,62 L160,62 Z" fill="'+glass+'"/><rect x="104" y="40" width="6" height="22" fill="var(--ink)"/>'+wheel(208,100,32)+wheel(92,112,20);
 } else {
  s='<path d="M24,112 L24,84 Q26,70 48,67 L100,62 L132,38 Q140,32 154,32 L208,32 Q222,33 232,46 L252,63 L284,68 Q298,72 298,88 L298,112 Z" fill="'+body+'"/><path d="M112,62 L138,41 L206,41 Q216,42 224,52 L236,62 Z" fill="'+glass+'"/>'+wheel(82,112,19)+wheel(248,112,19);
 }
 return '<svg viewBox="0 0 320 140" aria-hidden="true">'+ground+s+'</svg>';
}
function pic(v){return v.slika?'<img src="'+esc(v.slika)+'" alt="'+esc(carName(v))+'">':draw(v.kategorija);}
var I={
 seat:'<svg viewBox="0 0 24 24"><path d="M7 4v9h10M7 13l-1 7M17 13v7M9 4h3"/></svg>',
 gear:'<svg viewBox="0 0 24 24"><circle cx="6" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><path d="M6 7v10M12 7v10M18 7v5H6"/></svg>',
 fuel:'<svg viewBox="0 0 24 24"><path d="M4 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M3 20h12M4 10h10M14 8l3 2v7a1.5 1.5 0 0 0 3 0V8l-3-3"/></svg>',
 snow:'<svg viewBox="0 0 24 24"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"/></svg>',
 kg:'<svg viewBox="0 0 24 24"><path d="M6 8h12l2 12H4zM9 8a3 3 0 0 1 6 0"/></svg>',
 cal:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>'
};

/* ---------- booking logic ---------- */
function days(){
 if(!form.d1||!form.d2)return 0;
 var a=new Date(form.d1+"T"+(form.t1||"00:00")),b=new Date(form.d2+"T"+(form.t2||"00:00"));
 var h=(b-a)/36e5; if(!(h>0))return 0; return Math.max(1,Math.ceil(h/24-0.0001));
}
function dd(d){return d+(d%10===1&&d%100!==11?" dan":" dana");}
function chosenCar(){return form.vozilo?byId(form.vozilo):null;}
function waNumber(){return digits(state.postavke.whatsapp);}
function message(){
 var v=chosenCar(), d=days(), L=[];
 L.push("Novi upit za najam – "+state.postavke.naziv);
 L.push("");
 L.push("Ime: "+form.ime.trim());
 L.push("Telefon: "+form.tel.trim());
 L.push("Vozilo: "+(v?carName(v)+" ("+v.kategorija+")":"Bilo koje slobodno"));
 L.push("Preuzimanje: "+hrDate(form.d1)+" u "+form.t1+(form.lok?", "+form.lok:""));
 L.push("Povratak: "+hrDate(form.d2)+" u "+form.t2);
 if(d)L.push("Trajanje: "+dd(d));
 if(v&&d&&hasPrice(v))L.push("Okvirna cijena: "+(v.cijena*d)+" € ("+v.cijena+" €/dan)");
 if(form.nap.trim())L.push("Napomena: "+form.nap.trim());
 return L.join("\n");
}
function waHref(text){return "https://wa.me/"+waNumber()+"?text="+encodeURIComponent(text==null?message():text);}
function validate(){
 errors={};
 if(form.ime.trim().length<2)errors.ime="Upišite ime i prezime.";
 if(digits(form.tel).length<6)errors.tel="Upišite broj na koji vas možemo kontaktirati.";
 if(!form.d1)errors.d1="Odaberite datum preuzimanja.";
 if(!form.d2)errors.d2="Odaberite datum povratka.";
 else if(!days())errors.d2="Povratak mora biti nakon preuzimanja.";
 return !Object.keys(errors).length;
}

/* ---------- render ---------- */
var app=document.getElementById("app");
function render(){
 var fid=document.activeElement&&document.activeElement.id, pos=null;
 try{if(fid&&document.activeElement.selectionStart!=null)pos=document.activeElement.selectionStart;}catch(e){}
 var p=state.postavke;
 app.innerHTML=editBar()+'<div class="night">'+topBar(p)+hero(p)+'</div>'+types()+fleet()+why(p)+contact(p)+footer(p)+
  '<a class="fab" href="'+esc(waHref("Pozdrav, zanima me najam vozila."))+'" target="_blank" rel="noopener" aria-label="Pišite nam na WhatsApp">'+I.wa+'</a>'+(ui.panel?panel():"");
 if(fid){var el=document.getElementById(fid);if(el){el.focus({preventScroll:true});try{if(pos!=null)el.setSelectionRange(pos,pos);}catch(e){}}}
 watchFab();
}
var fabObs=null;
function watchFab(){
 if(!("IntersectionObserver" in window))return;
 var bk=document.getElementById("bk"),fab=document.querySelector(".fab");if(!bk||!fab)return;
 if(fabObs)fabObs.disconnect();
 fabObs=new IntersectionObserver(function(en){fab.classList.toggle("away",en[0].isIntersecting);});
 fabObs.observe(bk);
}
function editBar(){
 if(!canEdit)return "";
 return '<div class="editbar"><div class="wrap"><span class="sp">'+(dirty?"Imate promjene. Preuzmite site.js i zamijenite ga u data/ mapi na gitu.":"Uređivački način. Kupci ovu traku ne vide.")+'</span>'+
 (dirty?'<button class="btn btn-sm alt" data-act="discard">Odbaci</button><button class="btn btn-sm" data-act="publish">Preuzmi site.js</button>':'')+
 '<button class="btn btn-sm" data-act="open-panel">Uredi vozila i kontakt</button></div></div>';
}
function initials(n){var m=String(n).match(/^([A-ZČĆŽŠĐ0-9])\s*&\s*([A-ZČĆŽŠĐ0-9])/i);return m?m[1]+"&"+m[2]:String(n).trim().charAt(0).toUpperCase();}
function topBar(p){
 return '<header class="top"><div class="wrap"><a class="brand" href="#rezervacija"><span class="logo"><img src="logo.png" alt="'+esc(p.naziv)+'"></span><small class="not-m">Najam vozila · '+esc(p.grad)+'</small></a>'+
 '<nav class="nav" aria-label="Glavna navigacija"><a href="#ponuda">Ponuda</a><a href="#vozila">Vozila</a><a href="#zasto">Zašto mi</a><a href="#kontakt">Kontakt</a></nav>'+
 '<a class="btn btn-wa btn-sm" href="'+esc(waHref("Pozdrav, zanima me najam vozila."))+'" target="_blank" rel="noopener">'+I.wa+'<span>WhatsApp</span></a></div></header>';
}
function opt(v,l,s){return '<option value="'+esc(v)+'"'+(s?" selected":"")+'>'+esc(l)+'</option>';}
function field(id,label,html,full){return '<div class="f'+(full?" full":"")+(errors[id]?" bad":"")+'"><label for="bk-'+id+'">'+label+'</label>'+html+(errors[id]?'<span class="err">'+esc(errors[id])+'</span>':'')+'</div>';}
function stars(){return '<span class="stars" aria-hidden="true">★★★★★</span>';}
function hero(p){
 var avail=state.vozila.filter(function(v){return v.dostupno;});
 var v=chosenCar(), d=days();
 var sel=opt("","Bilo koje slobodno vozilo",!form.vozilo)+avail.map(function(c){return opt(c.id,carName(c)+(hasPrice(c)?" · "+c.cijena+" €/dan":""),form.vozilo===c.id);}).join("");
 var lok=(p.lokacije||[]).map(function(l){return opt(l,l,form.lok===l);}).join("");
 return '<section class="hero" id="rezervacija"><div class="wrap"><div>'+
 (p.ocjena?'<a class="rating-pill" href="https://www.google.com/search?q='+encodeURIComponent(p.naziv+" "+p.grad)+'" target="_blank" rel="noopener"><span class="g">G</span>'+stars()+'<span class="num">'+esc(p.ocjena)+' na Googleu</span></a>':'')+
 '<h1>Najam vozila<br>u <em>'+esc(p.gradU||p.grad)+'</em></h1>'+
 '<p class="lead">Osobni automobili, putnički i teretni kombiji te prikolice. Pošaljite upit u minuti, a odgovor stiže ravno na vaš WhatsApp.</p>'+
 '<div class="ctas"><a class="btn btn-red only-m" href="#bk">Pošalji upit</a><a class="btn btn-red not-m" href="#vozila">Pogledaj vozila</a><a class="btn btn-ghost-n" href="tel:'+esc(digits(p.whatsapp)?"+"+digits(p.whatsapp):"")+'">Nazovi '+esc(p.telefon)+'</a></div>'+
 '<div class="facts"><div><b class="num">'+esc(p.ocjena||"–")+' / 5</b><span>Ocjena na Googleu</span></div><div><b>20+ vozila</b><span>Automobili, kombiji, prikolice</span></div><div><b>B kat.</b><span>Dovoljna za kombije do 3,5 t</span></div></div>'+
 '</div>'+
 '<form class="book" id="bk" novalidate><div class="book-head"><div><h2>Pošalji upit</h2><p class="sub">Obavezno: ime, telefon i datumi.</p></div><span class="wa-badge" aria-hidden="true">'+I.wa+'</span></div><div class="fgrid">'+
 field("ime","Ime i prezime",'<input id="bk-ime" autocomplete="name" value="'+esc(form.ime)+'" placeholder="Ivana Horvat">')+
 field("tel","Telefon",'<input id="bk-tel" type="tel" autocomplete="tel" value="'+esc(form.tel)+'" placeholder="09x xxx xxxx">')+
 field("vozilo","Vozilo",'<select id="bk-vozilo">'+sel+'</select>',true)+
 field("d1","Preuzimanje (datum i vrijeme)",'<div class="pair"><input id="bk-d1" type="date" value="'+esc(form.d1)+'" min="'+iso(new Date())+'"><input id="bk-t1" type="time" value="'+esc(form.t1)+'" aria-label="Vrijeme preuzimanja"></div>',true)+
 field("d2","Povratak (datum i vrijeme)",'<div class="pair"><input id="bk-d2" type="date" value="'+esc(form.d2)+'" min="'+esc(form.d1||iso(new Date()))+'"><input id="bk-t2" type="time" value="'+esc(form.t2)+'" aria-label="Vrijeme povratka"></div>',true)+
 (lok?field("lok","Mjesto preuzimanja",'<select id="bk-lok">'+lok+'</select>',true):'')+
 field("nap","Napomena",'<textarea id="bk-nap" placeholder="Dodatni vozač, dječja sjedalica, kuka za prikolicu…">'+esc(form.nap)+'</textarea>',true)+
 '</div><div class="summary" id="bk-sum">'+summary(v,d)+'</div>'+
 '<a class="btn btn-wa send" id="bk-send" href="'+esc(waHref())+'" target="_blank" rel="noopener">'+I.wa+'Pošalji upit na WhatsApp</a>'+
 (ui.sent?'<p class="sentnote" aria-live="polite"><b>WhatsApp bi se trebao otvoriti s pripremljenom porukom.</b> Pritisnite Pošalji u WhatsAppu. Ako se nije otvorio, nazovite <span class="num" style="user-select:all">'+esc(p.telefon)+'</span>.</p>':'<p class="privacy">Poruku vidite prije slanja. Bez registracije.</p>')+
 '</form></div></section>';
}
function summary(v,d){
 if(!d)return '<small>Datum povratka mora biti nakon preuzimanja.</small>';
 if(v&&hasPrice(v))return '<small>'+esc(carName(v))+' · '+dd(d)+'</small><span class="big num">'+(v.cijena*d)+' € <small>okvirno</small></span>';
 return '<small>Trajanje najma'+(v?" · cijena na upit":"")+'</small><span class="big num">'+dd(d)+'</span>';
}
function types(){
 return '<section class="sec" id="ponuda"><div class="wrap"><div class="sechead"><div><span class="kicker">Ponuda</span><h2>Što iznajmljujemo</h2></div><p>Od gradskog auta do kombija za devet osoba ili selidbu. Kliknite vrstu za popis vozila.</p></div>'+
 '<div class="types">'+KATEGORIJE.map(function(k){return '<button class="type" data-type="'+esc(k)+'"><span class="ic">'+draw(k)+'</span><b>'+esc(k)+'</b><span>'+esc(OPISI[k])+'</span></button>';}).join("")+'</div></div></section>';
}
function fleet(){
 var cats=["Sve"].concat(KATEGORIJE.filter(function(k){return state.vozila.some(function(v){return v.kategorija===k;});}));
 if(cats.indexOf(filter)<0)filter="Sve";
 var list=state.vozila.filter(function(v){return filter==="Sve"||v.kategorija===filter;});
 return '<section class="sec" id="vozila" style="padding-top:0"><div class="wrap"><div class="sechead"><div><span class="kicker">Vozila</span><h2>Naša vozila</h2></div>'+
 (cats.length>2?'<div class="chips" role="group" aria-label="Filtriraj po vrsti">'+cats.map(function(c){return '<button class="chip" data-filter="'+esc(c)+'" aria-pressed="'+(filter===c)+'">'+esc(c)+'</button>';}).join("")+'</div>':'')+'</div>'+
 (list.length?'<div class="grid">'+list.map(carCard).join("")+'</div>':
  '<div class="empty">'+(state.vozila.length?"Trenutno nema vozila ove vrste na popisu. Pošaljite upit i javit ćemo vam što je slobodno.":"Popis vozila uskoro. Pošaljite upit i javit ćemo vam što je slobodno.")+(canEdit&&!state.vozila.length?'<br><br><button class="btn btn-red" data-act="new-car">Dodaj prvo vozilo</button>':'')+'</div>')+
 '</div></section>';
}
function carCard(v){
 var sp=[];
 if(v.mjenjac)sp.push(I.gear+esc(v.mjenjac));
 if(Number(v.sjedala)>0)sp.push(I.seat+esc(v.sjedala)+" mjesta");
 if(v.gorivo)sp.push(I.fuel+esc(v.gorivo));
 if(v.nosivost)sp.push(I.kg+esc(v.nosivost));
 if(v.klima)sp.push(I.snow+"Klima");
 if(v.godina)sp.push(I.cal+esc(v.godina));
 if(v.kolicina)sp.unshift('<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>'+esc(v.kolicina));
 return '<article class="car'+(v.dostupno?"":" off")+'"><div class="pic">'+pic(v)+'<span class="tag">'+esc(v.kategorija)+'</span>'+(v.primjer?'<span class="tag ex">Primjer</span>':'')+'</div>'+
 '<div class="body"><h3>'+esc(carName(v))+'</h3>'+
 (sp.length?'<ul class="specs">'+sp.map(function(s){return '<li>'+s+'</li>';}).join("")+'</ul>':'')+
 (v.opis?'<p class="desc">'+esc(v.opis)+'</p>':'')+
 '<div class="foot">'+(hasPrice(v)?'<span class="price num">'+esc(v.cijena)+' €<small> / dan</small></span>':'<span class="price ask">Cijena na upit</span>')+
 (v.dostupno?'<button class="btn btn-sm btn-ink" data-pick="'+esc(v.id)+'">Rezerviraj</button>':'<span class="kicker" style="color:var(--muted)">Zauzeto</span>')+'</div></div></article>';
}
function why(p){
 return '<section class="sec" id="zasto" style="padding-top:0"><div class="wrap why">'+
 '<div class="panel-n"><span class="kicker">Zašto M&amp;I</span><h2>Pouzdano, povoljno, sigurno</h2><p class="slogan">'+esc(p.slogan)+'</p>'+
 '<ul class="points"><li><b>Redovito održavana vozila</b><span>Servisirana i pregledana prije svakog najma.</span></li><li><b>Jednostavno preuzimanje</b><span>Bez papirologije koja traje satima.</span></li><li><b>Dogovor na WhatsAppu</b><span>Upit, potvrda i pitanja u jednom razgovoru.</span></li><li><b>Lokalno, u '+esc(p.gradU||p.grad)+'</b><span>'+esc(p.adresa)+'</span></li></ul></div>'+
 '<div class="score"><span class="kicker">Recenzije na Googleu</span><div class="big num">'+esc(p.ocjena||"–")+'<small> / 5</small></div>'+stars()+
 '<p>Prosječna ocjena'+(p.brojRecenzija?' iz '+esc(p.brojRecenzija)+' recenzija':'')+' korisnika na Googleu.</p>'+
 '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:auto"><a class="btn btn-ghost" href="https://www.google.com/search?q='+encodeURIComponent(p.naziv+" "+p.grad)+'" target="_blank" rel="noopener">Pročitaj recenzije</a>'+
 (p.instagram?'<a class="btn btn-ghost" href="https://www.instagram.com/'+esc(p.instagram)+'/" target="_blank" rel="noopener">Instagram</a>':'')+'</div></div>'+
 '</div></section>';
}
function contact(p){
 var maps="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(p.naziv+", "+p.adresa);
 return '<section class="sec" id="kontakt" style="padding-top:0"><div class="wrap"><div class="sechead"><div><span class="kicker">Kontakt</span><h2>Javite nam se</h2></div></div><div class="contact">'+
 '<div class="cbox wa"><span class="lbl">WhatsApp i mobitel</span><span class="v sel num">'+esc(p.telefon)+'</span><div class="acts"><a class="btn btn-sm" href="'+esc(waHref("Pozdrav, zanima me najam vozila."))+'" target="_blank" rel="noopener">'+I.wa+'Otvori chat</a></div></div>'+
 '<div class="cbox"><span class="lbl">Adresa</span><span class="v">'+esc(p.adresa)+'</span><div class="acts"><a class="btn btn-sm btn-ghost" href="'+esc(maps)+'" target="_blank" rel="noopener">Upute na karti</a></div></div>'+
 '<div class="cbox"><span class="lbl">Radno vrijeme</span><span class="v">'+esc(p.radnoVrijeme||"Po dogovoru, javite se porukom")+'</span></div>'+
 '<div class="cbox"><span class="lbl">'+(p.email?"E-mail":"Društvene mreže")+'</span><span class="v sel">'+esc(p.email||(p.instagram?"@"+p.instagram:""))+'</span>'+
 (p.instagram&&!p.email?'<div class="acts"><a class="btn btn-sm btn-ghost" href="https://www.instagram.com/'+esc(p.instagram)+'/" target="_blank" rel="noopener">Otvori Instagram</a></div>':'')+'</div>'+
 '</div></div></section>';
}
function footer(p){
 return '<footer class="foot-note"><div class="wrap"><span>© '+new Date().getFullYear()+' '+esc(p.naziv)+' · '+esc(p.adresa)+'</span>'+(canEdit?'<button class="linkbtn" data-act="open-panel">Uredi stranicu</button>':'')+'</div></footer>';
}

/* ---------- admin panel ---------- */
function blankCar(){return {id:"",marka:"",model:"",kategorija:"Osobni automobil",godina:"",mjenjac:"Manualni",gorivo:"Dizel",sjedala:5,nosivost:"",klima:true,cijena:null,kolicina:"",opis:"",slika:"",dostupno:true};}
var edit=blankCar();
function aField(id,label,html,cls){return '<div class="f'+(cls?" "+cls:"")+'"><label for="'+id+'">'+label+'</label>'+html+'</div>';}
function sel(id,arr,val){return '<select id="'+id+'">'+arr.map(function(a){return opt(a,a||"—",a===val);}).join("")+'</select>';}
function panel(){
 var p=state.postavke, body;
 if(ui.tab==="vozila"){
  body='<div class="alist">'+(state.vozila.length?state.vozila.map(function(v){
   return '<div class="arow"><div class="th">'+pic(v)+'</div><div class="t"><b>'+esc(carName(v))+(v.primjer?' · primjer':'')+'</b><span class="num">'+esc(v.kategorija)+' · '+(hasPrice(v)?esc(v.cijena)+' €/dan':'cijena na upit')+' · '+(v.dostupno?"dostupno":"zauzeto")+'</span></div>'+
   '<div class="acts"><button class="btn btn-sm btn-ghost" data-toggle="'+esc(v.id)+'">'+(v.dostupno?"Označi zauzeto":"Označi dostupno")+'</button><button class="btn btn-sm btn-ghost" data-edit="'+esc(v.id)+'">Uredi</button>'+
   '<button class="btn btn-sm btn-danger" data-del="'+esc(v.id)+'">'+(ui.delArm===v.id?"Potvrdi brisanje":"Obriši")+'</button></div></div>';
  }).join(""):'<div class="empty">Još nema vozila. Dodajte prvo ispod.</div>')+'</div>'+
  '<form class="aform" id="af"><h3>'+(ui.editId?"Uredi vozilo":"Dodaj novo vozilo")+'</h3><div class="fgrid">'+
  aField("a-marka","Marka ili naziv",'<input id="a-marka" value="'+esc(edit.marka)+'" placeholder="npr. Renault">')+
  aField("a-model","Model",'<input id="a-model" value="'+esc(edit.model)+'" placeholder="npr. Trafic">')+
  '</div><div class="fgrid3" style="margin-top:12px">'+
  aField("a-kat","Vrsta",sel("a-kat",KATEGORIJE,edit.kategorija))+
  aField("a-mj","Mjenjač",sel("a-mj",MJENJAC,edit.mjenjac))+
  aField("a-go","Gorivo",sel("a-go",GORIVO,edit.gorivo))+
  aField("a-god","Godište",'<input id="a-god" type="number" min="1970" max="2100" value="'+esc(edit.godina)+'" placeholder="2022">')+
  aField("a-sj","Broj mjesta",'<input id="a-sj" type="number" min="0" max="20" value="'+esc(edit.sjedala)+'">')+
  aField("a-cij","Cijena €/dan",'<input id="a-cij" type="number" min="0" step="1" value="'+esc(edit.cijena==null?"":edit.cijena)+'" placeholder="prazno = na upit">')+
  '</div><div class="fgrid" style="margin-top:12px">'+
  aField("a-nos","Nosivost / dimenzije",'<input id="a-nos" value="'+esc(edit.nosivost)+'" placeholder="npr. 1.200 kg">')+
  aField("a-kol","Broj vozila (npr. 2 vozila)",'<input id="a-kol" value="'+esc(edit.kolicina||"")+'" placeholder="prazno = jedno vozilo">')+
  aField("a-opis","Kratki opis",'<input id="a-opis" value="'+esc(edit.opis)+'" placeholder="Za selidbe i prijevoz robe">')+
  '</div><div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:14px"><label class="check"><input type="checkbox" id="a-kl"'+(edit.klima?" checked":"")+'>Klima uređaj</label><label class="check"><input type="checkbox" id="a-dos"'+(edit.dostupno?" checked":"")+'>Dostupno za najam</label></div>'+
  '<div class="f full" style="margin-top:14px"><label for="a-img">Fotografija</label><div class="imgdrop"><div class="prev">'+(ui.img?'<img src="'+esc(ui.img)+'" alt="">':draw(edit.kategorija))+'</div><input id="a-img" type="file" accept="image/*">'+(ui.img?'<button type="button" class="btn btn-sm btn-ghost" data-act="rm-img">Ukloni sliku</button>':'')+'</div><p class="hint">Bez fotografije prikazuje se crtež prema vrsti vozila. Slika se automatski smanjuje.</p></div>'+
  '<div class="row-actions"><button class="btn btn-red" type="submit">'+(ui.editId?"Spremi vozilo":"Dodaj vozilo")+'</button>'+(ui.editId?'<button type="button" class="btn btn-ghost" data-act="cancel-edit">Odustani</button>':'')+'</div></form>';
 } else {
  body='<form class="aform" id="sf"><div class="fgrid">'+
  aField("s-naziv","Naziv",'<input id="s-naziv" value="'+esc(p.naziv)+'">')+
  aField("s-grad","Grad",'<input id="s-grad" value="'+esc(p.grad)+'">')+
  aField("s-gradu","Grad u rečenici (u …)",'<input id="s-gradu" value="'+esc(p.gradU)+'" placeholder="Kutini">',"full")+
  aField("s-wa","WhatsApp broj (za upite)",'<input id="s-wa" type="tel" value="'+esc(p.whatsapp)+'" placeholder="38598262062">')+
  aField("s-tel","Broj za prikaz",'<input id="s-tel" value="'+esc(p.telefon)+'">')+
  aField("s-adr","Adresa",'<input id="s-adr" value="'+esc(p.adresa)+'">',"full")+
  aField("s-rv","Radno vrijeme",'<input id="s-rv" value="'+esc(p.radnoVrijeme)+'" placeholder="Pon–Pet 8–17, Sub 8–13">')+
  aField("s-mail","E-mail",'<input id="s-mail" type="email" value="'+esc(p.email)+'">')+
  aField("s-ocj","Ocjena na Googleu",'<input id="s-ocj" value="'+esc(p.ocjena)+'" placeholder="4,8">')+
  aField("s-brr","Broj recenzija",'<input id="s-brr" type="number" min="0" value="'+esc(p.brojRecenzija)+'">')+
  aField("s-ig","Instagram korisničko ime",'<input id="s-ig" value="'+esc(p.instagram)+'">',"full")+
  aField("s-slog","Slogan",'<textarea id="s-slog">'+esc(p.slogan)+'</textarea>',"full")+
  aField("s-lok","Mjesta preuzimanja (jedno po retku)",'<textarea id="s-lok">'+esc((p.lokacije||[]).join("\n"))+'</textarea>',"full")+
  '</div><p class="hint">WhatsApp broj upišite s pozivnim brojem države, bez + i bez nule: 098 262 062 postaje 38598262062.</p>'+
  '<div class="row-actions"><button class="btn btn-red" type="submit">Primijeni</button></div></form>';
 }
 return '<div class="overlay" data-act="overlay"><div class="apanel" role="dialog" aria-modal="true" aria-label="Uređivanje stranice">'+
 '<div class="apanel-head"><h2>Uređivanje</h2><button class="btn btn-sm btn-ghost" data-act="close-panel">Zatvori</button></div>'+
 '<div class="tabs" role="tablist"><button role="tab" data-tab="vozila" aria-selected="'+(ui.tab==="vozila")+'">Vozila ('+state.vozila.length+')</button><button role="tab" data-tab="postavke" aria-selected="'+(ui.tab==="postavke")+'">Kontakt i podaci</button></div>'+
 body+
 '<div class="aform" style="margin-top:20px"><h3>Spremanje</h3><p class="hint" style="margin-top:0">Promjene vidite odmah u ovom pregledniku. Da ih vide kupci, preuzmite <b>site.js</b>, zamijenite njime datoteku <b>data/site.js</b> u repozitoriju i napravite commit i push.</p><div class="row-actions"><button class="btn btn-red" data-act="publish"'+(dirty?"":" disabled")+'>'+(dirty?"Preuzmi site.js":"Nema promjena")+'</button>'+(dirty?'<button class="btn btn-ghost" data-act="discard">Odbaci promjene</button>':'')+'</div>'+
 (ui.status?'<p class="status '+ui.statusKind+'" aria-live="polite">'+esc(ui.status)+'</p>':'')+'</div></div></div>';
}
function markDirty(msg){dirty=true;ui.status=msg||"";ui.statusKind="ok";}

/* ---------- events ---------- */
app.addEventListener("input",function(e){
 var t=e.target; if(!t.id||t.id.indexOf("bk-")!==0)return;
 var k=t.id.slice(3); form[k]=t.value;
 if(errors[k]){validate();render();return;}
 var s=document.getElementById("bk-sum"); if(s)s.innerHTML=summary(chosenCar(),days());
 var a=document.getElementById("bk-send"); if(a)a.href=waHref();
});
app.addEventListener("change",function(e){
 var t=e.target;
 if(t.id==="bk-vozilo"||t.id==="bk-lok"||t.id==="bk-d1"||t.id==="bk-d2"){form[t.id.slice(3)]=t.value;if(form.d2&&form.d1&&form.d2<form.d1)form.d2=form.d1;render();}
 if(t.id==="a-kat"){readEdit();render();}
 if(t.id==="a-img"&&t.files&&t.files[0]){readEdit();shrink(t.files[0]);}
});
app.addEventListener("submit",function(e){e.preventDefault();if(e.target.id==="af")saveCar();if(e.target.id==="sf")saveSettings();});
app.addEventListener("click",function(e){
 var t=e.target.closest("[data-act],[data-pick],[data-filter],[data-type],[data-edit],[data-del],[data-toggle],[data-tab],#bk-send");
 if(!t)return;
 if(t.id==="bk-send"){
  if(!validate()){e.preventDefault();ui.sent=false;render();var f=document.querySelector(".f.bad input,.f.bad select");if(f)f.focus();return;}
  t.href=waHref(); setTimeout(function(){ui.sent=true;render();},50); return;
 }
 if(t.dataset.pick){form.vozilo=t.dataset.pick;render();document.getElementById("rezervacija").scrollIntoView({block:"start"});var s=document.getElementById("bk-ime");if(s)s.focus({preventScroll:true});return;}
 if(t.dataset.type){filter=t.dataset.type;render();document.getElementById("vozila").scrollIntoView({block:"start"});return;}
 if(t.dataset.filter){filter=t.dataset.filter;render();return;}
 if(t.dataset.tab){ui.tab=t.dataset.tab;ui.status="";render();return;}
 if(t.dataset.edit){var v=byId(t.dataset.edit);edit=clone(v);ui.editId=v.id;ui.img=v.slika||"";render();var f2=document.getElementById("af");if(f2)f2.scrollIntoView({block:"start"});return;}
 if(t.dataset.toggle){var v2=byId(t.dataset.toggle);v2.dostupno=!v2.dostupno;markDirty();render();return;}
 if(t.dataset.del){
  var id=t.dataset.del;
  if(ui.delArm!==id){ui.delArm=id;render();setTimeout(function(){if(ui.delArm===id){ui.delArm=null;render();}},4000);return;}
  state.vozila=state.vozila.filter(function(v){return v.id!==id;});ui.delArm=null;if(form.vozilo===id)form.vozilo="";if(ui.editId===id){ui.editId=null;edit=blankCar();ui.img="";}
  markDirty("Vozilo obrisano.");render();return;
 }
 var a=t.dataset.act;
 if(a==="overlay"){if(e.target===t){ui.panel=false;render();}return;}
 if(a==="open-panel"){ui.panel=true;render();return;}
 if(a==="close-panel"){ui.panel=false;render();return;}
 if(a==="new-car"){ui.panel=true;ui.tab="vozila";render();return;}
 if(a==="cancel-edit"){ui.editId=null;edit=blankCar();ui.img="";render();return;}
 if(a==="rm-img"){readEdit();ui.img="";render();return;}
 if(a==="discard"){state=clone(saved);dirty=false;ui.status="Promjene odbačene.";ui.statusKind="ok";ui.editId=null;edit=blankCar();ui.img="";render();return;}
 if(a==="publish"){publish();return;}
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&ui.panel){ui.panel=false;render();}});

function val(id){var el=document.getElementById(id);return el?el.value:"";}
function readEdit(){
 if(!document.getElementById("a-marka"))return;
 edit.marka=val("a-marka").trim();edit.model=val("a-model").trim();edit.kategorija=val("a-kat");edit.mjenjac=val("a-mj");edit.gorivo=val("a-go");
 edit.godina=parseInt(val("a-god"),10)||"";edit.sjedala=Math.max(0,parseInt(val("a-sj"),10)||0);
 var c=parseFloat(val("a-cij"));edit.cijena=c>0?c:null;
 edit.nosivost=val("a-nos").trim();edit.kolicina=val("a-kol").trim();edit.opis=val("a-opis").trim();
 edit.klima=document.getElementById("a-kl").checked;edit.dostupno=document.getElementById("a-dos").checked;
}
function saveCar(){
 readEdit();
 if(!edit.marka){ui.status="Upišite marku ili naziv vozila.";ui.statusKind="bad";render();return;}
 edit.slika=ui.img||"";delete edit.primjer;
 if(ui.editId){var i=state.vozila.findIndex(function(v){return v.id===ui.editId;});state.vozila[i]=clone(edit);markDirty(carName(edit)+" je spremljen.");}
 else{edit.id="v"+Date.now().toString(36);state.vozila.push(clone(edit));markDirty(carName(edit)+" je dodan.");}
 ui.editId=null;edit=blankCar();ui.img="";render();
}
function saveSettings(){
 var p=state.postavke, wa=digits(val("s-wa"));
 if(wa.indexOf("00")===0)wa=wa.slice(2);
 if(wa.length<8){ui.status="WhatsApp broj nije ispravan. Upišite ga s pozivnim brojem, npr. 38598262062.";ui.statusKind="bad";render();return;}
 p.naziv=val("s-naziv").trim()||p.naziv;p.grad=val("s-grad").trim()||p.grad;p.gradU=val("s-gradu").trim();
 p.whatsapp=wa;p.telefon=val("s-tel").trim()||("+"+wa);p.adresa=val("s-adr").trim();p.radnoVrijeme=val("s-rv").trim();p.email=val("s-mail").trim();
 p.ocjena=val("s-ocj").trim();p.brojRecenzija=parseInt(val("s-brr"),10)||0;p.instagram=val("s-ig").trim().replace(/^@/,"");p.slogan=val("s-slog").trim();
 p.lokacije=val("s-lok").split("\n").map(function(s){return s.trim();}).filter(Boolean);
 if(p.lokacije.indexOf(form.lok)<0)form.lok=p.lokacije[0]||"";
 markDirty("Podaci primijenjeni.");render();
}
function shrink(file){
 var r=new FileReader();
 r.onload=function(){var img=new Image();img.onload=function(){
  var s=Math.min(1,960/img.width),c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);ui.img=c.toDataURL("image/jpeg",0.74);render();
 };img.onerror=function(){ui.status="Ovu sliku nije moguće učitati. Pokušajte s JPG ili PNG datotekom.";ui.statusKind="bad";render();};img.src=r.result;};
 r.readAsDataURL(file);
}

/* ---------- spremanje (preuzimanje site.js) ---------- */
function publish(){
 var txt="/* Podaci stranice M&I rent a car. Uređuje se na stranici preko #uredi ili ručno. */\nwindow.SITE_DATA = "+JSON.stringify(state,null,2)+";\n";
 try{
  var blob=new Blob([txt],{type:"text/javascript"}), a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download="site.js"; document.body.appendChild(a); a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);
  saved=clone(state);dirty=false;ui.status="site.js je preuzet. Zamijenite njime data/site.js u repozitoriju pa commit i push.";ui.statusKind="ok";
 }catch(e){ui.status="Preuzimanje nije uspjelo u ovom pregledniku.";ui.statusKind="bad";}
 render();
}

render();

function checkEdit(){var on=location.hash==="#uredi";if(on!==canEdit){canEdit=on;render();}}
window.addEventListener("hashchange",checkEdit);checkEdit();
})();
