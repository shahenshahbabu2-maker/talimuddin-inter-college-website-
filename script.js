const API_BASE = window.API_BASE || "http://localhost:4000/api";
const nav = document.getElementById("nav");
document.getElementById("menuToggle").addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

const form = document.getElementById("admissionForm");
const msg = document.getElementById("formMessage");
const statusForm = document.getElementById("statusForm");
const statusResult = document.getElementById("statusResult");

// Public admission submission is intentionally disabled until school administration grants permission.
if(form){
  form.querySelectorAll("input, select, textarea, button").forEach(el=>el.disabled=true);
}

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function collectForm(f){
  const o={};
  new FormData(f).forEach((v,k)=>{if(k!=="declaration" && typeof v==="string")o[k]=v.trim();});
  return o;
}
function showMsg(text, ok=false){msg.textContent=text;msg.style.color=ok?"#277845":"#b12f2f";}

form.addEventListener("submit", async e=>{
  e.preventDefault();
  showMsg("Submitting application…");
  if(!form.checkValidity()){form.reportValidity();return;}
  const data=collectForm(form);
  data.declaration=true;
  try{
    const r=await fetch(`${API_BASE}/applications`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    const out=await r.json();
    if(!r.ok)throw new Error(out.message||"Unable to submit application.");
    showMsg(`Application submitted successfully. Application Number: ${out.applicationNumber}`,true);
    window.location.hash="status";
    document.getElementById("applicationNumber").value=out.applicationNumber;
    await lookupStatus(out.applicationNumber);
  }catch(err){
    showMsg(err.message||"Server connection failed.");
  }
});

async function lookupStatus(number){
  statusResult.innerHTML="<p>Checking…</p>";
  try{
    const r=await fetch(`${API_BASE}/applications/status/${encodeURIComponent(number.trim().toUpperCase())}`);
    const out=await r.json();
    if(!r.ok)throw new Error(out.message||"Application not found.");
    const status=esc(out.status);
    statusResult.innerHTML=`<div class="status-card"><p><b>Application Number:</b> ${esc(out.applicationNumber)}</p><p><b>Student:</b> ${esc(out.studentName)}</p><p><b>Class:</b> ${esc(out.classApplyingFor)}</p><p><b>Application Date:</b> ${esc(new Date(out.applicationDate).toLocaleDateString("en-IN"))}</p><p class="state"><b>Status:</b> ${status}</p><p>${esc(out.message)}</p></div>`;
  }catch(err){statusResult.innerHTML=`<div class="status-card"><b>${esc(err.message)}</b></div>`;}
}
statusForm.addEventListener("submit",e=>{e.preventDefault();lookupStatus(document.getElementById("applicationNumber").value);});

async function loadAnnouncements(){
  try{
    const r=await fetch(`${API_BASE}/announcements`);
    if(!r.ok)return;
    const items=await r.json();
    const box=document.getElementById("announcementList");
    if(!items.length)return;
    box.innerHTML=items.map(x=>`<article class="notice"><b>${esc(x.title)}</b><p>${esc(x.body)}</p><small>${esc(new Date(x.created_at).toLocaleDateString("en-IN"))}</small></article>`).join("");
  }catch{}
}
loadAnnouncements();
// Admission shutter: one-page cover. Clicking it reveals the complete admission form.
const admissionStage = document.getElementById("admissionStage");
const admissionShutter = document.getElementById("admissionShutter");
const openAdmissionForm = document.getElementById("openAdmissionForm");
function revealAdmissionForm(){
  if(!admissionStage) return;
  admissionStage.classList.add("opened");
  admissionShutter?.setAttribute("aria-expanded","true");
  setTimeout(()=>document.getElementById("admissionForm")?.scrollIntoView({behavior:"smooth",block:"start"}),650);
}
openAdmissionForm?.addEventListener("click", (e)=>{e.stopPropagation(); revealAdmissionForm();});
admissionShutter?.addEventListener("click", revealAdmissionForm);
admissionShutter?.addEventListener("keydown", e=>{if(e.key==="Enter" || e.key===" "){e.preventDefault(); revealAdmissionForm();}});
