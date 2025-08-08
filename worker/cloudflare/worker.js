export default {
  async fetch(request, env, ctx) {
    const u = new URL(request.url);
    let target = u.pathname.slice(1);
    if(!target){
      target = u.searchParams.get("url") || "";
    }
    if(!target){
      return new Response("Usage: GET /{url}  或  GET /?url={url}", { status: 400 });
    }
    try{
      try{ target = decodeURIComponent(target); }catch(_){}
      const resp = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible)",
          "Accept": "*/*"
        }
      });
      const headers = new Headers(resp.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Expose-Headers", "*");
      headers.delete("Content-Security-Policy");
      headers.delete("Content-Security-Policy-Report-Only");
      return new Response(resp.body, { status: resp.status, headers });
    }catch(e){
      return new Response("Proxy error: " + (e && e.message ? e.message : String(e)), { status: 500 });
    }
  }
};