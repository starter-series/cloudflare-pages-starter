// Demo: call the Pages Function at functions/api/hello.js
fetch('/api/hello?name=world')
  .then((r) => r.json())
  .then(({ greeting }) => {
    document.getElementById('greeting').textContent = greeting;
  })
  .catch((err) => {
    document.getElementById('greeting').textContent = `Error: ${err.message}`;
  });

// Demo: call the KV-backed Pages Function at functions/api/visits.js
// If the KV binding is missing (fresh clone, no namespace created yet),
// the server returns 503 — we hide the element instead of showing an error.
const visitsEl = document.getElementById('visits');
if (visitsEl) {
  fetch('/api/visits')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data && typeof data.visits === 'number') {
        visitsEl.textContent = `Page views: ${data.visits}`;
      } else {
        visitsEl.hidden = true;
      }
    })
    .catch(() => {
      visitsEl.hidden = true;
    });
}
