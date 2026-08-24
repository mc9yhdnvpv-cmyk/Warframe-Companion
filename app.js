const KEY="wfTennoDeckV3",PS="https://api-ps4.warframe.com/cdn/getProfileViewingData.php?playerId=",PC="https://api.warframe.com/cdn/getProfileViewingData.php?playerId=",WS="https://api.warframestat.us/ps4",CDN="https://cdn.warframestat.us/img/",DATA="https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/";
let previous=JSON.parse(localStorage.getItem("wfTennoDeckV2")||"{}");
let state=Object.assign({accountId:"",canonicalId:"",syncApiUrl:"",profilePlatform:"PlayStation",profile:null,lastSync:null,source:null,items:{},collectionFilter:"Warframes"},previous,JSON.parse(localStorage.getItem(KEY)||"{}"));let catalogs={};const save=()=>localStorage.setItem(KEY,JSON.stringify(state));const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function res(){return state.profile?.Results?.[0]||state.profile?.results?.[0]||state.profile||null}function xp(){let r=res();return r?.LoadOutInventory?.XPInfo||r?.loadOutInventory?.XPInfo||r?.XPInfo||r?.xpInfo||[]}function missions(){let r=res();return r?.Missions||r?.missions||[]}function name(){let r=res();return r?.DisplayName||r?.displayName||r?.Name||"Tenno"}function mr(){let r=res();return r?.MasteryRank??r?.masteryRank??r?.PlayerLevel??"—"}function xpMap(){let m=new Map();xp().forEach(x=>m.set(x.ItemType||x.itemType,Number(x.XP??x.xp??0)));return m}function mastered(item){let x=xpMap();return x.has(item.uniqueName)&&x.get(item.uniqueName)>0}function img(item){return item.imageName?CDN+item.imageName:""}function wiki(q){return "https://wiki.warframe.com/w/Special:Search?search="+encodeURIComponent(q)}
async function cat(c){if(catalogs[c])return catalogs[c];try{let r=await fetch(DATA+c+".json");if(!r.ok)throw 0;let j=await r.json();catalogs[c]=j;return j}catch{return []}}
function view(id){document.querySelectorAll(".view,nav button").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelector(`nav button[data-view="${id}"]`).classList.add("active");scrollTo(0,0);if(id==="collection")renderCollection();if(id==="live")loadLive()}document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>view(b.dataset.view));window.view=view;
function renderHome(){let connected=!!state.profile;let mx=xp().length,ms=missions().length;document.getElementById("home").innerHTML=connected?`<div class="hero"><div class="kicker">TENNO PROFILE • PLAYSTATION</div><div class="row"><div><div class="big">${esc(name())}</div><div class="muted">Mastery Rank ${esc(mr())}</div></div><span class="badge">${state.source==="service"?"SYNCED • "+esc(state.profilePlatform||"PROFILE"):(state.source==="direct"?"SYNCED • "+esc(state.profilePlatform||"PS"):"IMPORTED • "+esc(state.profilePlatform||"PROFILE"))}</span></div><div class="progress"><i style="width:${Math.min(100,Number(mr())/30*100)||0}%"></i></div><div class="actions"><button class="primary" onclick="openConnect()">Refresh</button><button class="secondary" onclick="view('collection')">Open collection</button></div></div><h2 class="sectionTitle">Collection stats</h2><div class="stats"><div class="stat"><strong>${esc(mr())}</strong><span>Mastery Rank</span></div><div class="stat"><strong>${mx}</strong><span>XP entries</span></div><div class="stat"><strong>${ms}</strong><span>Mission entries</span></div></div><h2 class="sectionTitle">Tenno objectives</h2><div class="panel"><div class="achievement"><div class="medal gold">✦</div><div><b>Grow the collection</b><div class="muted small">Find Warframes and weapons you haven't mastered yet.</div></div></div><div class="achievement"><div class="medal">◈</div><div><b>Complete today's activities</b><div class="muted small">Use Live for fissures, Sortie and Nightwave.</div></div></div><div class="achievement"><div class="medal">⌕</div><div><b>Build your next target</b><div class="muted small">Tap any collection card for details and Wiki search.</div></div></div></div>`:`<div class="hero"><div class="kicker">YOUR TENNO COLLECTION</div><div class="big">Turn Warframe progression into a card collection.</div><p class="muted">Connect your PlayStation profile to overlay your progression on a visual Warframe and weapon catalog.</p><button class="primary" onclick="openConnect()">Connect Warframe</button></div><h2 class="sectionTitle">Collection mode</h2><div class="panel"><b>Warframes • Weapons • Companions • Arcanes</b><p class="muted">Cards load artwork from the WFCD Warframe item database. Once connected, profile XP data is used to mark matching equipment as mastered.</p><button class="secondary" onclick="view('collection')">Preview collection</button></div>`}
const cats=["Warframes","Primary","Secondary","Melee","Sentinels","Pets","Arcanes"];
async function renderCollection(){let el=document.getElementById("collection");el.innerHTML=`<h2 class="sectionTitle">Collection</h2><input class="search" id="itemSearch" placeholder="Search your collection…"><div class="filters">${cats.map(c=>`<button data-cat="${c}" class="${state.collectionFilter===c?"active":""}">${c}</button>`).join("")}</div><div class="panel muted">Loading cards…</div>`;document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{state.collectionFilter=b.dataset.cat;save();renderCollection()});let items=await cat(state.collectionFilter);items=items.filter(i=>i.name&&i.imageName&&!i.name.includes("Prime Access"));let draw=(q="")=>{let f=items.filter(i=>i.name.toLowerCase().includes(q.toLowerCase())).slice(0,300);el.querySelector(".panel")?.remove();let old=el.querySelector(".cardGrid");if(old)old.remove();let grid=document.createElement("div");grid.className="cardGrid";grid.innerHTML=f.map((i,n)=>`<div class="collectCard ${mastered(i)?"mastered":"locked"}" data-card="${n}"><span class="rarity">${esc(i.type||i.category||state.collectionFilter)}</span><img loading="lazy" src="${img(i)}" alt="${esc(i.name)}"><div class="info"><div class="name">${esc(i.name)}</div><div class="meta">${i.masteryReq!=null?"MR "+i.masteryReq:""} ${i.vaulted?"• Vaulted":""}</div><span class="chip">${mastered(i)?"Collected":"Discover"}</span></div></div>`).join("");el.appendChild(grid);grid.querySelectorAll("[data-card]").forEach(c=>c.onclick=()=>showCard(f[Number(c.dataset.card)]))};draw();document.getElementById("itemSearch").oninput=e=>draw(e.target.value)}
function showCard(i){let m=document.getElementById("cardModal");m.innerHTML=`<img src="${img(i)}"><div class="modalBody"><button class="closeModal" onclick="closeCard()">×</button><div class="kicker">${esc(i.type||i.category||"ITEM")}</div><h2>${esc(i.name)}</h2><span class="chip">${mastered(i)?"MASTERED":"NOT MATCHED AS MASTERED"}</span>${i.masteryReq!=null?`<span class="chip">MR ${i.masteryReq}</span>`:""}<p class="muted">${esc(i.description||"Open the Wiki for acquisition details, builds and related information.")}</p><div class="actions"><a class="primary" style="text-decoration:none" target="_blank" href="${wiki(i.name)}">Warframe Wiki ↗</a></div></div>`;m.classList.add("show");document.getElementById("modalBackdrop").classList.add("show")}function closeCard(){cardModal.classList.remove("show");modalBackdrop.classList.remove("show")}window.closeCard=closeCard;modalBackdrop.onclick=closeCard;
function renderMastery(){let list=xp();document.getElementById("mastery").innerHTML=state.profile?`<h2 class="sectionTitle">Mastery Deck</h2><div class="hero"><div class="kicker">ACCOUNT DATA</div><div class="big">${list.length} profile XP entries</div><p class="muted">Matching internal item IDs against the collection automatically marks cards as mastered.</p></div><div class="panel">${list.slice(0,250).map(v=>`<div class="listrow"><b>${esc((v.ItemType||v.itemType||"Unknown").split("/").pop())}</b><span class="muted small">XP ${Number(v.XP??v.xp??0).toLocaleString()}</span></div>`).join("")}</div>`:`<div class="panel">Connect your profile to populate mastery.</div>`}
async function loadLive(){let el=live;el.innerHTML=`<div class="panel">Loading PlayStation world state…</div>`;try{let [f,s,c,n]=await Promise.all([fetch(WS+"/fissures").then(r=>r.json()),fetch(WS+"/sortie").then(r=>r.json()),fetch(WS+"/cetusCycle").then(r=>r.json()),fetch(WS+"/nightwave").then(r=>r.json())]);let fs=(Array.isArray(f)?f:[]).filter(x=>x.active!==false).slice(0,10);el.innerHTML=`<h2 class="sectionTitle">Live PlayStation</h2><div class="stats"><div class="stat"><strong>${esc(c.state||"—")}</strong><span>Cetus</span></div><div class="stat"><strong>${fs.length}</strong><span>Fissures</span></div><div class="stat"><strong>${(n.activeChallenges||[]).length}</strong><span>Nightwave</span></div></div><h2 class="sectionTitle">Sortie</h2><div class="event"><div class="title">${esc(s.boss||"Sortie")}</div><div class="meta">${esc(s.faction||"")} • ${esc(s.eta||"")}</div></div><h2 class="sectionTitle">Fissures</h2>${fs.map(x=>`<div class="event"><div class="title">${esc(x.node)}</div><div class="meta">${esc(x.tier)} • ${esc(x.missionType)} • ${esc(x.eta)}</div></div>`).join("")}<h2 class="sectionTitle">Nightwave</h2><div class="panel">${(n.activeChallenges||[]).slice(0,7).map(x=>`<div class="listrow"><b>${esc(x.title||x.desc||"Challenge")}</b><span class="muted small">${esc(x.reputation||"")} standing</span></div>`).join("")}</div>`}catch{el.innerHTML=`<div class="panel">Couldn't load live data. Check your connection and retry.</div>`}}
function renderGuide(){guide.innerHTML=`<h2 class="sectionTitle">Codex</h2><div class="panel"><input id="q" class="search" placeholder="Warframe, weapon, mod, quest…"><button id="go" class="primary full">Search official Warframe Wiki ↗</button></div><div class="panel"><div class="achievement"><div class="medal">▦</div><div><b>Collection</b><div class="muted small">Browse visual item cards and find things to collect.</div></div></div><div class="achievement"><div class="medal">✦</div><div><b>Mastery</b><div class="muted small">Use account XP data to visualize mastered gear.</div></div></div><div class="achievement"><div class="medal">◌</div><div><b>Live activities</b><div class="muted small">Turn daily Warframe activities into rotating objectives.</div></div></div></div>`;go.onclick=()=>{let s=q.value.trim();if(s)window.open(wiki(s),"_blank")}}
function render(){renderHome();renderMastery();renderGuide()}render();
const sheet=document.getElementById("sheet"),back=document.getElementById("backdrop");function openConnect(){sheet.classList.add("show");back.classList.add("show");accountId.value=state.accountId||"";if(window.syncApiUrl)syncApiUrl.value=state.syncApiUrl||""}function closeConnect(){sheet.classList.remove("show");back.classList.remove("show")}window.openConnect=openConnect;connectBtn.onclick=openConnect;closeSheet.onclick=closeConnect;back.onclick=closeConnect;function valid(v){return /^[a-fA-F0-9]{24}$/.test(v.trim())}
function normalizeServiceUrl(v){
  return String(v||"").trim().replace(/\/+$/,"");
}
async function syncProfile(){
  const id=accountId.value.trim();
  const api=normalizeServiceUrl(syncApiUrl.value);

  if(!valid(id)){
    syncStatus.textContent="Account ID should be 24 hexadecimal characters.";
    return;
  }
  if(!/^https:\/\/.+/i.test(api)){
    syncStatus.textContent="Paste your HTTPS Cloudflare Worker URL first.";
    return;
  }

  state.accountId=id;
  state.syncApiUrl=api;
  save();

  syncStatus.textContent="Syncing through the read-only profile service…";

  try{
    const response=await fetch(api+"/profile?userId="+encodeURIComponent(id),{
      method:"GET",
      cache:"no-store",
      headers:{"Accept":"application/json"}
    });

    const payload=await response.json().catch(()=>null);

    if(!response.ok || !payload?.ok || !payload.profile){
      throw new Error(payload?.detail || payload?.error || "Sync service returned an invalid response.");
    }

    state.profile=payload.profile;
    state.canonicalId=payload.canonicalUserId||id;
    state.profilePlatform=payload.platform||"Synced profile";
    state.lastSync=Date.now();
    state.source="service";
    save();
    render();

    syncStatus.textContent=`Synced successfully via ${state.profilePlatform}.`;
    setTimeout(closeConnect,800);
  }catch(err){
    syncStatus.textContent="Sync service failed: "+String(err?.message||err);
  }
}
syncBtn.onclick=syncProfile;

profileUrlBtn.onclick=()=>{
 let id=(state.canonicalId||accountId.value.trim()).trim();
 if(!valid(id)){syncStatus.textContent="Paste your 24-character account ID first.";return}
 window.open(PS+encodeURIComponent(id),"_blank")
};

const pcProfileBtn=document.getElementById("pcProfileUrlBtn");
if(pcProfileBtn) pcProfileBtn.onclick=()=>{
 let id=(state.canonicalId||accountId.value.trim()).trim();
 if(!valid(id)){syncStatus.textContent="Paste the 24-character ID from “Retry with PC account” first.";return}
 window.open(PC+encodeURIComponent(id),"_blank")
};

profileFile.onchange=e=>{
 let f=e.target.files[0];if(!f)return;let r=new FileReader();
 r.onload=()=>{try{
   state.profile=JSON.parse(r.result);
   state.accountId=accountId.value.trim()||state.accountId;
   state.canonicalId=state.canonicalId||state.accountId;
   state.lastSync=Date.now();state.source="import";
   if(!state.profilePlatform)state.profilePlatform="Imported profile";
   save();render();syncStatus.textContent="Profile JSON imported.";setTimeout(closeConnect,700)
 }catch{syncStatus.textContent="Invalid JSON file."}};
 r.readAsText(f)
};
function exportBackup(){let b=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="warframe-tenno-deck-backup.json";a.click()}exportBtn.onclick=exportBackup;resetBtn.onclick=()=>{if(confirm("Disconnect and reset local data?")){localStorage.removeItem(KEY);localStorage.removeItem("wfTennoDeckV2");location.reload()}};if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});