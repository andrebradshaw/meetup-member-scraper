var reg = (o, n) => o ? o[n] : '';
var cn = (o, s) => o ? o.getElementsByClassName(s) : console.log(o);
var tn = (o, s) => o ? o.getElementsByTagName(s) : console.log(o);
var gi = (o, s) => o ? o.getElementById(s) : console.log(o);
var delay = (ms) => new Promise(res => setTimeout(res, ms));
var rando = (n) => Math.round(Math.random() * n);
var fixCase = (fn)=> fn.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase() );

var parseMember = (obj,meetup) => [cleanName(obj.name).replace(/,/g, ''), `https://www.meetup.com/${meetup}/members/${obj.id}/`,obj.joined,obj.last_visited,obj.photo ? obj.photo.highres_link : '']

function downloadr(arr2D, filename) {
  if (/\.csv$/.test(filename) === true) {
	var data = '';
	arr2D.forEach(row => {
		var arrRow = '';
		row.forEach(col => {
			col ? arrRow = arrRow + col.toString().replace(/,/g, ' ') + ',' : arrRow = arrRow + ' ,';
        });
		data = data + arrRow + '\r'; 
	});
  }

  if (/\.json$|.js$/.test(filename) === true) {
    var data = JSON.stringify(arr2D);
    var type = 'data:application/json;charset=utf-8,';
  } else {
	var type = 'data:text/plain;charset=utf-8,';
  }
  var file = new Blob([data], {
    type: type
  });
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

async function getMembersByPage(meetup,p) {
  var res = await fetch(`https://www.meetup.com/mu_api/urlname/members?queries=%28endpoint%3Agroups%2F${meetup}%2Fmembers%2Clist%3A%28dynamicRef%3Alist_groupMembers_${meetup}_all%2Cmerge%3A%28isReverse%3A%21f%29%29%2Cmeta%3A%28method%3Aget%29%2Cparams%3A%28filter%3Aall%2Cpage%3A${p}%29%2Cref%3AgroupMembers_${meetup}_all%29`);
  var d = await res.json();
  return d;
}
var containArr = [['Member Name','Member Profile','Join Date','Last Visited','Photo Link']];

async function looper(){
  var meetup = reg(/(?<=meetup.com\/).+?(?=\/)/.exec(window.location.href),0);
  var run1 = await getMembersByPage(meetup,1);
  var res1 = run1.responses[0].value;
  var numMembers = res1.meta.all;
  var memberRes = res1.value;
  if(memberRes) memberRes.forEach(el=> containArr.push(parseMember(el,meetup)));
console.log(numMembers);
  for(var i=2; i<=(numMembers/30); i++){
    var res = await getMembersByPage(meetup,i);
    if(res) res.responses[0].value.value.forEach(el=> containArr.push(parseMember(el,meetup)));
    console.log(i);
    await delay(1200);
  }
  
  downloadr(containArr, meetup+new Date().getTime()+'.csv');
}

looper()

