const ORCID_ID = '0000-0002-0914-5586';
const endpoint = `https://pub.orcid.org/v3.0/${ORCID_ID}/works`;

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function readWork(group) {
  const work = group['work-summary']?.[0];
  const title = work?.title?.title?.value;
  if (!title) return null;
  const ids = work?.['external-ids']?.['external-id'] || [];
  const doiEntry = ids.find(id => id['external-id-type']?.toLowerCase() === 'doi');
  const doi = doiEntry?.['external-id-value'] || '';
  return {
    title,
    year: work?.['publication-date']?.year?.value || 'Undated',
    journal: work?.['journal-title']?.value || '',
    doi,
    href: doi ? `https://doi.org/${doi}` : (work?.url?.value || '')
  };
}

function render(works) {
  const groups = works.reduce((all, work) => { (all[work.year] ||= []).push(work); return all; }, {});
  return Object.entries(groups).map(([year, items]) => `<div class="year-group"><h2>${esc(year)}</h2><div>${items.map((work, i) => `<article><span>${String(i + 1).padStart(2,'0')}</span><div><h3>${work.href ? `<a href="${esc(work.href)}" target="_blank" rel="noreferrer">${esc(work.title)} ↗</a>` : esc(work.title)}</h3><p>${esc([work.journal, work.doi].filter(Boolean).join(' · '))}</p></div></article>`).join('')}</div></div>`).join('');
}

async function loadPublications() {
  const container = document.querySelector('#publication-list');
  try {
    const response = await fetch(endpoint, { headers: { Accept: 'application/vnd.orcid+json' } });
    if (!response.ok) throw new Error(`ORCID returned ${response.status}`);
    const data = await response.json();
    const works = (data.group || []).map(readWork).filter(Boolean).sort((a,b) => Number(b.year || 0) - Number(a.year || 0) || a.title.localeCompare(b.title));
    container.innerHTML = works.length ? render(works) : '<p>No public works are currently listed on ORCID.</p>';
  } catch (error) {
    container.innerHTML = `<div class="pub-error"><h2>ORCID is temporarily unavailable.</h2><p>The publication list could not be refreshed just now. View the complete record directly on <a href="https://orcid.org/${ORCID_ID}">ORCID</a>.</p></div>`;
  }
}

loadPublications();
