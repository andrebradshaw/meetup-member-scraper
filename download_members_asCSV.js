var reg = (o, n) => o ? o[n] : '';
var cn = (o, s) => o ? o.getElementsByClassName(s) : console.log(o);
var tn = (o, s) => o ? o.getElementsByTagName(s) : console.log(o);
var gi = (o, s) => o ? o.getElementById(s) : console.log(o);
var delay = (ms) => new Promise(res => setTimeout(res, ms));
var rando = (n) => Math.round(Math.random() * n);
var fixCase = (fn)=> fn.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase() );
var ele = (t) => document.createElement(t);
var attr = (o, k, v) => o.setAttribute(k, v);

var a = (l, r) => r.forEach(a => attr(l, a[0], a[1]));

var fn = (s) => reg(/^\S+/.exec(s),0);
var ln = (s) => reg(/(?<=\s+).+/.exec(s),0);


var parseMember = (obj,meetup) => [
fn(fixCase(obj.name).replace(/,/g, '')),
ln(fixCase(obj.name).replace(/,/g, '')), 
obj.role.replace(/,/g, ''), 
obj.status.replace(/,/g, ''), 
obj.intro.replace(/,/g, '').replace(/\n|\r/g, ''), 
obj.title.replace(/,/g,''), 
`https://www.meetup.com/${meetup}/members/${obj.id}/`,
obj.joined,
obj.last_visited,
obj.photo ? obj.photo.highres_link : ''];


function downloadr(arr2D, filename) {
  var data = '';
  arr2D.forEach(row => {
    var arrRow = '';
    row.forEach(col => {
      col ? arrRow = arrRow + col.toString().replace(/,/g, ' ') + ',' : arrRow = arrRow + ' ,';
    });
    data = data + arrRow + '\r'; 
  });
  
  var file = new Blob([data], {    type: 'data:text/plain;charset=utf-8,'  });
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(file, filename);
  } else {
    var a = document.createElement('a'),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 10);
  }
}

async function getNumberOfMembers(meetup){
  var res = await fetch('https://www.meetup.com/'+meetup+'/members');
  var text = await res.text();
  var doc = new DOMParser().parseFromString(text,'text/html');
  var membersNum = reg(/(?<=All members\s*|membres\s*)[\d,\s]+/.exec(doc.body.innerText),0).replace(/\D+/g,'');
console.log(membersNum)
  var memnum = tn(cn(doc,'groupHomeHeaderInfo-memberLink')[0],'span')[0] ? tn(cn(doc,'groupHomeHeaderInfo-memberLink')[0],'span')[0].innerText.replace(/\D+/g,'') : '5000';
  var all_mem_num = memnum ? parseInt(memnum) : 1000;
  return all_mem_num;
}

async function getMembersByPage(meetup,p) {
  var res = await fetch(`https://www.meetup.com/mu_api/urlname/members?queries=%28endpoint%3Agroups%2F${meetup}%2Fmembers%2Clist%3A%28dynamicRef%3Alist_groupMembers_${meetup}_all%2Cmerge%3A%28isReverse%3A%21f%29%29%2Cmeta%3A%28method%3Aget%29%2Cparams%3A%28filter%3Aall%2Cpage%3A${p}%29%2Cref%3AgroupMembers_${meetup}_all%29`);
  var d = await res.json();
  console.log(d);
  return d;
}
var containArr = [['First Name','Last Name','Role','Status','Intro','Title','Member Profile','Join Date','Last Visited','Photo Link']];

function createLoadingHTML(){
  var contid = gi(document,'meetup_scraper_status');
  if(contid) contid.outerHTML = '';
  var cont = ele('div');
  a(cont,[['id','meetup_scraper_status'],['style',`position: fixed; top: 100px; left: 40%; padding: 16px; background: #070f1c; color: #fff; border-radius: 0.4em;`]]);
  document.body.appendChild(cont);
  cont.innerText = 'initializing...';
}

async function looper(){
  createLoadingHTML();
  var bgs = ['#228a3e','#1f7335','#185929','#12451f','#0d3317'];
  var langCheck = /en-AU|de-DE|es-ES|fr-FR|it-IT|nl-NL|pl-PL|pt-BR|tr-TR|ru-RU|th-TH|ja-JP|ko-KR/.test(window.location.href);
  var meetup = langCheck ? reg(/(?<=meetup.com\/[a-z]+-[A-Z]+\/).+?(?=\/)/.exec(window.location.href),0) : reg(/(?<=meetup.com\/).+?(?=\/)/.exec(window.location.href),0);
  var num_members = await getNumberOfMembers(meetup);
  var contid = gi(document,'meetup_scraper_status');
  contid.innerText = `downloading ${num_members} members...`;
  var loopMax = Math.ceil(num_members/30);
console.log(num_members)
  for(var i=1; i<=loopMax; i++){
    var r = rando(1200);
    var per = Math.ceil(((i*30)/num_members)*100) < 100 ? Math.ceil(((i*30)/num_members)*100) : 100;
    contid.innerText = `${per}% complete`;
    contid.style.background = bgs[rando(bgs.length)];
    contid.style.transition = `all ${r+1000}ms`;

    var res = await getMembersByPage(meetup,i);
    if(res && res.responses && res.responses.length && res.responses[0].value && res.responses[0].value.value.length) res.responses[0].value.value.forEach(el=> containArr.push(parseMember(el,meetup)));
    if(res.responses[0].value && res.responses[0].value.value.length == 0 ) {contid.style.opacity = '.1'; contid.style.transition = 'all 222ms'; break;}
    console.log(i);
    await delay(r+1000);
  }
  contid.innerText = `100% complete`;
  contid.style.opacity = '.01'; 
  contid.style.transition = 'all 322ms';
  downloadr(containArr, meetup+'_'+new Date().getTime()+'.csv');
  await delay(333);
  contid.outerHTML = '';
}

looper()
