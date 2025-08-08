/* global APP_CONFIG */
(function(){
  const $ = sel => document.querySelector(sel);

  const sleep = ms => new Promise(res => setTimeout(res, ms));

  function lcg(seed){
    // 简单线性同余发生器：可复现
    // 参数取自 Numerical Recipes
    let m = 0x100000000; // 2^32
    let a = 1664525;
    let c = 1013904223;
    let s = (seed>>>0) || Math.floor(Math.random()*m);
    return function(){
      s = (a*s + c) % m;
      return s / m;
    };
  }

  function pickLanguageChain(n, pool, seed){
    const rnd = seed==null ? Math.random : lcg(seed);
    const chain = [];
    for(let i=0;i<n;i++){
      const k = Math.floor(rnd()*pool.length);
      chain.push(pool[k]);
    }
    return chain;
  }

  function chunksByLen(s, limit){
    if(s.length <= limit) return [s];
    const out = [];
    let i = 0;
    while(i < s.length){
      let j = Math.min(i+limit, s.length);
      // 尽量在句末断开
      let k = s.lastIndexOf('.', j);
      const seps = ['\n','。','！','？','!','?','；',';'];
      for(const sep of seps){
        const kk = s.lastIndexOf(sep, j);
        if(kk > k) k = kk;
      }
      if(k < i + Math.floor(limit/2)) k = j; else k = k+1;
      out.push(s.slice(i, k));
      i = k;
    }
    return out;
  }

  function makeUpstreamURL(text, target, source){
    const base = "https://translate.googleapis.com/translate_a/single";
    const params = new URLSearchParams();
    params.set("client","gtx");
    params.set("sl", source || "auto");
    params.set("tl", target);
    params.set("dt","t");
    params.set("q", text);
    return `${base}?${params.toString()}`;
  }

  function buildProxyURL(upstream, template, backup){
    if(template && template.includes("{url}")){
      return template.replace("{url}", encodeURIComponent(upstream));
    }
    if(template && template.endsWith("/")){
      return template + upstream;
    }
    if(template && template.length>0){
      // Treat as prefix without trailing slash
      return template + "/" + upstream;
    }
    // No proxy -> try backup default known proxy
    if(backup){
      if(backup.includes("{url}")) return backup.replace("{url}", encodeURIComponent(upstream));
      if(backup.endsWith("/")) return backup + upstream;
      return backup + "/" + upstream;
    }
    // Last resort: upstream itself (likely blocked by CORS)
    return upstream;
  }

  async function fetchJSONWithProxy(upstream, signal){
    const proxy = $("#proxy").value || (window.APP_CONFIG && window.APP_CONFIG.proxyTemplate) || "";
    const backup = (window.APP_CONFIG && window.APP_CONFIG.backupProxy) || "";
    const url = buildProxyURL(upstream, proxy, backup);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json,text/plain,*/*",
        "X-Requested-With": "fetch"
      },
      signal
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const txt = await res.text();
    // 某些代理以 text/plain 形式返回JSON文本
    try{
      return JSON.parse(txt);
    }catch(e){
      // 有些代理会包裹一层对象，比如 AllOrigins 的非 RAW 接口；这里尝试兜底
      try{
        const obj = JSON.parse(txt);
        if(obj && obj.contents){
          return JSON.parse(obj.contents);
        }
      }catch(_){}
      throw new Error("无法解析JSON（代理返回的不是纯JSON）。请更换代理模板。");
    }
  }

  function decodeFromGoogleJSON(data){
    if(!Array.isArray(data) || !Array.isArray(data[0])) return "";
    const parts = data[0];
    let out = "";
    for(const seg of parts){
      if(Array.isArray(seg) && seg[0]) out += seg[0];
    }
    // 反解 HTML 实体
    const ta = document.createElement("textarea");
    ta.innerHTML = out;
    return ta.value;
  }

  async function googleTranslate(text, target, source, signal){
    const limit = (window.APP_CONFIG && window.APP_CONFIG.chunkLimit) || 1500;
    const blocks = chunksByLen(text, limit);
    let result = "";
    for(const blk of blocks){
      const upstream = makeUpstreamURL(blk, target, source);
      const data = await fetchJSONWithProxy(upstream, signal);
      result += decodeFromGoogleJSON(data);
    }
    return result;
  }

  function logLine(s){
    const el = $("#log");
    el.textContent += s + "\n";
    el.scrollTop = el.scrollHeight;
  }

  function setBusy(b){
    $("#runBtn").disabled = b;
  }

  function getConfigFromUI(){
    const n = parseInt($("#numHops").value || "20", 10);
    const seedStr = $("#seed").value.trim();
    const seed = seedStr === "" ? null : Number(seedStr);
    const sleepSec = Number($("#sleep").value || "0");
    const langsInput = $("#langs").value.trim();
    const langs = langsInput ? langsInput.split(",").map(s=>s.trim()).filter(x=>x && !/^zh/i.test(x)) : (window.APP_CONFIG && window.APP_CONFIG.langs) || [];
    const target = $("#target").value || "zh-CN";
    const proxySel = $("#proxy").value;
    if(proxySel){
      window.APP_CONFIG.proxyTemplate = proxySel;
    }
    return { n, seed, sleepSec, langs, target };
  }

  async function runTranslate(){
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    setBusy(true);
    $("#log").textContent = "";
    $("#outputText").value = "";
    $("#copyBtn").disabled = true;
    $("#saveBtn").disabled = true;

    try{
      const input = $("#inputText").value;
      if(!input.trim()){
        logLine("请先输入要翻译的文本。");
        setBusy(false);
        return;
      }
      const {n, seed, sleepSec, langs, target} = getConfigFromUI();
      const chain = pickLanguageChain(n, langs, seed);
      let current = input;
      logLine(`开始：跳转 ${n} 次，目标=${target}，中间语言池大小=${langs.length}`);
      for(let i=0;i<chain.length;i++){
        const lg = chain[i];
        current = await googleTranslate(current, lg, null, signal);
        const prev = current.replace(/\n/g, " ");
        logLine(`[${i+1}/${n}] -> ${lg}: ${prev.slice(0, 100)}${prev.length>100?'...':''}`);
        if(sleepSec>0) await sleep(sleepSec*1000);
      }
      // 最后翻回中文
      const finalText = await googleTranslate(current, target, null, signal);
      $("#outputText").value = finalText;
      logLine(`[done] -> ${target}: ${finalText.slice(0, 160).replace(/\n/g," ")}${finalText.length>160?'...':''}`);
      $("#copyBtn").disabled = false;
      $("#saveBtn").disabled = false;
    }catch(e){
      logLine("出错：" + (e && e.message ? e.message : String(e)));
    }finally{
      setBusy(false);
    }
  }

  function copyResult(){
    const txt = $("#outputText").value;
    if(!txt){ alert("还没有结果"); return; }
    navigator.clipboard.writeText(txt).then(()=>{
      alert("已复制到剪贴板");
    }, ()=>{
      // 兜底
      $("#outputText").select();
      document.execCommand("copy");
      alert("已复制（execCommand）");
    });
  }

  function saveTxt(){
    const txt = $("#outputText").value || "";
    const blob = new Blob([txt], {type:"text/plain;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "roundtrip_result.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  $("#runBtn").addEventListener("click", runTranslate);
  $("#copyBtn").addEventListener("click", copyResult);
  $("#saveBtn").addEventListener("click", saveTxt);
})();