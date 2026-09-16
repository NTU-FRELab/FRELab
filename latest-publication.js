const LATEST_ORCID_ID = '0000-0002-0914-5586';
const latestEndpoint = `https://pub.orcid.org/v3.0/${LATEST_ORCID_ID}/works`;

function escapeLatest(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[character]));
}

function readLatestWork(group) {
  const work = group['work-summary']?.[0];
  const title = work?.title?.title?.value;
  if (!title) return null;

  const ids = work?.['external-ids']?.['external-id'] || [];
  const doiEntry = ids.find(id => id['external-id-type']?.toLowerCase() === 'doi');
  const doi = doiEntry?.['external-id-value'] || '';
  const year = work?.['publication-date']?.year?.value || '';
  const month = work?.['publication-date']?.month?.value || '01';
  const day = work?.['publication-date']?.day?.value || '01';

  return {
    title,
    year,
    journal: work?.['journal-title']?.value || '',
    doi,
    href: doi ? `https://doi.org/${doi}` : (work?.url?.value || ''),
    publicationTime: year
      ? Date.parse(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00Z`)
      : 0,
    updatedTime: work?.['last-modified-date']?.value || 0
  };
}

function renderLatestPublication(work) {
  const details = [work.journal, work.year, work.doi].filter(Boolean).join(' · ');
  const title = escapeLatest(work.title);
  const linkedTitle = work.href
    ? `<a href="${escapeLatest(work.href)}" target="_blank" rel="noreferrer">${title} <span>↗</span></a>`
    : title;

  return `<p class="latest-label">Latest publication</p><article><h3>${linkedTitle}</h3><p>${escapeLatest(details)}</p></article>`;
}

async function loadLatestPublication() {
  const container = document.querySelector('#latest-publication');
  if (!container) return;

  try {
    const response = await fetch(latestEndpoint, {
      headers: { Accept: 'application/vnd.orcid+json' }
    });
    if (!response.ok) throw new Error(`ORCID returned ${response.status}`);

    const data = await response.json();
    const latest = (data.group || [])
      .map(readLatestWork)
      .filter(Boolean)
      .sort((a, b) => b.publicationTime - a.publicationTime || b.updatedTime - a.updatedTime)[0];

    container.innerHTML = latest
      ? renderLatestPublication(latest)
      : '<p>No public works are currently listed on ORCID.</p>';
  } catch (error) {
    container.innerHTML = `<p class="latest-error">The latest publication is temporarily unavailable. <a href="https://orcid.org/${LATEST_ORCID_ID}" target="_blank" rel="noreferrer">View ORCID ↗</a></p>`;
  }
}

loadLatestPublication();
