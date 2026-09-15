const key = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
if (!key) {
  console.error("NO_KEY");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: 'Responda só JSON {"items":[{"label":"string","mealSlot":"lunch","calories":1,"protein":1,"carbs":1,"fat":1,"confidence":"high"}]}. Texto: 1 banana média',
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  }),
});

console.log("status", res.status);
const text = await res.text();
console.log(text.slice(0, 400));
