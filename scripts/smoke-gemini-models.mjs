const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("NO_KEY");
  process.exit(1);
}

const models = [
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-3.6-flash",
];

for (const model of models) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const started = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: 'JSON only {"items":[{"label":"x","mealSlot":"snack","calories":1,"protein":1,"carbs":1,"fat":1,"confidence":"high"}]}. Texto: 1 banana',
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
  const ms = Date.now() - started;
  console.log(`${model}: ${res.status} in ${ms}ms`);
}
