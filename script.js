const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navAnchors = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('main section[id], header#home');

const searchInput = document.getElementById('search');
const categoryCards = document.querySelectorAll('.category-card');
const memoryCards = document.querySelectorAll('.memory-card');

const dropArea = document.getElementById('dropArea');
const memoryFileInput = document.getElementById('memoryFile');
const uploadForm = document.getElementById('uploadForm');
const uploadStatus = document.getElementById('uploadStatus');

const memoryTitleInput = document.getElementById('memoryTitle');
const memoryCategoryInput = document.getElementById('memoryCategory');
const memoryDescriptionInput = document.getElementById('memoryDescription');

const newsletterForm = document.getElementById('newsletterForm');
const newsletterStatus = document.getElementById('newsletterStatus');

let selectedUploadFile = null;
let activeCategoryFilter = '';

function setStatus(el, message, isSuccess) {
  if (!el) {
    return;
  }
  el.textContent = message;
  el.classList.toggle('success', Boolean(isSuccess));
  el.classList.toggle('error', !isSuccess && message.length > 0);
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function updateNavState() {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  navLinks.classList.toggle('open');
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', updateNavState);

  navAnchors.forEach((anchor) => {
    anchor.addEventListener('click', () => {
      if (window.innerWidth <= 860) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }
      const id = entry.target.getAttribute('id');
      navAnchors.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    });
  },
  {
    rootMargin: '-35% 0px -55% 0px',
    threshold: 0,
  }
);

sections.forEach((section) => sectionObserver.observe(section));

function applyFilters() {
  const query = normalize(searchInput ? searchInput.value : '');

  categoryCards.forEach((card) => {
    const categoryName = normalize(card.dataset.category || card.textContent);
    const isCategoryMatch = !query || categoryName.includes(query);
    const isActiveCategoryMatch = !activeCategoryFilter || categoryName.includes(activeCategoryFilter);
    const shouldShow = isCategoryMatch && isActiveCategoryMatch;
    card.classList.toggle('is-hidden', !shouldShow);
  });

  memoryCards.forEach((card) => {
    const title = normalize(card.dataset.title);
    const categories = normalize(card.dataset.category);
    const alt = normalize(card.querySelector('img')?.alt || '');
    const caption = normalize(card.querySelector('.caption')?.textContent || '');

    const haystack = `${title} ${categories} ${alt} ${caption}`;
    const matchesSearch = !query || haystack.includes(query);
    const matchesCategory = !activeCategoryFilter || categories.includes(activeCategoryFilter);

    card.classList.toggle('is-hidden', !(matchesSearch && matchesCategory));
  });
}

if (searchInput) {
  searchInput.addEventListener('input', applyFilters);
}

categoryCards.forEach((card) => {
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-pressed', 'false');

  const activateFilter = () => {
    const selected = normalize(card.dataset.category);

    if (activeCategoryFilter === selected) {
      activeCategoryFilter = '';
    } else {
      activeCategoryFilter = selected;
    }

    categoryCards.forEach((item) => {
      const isActive = normalize(item.dataset.category) === activeCategoryFilter && activeCategoryFilter !== '';
      item.classList.toggle('active-filter', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });

    applyFilters();
  };

  card.addEventListener('click', activateFilter);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateFilter();
    }
  });
});

function toggleActionButton(button) {
  const isPressed = button.getAttribute('aria-pressed') === 'true';
  button.setAttribute('aria-pressed', String(!isPressed));
  button.classList.toggle('active', !isPressed);
}

document.querySelectorAll('.action-btn').forEach((button) => {
  button.addEventListener('click', () => toggleActionButton(button));
});

function validateFile(file) {
  if (!file) {
    return { valid: false, message: 'Please choose an image to upload.' };
  }

  if (!file.type.startsWith('image/')) {
    return { valid: false, message: 'Only image files are allowed.' };
  }

  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, message: 'Image size must be under 10MB.' };
  }

  return { valid: true, message: '' };
}

function setSelectedFile(file) {
  selectedUploadFile = file;
  if (file) {
    setStatus(uploadStatus, `Selected: ${file.name}`, true);
  }
}

if (dropArea && memoryFileInput) {
  dropArea.addEventListener('click', () => memoryFileInput.click());

  dropArea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      memoryFileInput.click();
    }
  });

  memoryFileInput.addEventListener('change', () => {
    const file = memoryFileInput.files && memoryFileInput.files[0];
    const check = validateFile(file);
    if (!check.valid) {
      setStatus(uploadStatus, check.message, false);
      return;
    }
    setSelectedFile(file);
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropArea.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropArea.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropArea.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropArea.classList.remove('dragover');
    });
  });

  dropArea.addEventListener('drop', (event) => {
    const file = event.dataTransfer && event.dataTransfer.files[0];
    const check = validateFile(file);
    if (!check.valid) {
      setStatus(uploadStatus, check.message, false);
      return;
    }
    setSelectedFile(file);
  });
}

function createUploadedMemoryCard({ title, category, description, file }) {
  const article = document.createElement('article');
  article.className = 'memory-card medium';
  article.dataset.category = normalize(category);
  article.dataset.title = title;

  const image = document.createElement('img');
  image.alt = title;
  image.src = URL.createObjectURL(file);

  const overlay = document.createElement('div');
  overlay.className = 'memory-overlay';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'action-btn save-btn';
  saveBtn.textContent = 'Save';
  saveBtn.setAttribute('aria-pressed', 'false');

  const likeBtn = document.createElement('button');
  likeBtn.type = 'button';
  likeBtn.className = 'action-btn like-btn';
  likeBtn.textContent = 'Like';
  likeBtn.setAttribute('aria-pressed', 'false');

  saveBtn.addEventListener('click', () => toggleActionButton(saveBtn));
  likeBtn.addEventListener('click', () => toggleActionButton(likeBtn));

  overlay.append(saveBtn, likeBtn);

  const caption = document.createElement('p');
  caption.className = 'caption';
  caption.textContent = description;

  article.append(image, overlay, caption);
  return article;
}

if (uploadForm) {
  uploadForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = memoryTitleInput.value.trim();
    const category = memoryCategoryInput.value.trim();
    const description = memoryDescriptionInput.value.trim();

    if (!title || !category || !description) {
      setStatus(uploadStatus, 'Please complete all upload fields.', false);
      return;
    }

    const check = validateFile(selectedUploadFile);
    if (!check.valid) {
      setStatus(uploadStatus, check.message, false);
      return;
    }

    const masonry = document.querySelector('.masonry');
    if (!masonry) {
      setStatus(uploadStatus, 'Gallery is unavailable right now.', false);
      return;
    }

    const newCard = createUploadedMemoryCard({
      title,
      category,
      description,
      file: selectedUploadFile,
    });

    masonry.prepend(newCard);
    setStatus(uploadStatus, 'Memory uploaded successfully to your gallery.', true);

    uploadForm.reset();
    selectedUploadFile = null;
    applyFilters();
  });
}

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const emailInput = newsletterForm.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email || !email.includes('@')) {
      setStatus(newsletterStatus, 'Please enter a valid email address.', false);
      return;
    }

    setStatus(newsletterStatus, 'Subscribed successfully. Welcome to Zenvia.', true);
    newsletterForm.reset();
  });
}

applyFilters();
