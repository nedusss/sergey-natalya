import { wedding } from './wedding.js';
import { submitRsvp } from './rsvp.js';

const intro = document.querySelector('#intro');
const openButton = document.querySelector('#open');
const main = document.querySelector('main');
const flap = intro.querySelector('.flap');
let observeReveals = () => {};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let introState = 'closed';
let openingTimeout;
let revealTimeout;

function finishIntro() {
  if (introState === 'opened') return;
  introState = 'opened';
  clearTimeout(openingTimeout);
  clearTimeout(revealTimeout);
  intro.hidden = true;
  main.inert = false;
  document.body.classList.remove('lock');
  main.classList.add('invitation-arrived');
  observeReveals();
  document.querySelector('#hero-title').focus({preventScroll: true});
}

function revealCover() {
  if (introState !== 'opening') return;
  introState = 'revealing';
  clearTimeout(openingTimeout);
  main.classList.add('cover-revealing');
  intro.classList.add('cover-leaving');
  revealTimeout = setTimeout(finishIntro, 750);
}

function openIntro() {
  if (introState !== 'closed') return;
  introState = 'opening';
  if (reduceMotion.matches) { finishIntro(); return; }
  intro.classList.add('opening');
  openingTimeout = setTimeout(revealCover, 250);
}


if (!location.hash) {
  history.scrollRestoration = 'manual';
  window.scrollTo({top: 0, behavior: 'instant'});
  main.inert = true;
  document.body.classList.add('lock');
  intro.hidden = false;
}
openButton.addEventListener('click', openIntro);
intro.addEventListener('transitionend', event => {
  if (event.target === intro && event.propertyName === 'opacity') finishIntro();
});
intro.addEventListener('keydown', event => {
  if (event.key === 'Escape') finishIntro();
});

const days = document.querySelector('#days');
for (let date = 1; date <= 28; date++) {
  const day = document.createElement('span');
  day.textContent = date;
  if (date === wedding.day) {
    day.className = 'chosen';
    day.setAttribute('aria-label', '27 февраля, день свадьбы');
    day.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 40 40" aria-hidden="true"><path pathLength="1" stroke-dasharray="1" d="M20 36C16 31 3 23 3 13c0-9 12-12 17-4 5-8 17-5 17 4 0 10-13 18-17 23Z"/></svg>');
  }
  days.append(day);
}

const countdown = document.querySelector('#countdown');
const counters = ['дней', 'часов', 'минут', 'секунд'].map(label => {
  const item = document.createElement('div');
  item.innerHTML = '<b></b><small>' + label + '</small>';
  countdown.append(item);
  return item.firstElementChild;
});

function tick() {
  const remaining = Math.max(0, Math.floor((wedding.start - Date.now()) / 1000));
  const values = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
  counters.forEach((counter, index) => { counter.textContent = String(values[index]).padStart(2, '0'); });
}

tick();
setInterval(tick, 1000);
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || introState === 'opening' || !intro.hidden) continue;
      entry.target.classList.add('seen');
      entry.target.querySelector('.thread-heart animateMotion')?.beginElement();
      observer.unobserve(entry.target);
    }
  }, {threshold: .17});
  observeReveals = () => {
    document.querySelectorAll('.nameplate,#welcome,.calendar,.countdown,.timeline,.location-card,.dress,.form-card,.final .picture').forEach(element => observer.observe(element));
  };
  if (intro.hidden) observeReveals();
}

const viewer = document.querySelector('#outfit-viewer');
const outfitTitle = document.querySelector('#outfit-title');
const outfitPhoto = document.querySelector('#outfit-photo');

for (const button of document.querySelectorAll('[data-outfit]')) {
  button.addEventListener('click', () => {
    const origin = button.getBoundingClientRect();
    const category = button.dataset.outfit;
    viewer.dataset.category = category;
    outfitTitle.textContent = button.textContent.trim();
    outfitPhoto.alt = category === 'women'
      ? 'Пять женских свадебных образов от светло-голубого до шампани'
      : 'Пять мужских костюмов от светло-голубого до шампани';
    if (!outfitPhoto.hasAttribute('src')) outfitPhoto.src = outfitPhoto.dataset.src;
    viewer.showModal();
    if (reduceMotion.matches) return;
    const card = viewer.getBoundingClientRect();
    const transform = 'translate(' + (origin.left - card.left) + 'px,' + (origin.top - card.top)
      + 'px) scale(' + origin.width / card.width + ',' + origin.height / card.height + ')';
    viewer.animate([
      { transform, borderRadius: '28px 8px', backgroundColor: getComputedStyle(button).backgroundColor },
      { transform: 'none', borderRadius: '24px 8px', offset: 1 },
    ], { duration: 580, easing: 'cubic-bezier(.22,.72,.24,1)' });
    for (const part of viewer.children) {
      part.animate([{opacity: 0, translate: '0 10px'}, {opacity: 1, translate: '0 0'}],
        {duration: 300, delay: 175, fill: 'backwards', easing: 'ease-out'});
    }
  });
}
viewer.addEventListener('click', event => {
  if (event.target === viewer) viewer.close();
});

const form = document.querySelector('#form');
const result = document.querySelector('#result');
const guest = form.elements.guest;
const submit = form.querySelector('button[type=submit]');
const drinks = document.querySelector('#drinks');
const drinkOptions = drinks.querySelectorAll('input[type=checkbox]');
const liveRsvp = Boolean(wedding.rsvpEndpoint);
if (liveRsvp) {
  form.querySelector('.demo').hidden = true;
  submit.textContent = 'Отправить ответ';
}

function updateForm() {
  guest.setCustomValidity(guest.value && !guest.value.trim() ? 'Введите имя и фамилию.' : '');
  const attending = form.elements.attend.value === 'yes';
  drinks.hidden = !attending;
  drinkOptions.forEach(option => { option.disabled = !attending; });
}


updateForm();
form.addEventListener('input', updateForm);
form.addEventListener('change', updateForm);
form.addEventListener('submit', async event => {
  event.preventDefault();
  updateForm();
  if (!form.reportValidity() || submit.disabled) return;
  delete result.dataset.error;
  const fields = new FormData(form);
  const answer = {
    guest: guest.value.trim(),
    attending: fields.get('attend') === 'yes',
    drinks: fields.getAll('drink'),
  };
  if (!liveRsvp) {
    result.textContent = 'Ответ проверен. Это предпросмотр: ваши данные не отправлены.';
    return;
  }
  submit.disabled = true;
  result.textContent = 'Отправляем ответ…';
  try {
    await submitRsvp(wedding.rsvpEndpoint, answer);
    result.textContent = '✓ Спасибо! Ваш ответ получен.';
  } catch {
    result.dataset.error = '';
    result.textContent = 'Не удалось отправить ответ. Попробуйте ещё раз.';
  } finally {
    submit.disabled = false;
  }
});

if (wedding.contacts.length) {
  const links = document.querySelector('#contact-links');
  for (const {name, phone} of wedding.contacts) {
    const link = document.createElement('a');
    link.href = 'tel:' + phone.replace(/[^\d+]/g, '');
    link.textContent = name + ' · ' + phone;
    links.append(link, document.createElement('br'));
  }
  document.querySelector('#contacts').hidden = false;
}


