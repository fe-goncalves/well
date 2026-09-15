const key = process.env.GEMINI_API_KEY;
const models = ['gemini-flash-lite-latest','gemini-flash-latest','gemini-3.1-flash-lite','gemini-3.5-flash-lite','gemini-3.5-flash','gemini-3.1-flash-lite-preview'];
for (const model of models) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key;
  const t0 = Date.now();
  const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents:[{role:'user',parts:[{text:'JSON {\"ok\":true}'}]}], generationConfig:{responseMimeType:'application/json'} }) });
  console.log(model + ': ' + res.status + ' in ' + (Date.now()-t0) + 'ms');
}
