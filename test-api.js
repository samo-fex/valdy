async function run() {
  const params = {
    idea: "Idea about dogs",
    canonicalDescription: "Canonical",
    geography: "Global",
    pillars: []
  };
  try {
    const res = await fetch('http://127.0.0.1:3000/api/validate/close-gaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    console.log(res.status);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();
