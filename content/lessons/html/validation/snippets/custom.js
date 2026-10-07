const repeat = document.querySelector('#repeat');
const password = document.querySelector('#password');

repeat.addEventListener('input', () => {
  repeat.setCustomValidity(repeat.value === password.value ? '' : 'The passwords must match.');
});
