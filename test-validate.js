// Native fetch
async function run() {
  const params = {
    idea: "A mobile app for dog walkers",
    canonicalDescription: "A platform connecting dog owners with vetted dog walkers.",
    geography: "Global"
  };
  const res = await fetch('http://127.0.0.1:3000/api/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  console.log(res.status);
  const data = await res.json();
  console.log(data);
  
  const idRes = await fetch(`http://127.0.0.1:3000/api/validate/${data.sessionId}`);
  const sData = await idRes.json();
  console.log(JSON.stringify(sData, null, 2));
}
run();
