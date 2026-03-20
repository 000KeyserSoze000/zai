async function testFetch() {
  const url = "https://raw.githubusercontent.com/anthropics/skills/main/skills/algorithmic-art/SKILL.md";
  console.log(`Testing fetch from: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const text = await res.text();
      console.log(`Content length: ${text.length}`);
      console.log(`First 50 chars: ${text.substring(0, 50)}`);
    } else {
      console.log("Fetch failed with status " + res.status);
    }
  } catch (e) {
    console.error("FETCH ERROR:", e.message);
  }
}

testFetch();
