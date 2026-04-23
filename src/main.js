// Demo: call the Pages Function at functions/api/hello.js
fetch('/api/hello?name=world')
  .then((r) => r.json())
  .then(({ greeting }) => {
    document.getElementById('greeting').textContent = greeting;
  })
  .catch((err) => {
    document.getElementById('greeting').textContent = `Error: ${err.message}`;
  });
