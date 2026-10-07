form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await fetch(form.action, { method: 'POST', body: new FormData(form) });
});
