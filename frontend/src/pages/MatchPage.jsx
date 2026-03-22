import { useState, useEffect, useRef } from 'react';
import { fetchProfiles, matchProfiles, isAbortError } from '../services/api.js';
import KundaliLoader from '../components/ui/Loader.jsx';

// ── Max points for each guna (fixed, language-independent) ──────────────────
const GUNA_MAX = {
  varna: 1, vashya: 2, tara: 3, yoni: 4,
  graha_maitri: 5, gana: 6, bhakut: 7, nadi: 8,
};

// ── Recommendation badge colours ─────────────────────────────────────────────
const RECOMMENDATION_COLORS = {
  HIGHLY_RECOMMENDED: 'bg-green-100 text-green-800 border-green-300',
  RECOMMENDED:        'bg-blue-100 text-blue-800 border-blue-300',
  AVERAGE:            'bg-yellow-100 text-yellow-800 border-yellow-300',
  NOT_RECOMMENDED:    'bg-red-100 text-red-800 border-red-300',
};

// ── Language options ──────────────────────────────────────────────────────────
const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'mr', name: 'मराठी' },
  { code: 'gu', name: 'ગુજરાતી' },
];

// ── UI translations ───────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    pageTitle:        'Kundali Compatibility',
    pageSubtitle:     'Select two profiles to analyze their patrika compatibility using AI',
    language:         'Language',
    profileA:         'Profile A (Boy / Groom)',
    profileB:         'Profile B (Girl / Bride)',
    selectProfile:    'Select profile…',
    searchPlaceholder:'Search by name…',
    noResults:        'No profiles found',
    noPatrika:        '⚠ This profile has no patrika image uploaded.',
    noPatrikaShort:   ' — no patrika',
    analyzeBtn:       'Analyze Compatibility',
    analyzing:        'Analyzing Kundali… (this may take ~30 seconds)',
    bothNeedPatrika:  'Both profiles must have a patrika image and be different',
    profileDetails:   'Profile Details Extracted',
    yrs:              'yrs',
    rashi:            'Rashi',
    nakshatra:        'Nakshatra',
    pada:             'Pada',
    lagna:            'Lagna',
    dob:              'DOB',
    place:            'Place',
    ashtakoot:        'Ashtakoot Milan',
    ashtakootSub:     '36-point Vedic compatibility score',
    compatible:       '% compatible',
    maxPts:           (n) => `max ${n} pts`,
    mangalDosha:      'Mangal Dosha',
    manglik:          'Manglik',
    nonManglik:       'Non-Manglik',
    doshaCancelled:   'Dosha Cancelled',
    summary:          "Astrologer's Summary",
    gunas: {
      varna: 'Varna', vashya: 'Vashya', tara: 'Tara', yoni: 'Yoni',
      graha_maitri: 'Graha Maitri', gana: 'Gana', bhakut: 'Bhakut', nadi: 'Nadi',
    },
    recommendations: {
      HIGHLY_RECOMMENDED: 'Highly Recommended',
      RECOMMENDED:        'Recommended',
      AVERAGE:            'Average',
      NOT_RECOMMENDED:    'Not Recommended',
    },
  },
  hi: {
    pageTitle:        'कुंडली मिलान',
    pageSubtitle:     'AI द्वारा पत्रिका अनुकूलता विश्लेषण के लिए दो प्रोफ़ाइल चुनें',
    language:         'भाषा',
    profileA:         'प्रोफ़ाइल A (वर / लड़का)',
    profileB:         'प्रोफ़ाइल B (वधू / लड़की)',
    selectProfile:    'प्रोफ़ाइल चुनें…',
    searchPlaceholder:'नाम से खोजें…',
    noResults:        'कोई प्रोफ़ाइल नहीं मिली',
    noPatrika:        '⚠ इस प्रोफ़ाइल में पत्रिका छवि अपलोड नहीं है।',
    noPatrikaShort:   ' — पत्रिका नहीं',
    analyzeBtn:       'अनुकूलता विश्लेषण करें',
    analyzing:        'कुंडली का विश्लेषण हो रहा है… (लगभग 30 सेकंड)',
    bothNeedPatrika:  'दोनों प्रोफ़ाइल में पत्रिका छवि होनी चाहिए',
    profileDetails:   'निकाली गई प्रोफ़ाइल जानकारी',
    yrs:              'वर्ष',
    rashi:            'राशि',
    nakshatra:        'नक्षत्र',
    pada:             'पाद',
    lagna:            'लग्न',
    dob:              'जन्म तिथि',
    place:            'जन्म स्थान',
    ashtakoot:        'अष्टकूट मिलान',
    ashtakootSub:     '36 अंकीय वैदिक अनुकूलता',
    compatible:       '% अनुकूल',
    maxPts:           (n) => `अधिकतम ${n} अंक`,
    mangalDosha:      'मंगल दोष',
    manglik:          'मांगलिक',
    nonManglik:       'अमांगलिक',
    doshaCancelled:   'दोष निवारण',
    summary:          'ज्योतिषी का सारांश',
    gunas: {
      varna: 'वर्ण', vashya: 'वश्य', tara: 'तारा', yoni: 'योनि',
      graha_maitri: 'ग्रह मैत्री', gana: 'गण', bhakut: 'भकूट', nadi: 'नाड़ी',
    },
    recommendations: {
      HIGHLY_RECOMMENDED: 'अत्यंत अनुशंसित',
      RECOMMENDED:        'अनुशंसित',
      AVERAGE:            'सामान्य',
      NOT_RECOMMENDED:    'अनुशंसित नहीं',
    },
  },
  mr: {
    pageTitle:        'कुंडली जुळवणी',
    pageSubtitle:     'AI द्वारे पत्रिका सुसंगतता विश्लेषणासाठी दोन प्रोफाइल निवडा',
    language:         'भाषा',
    profileA:         'प्रोफाइल A (मुलगा / वर)',
    profileB:         'प्रोफाइल B (मुलगी / वधू)',
    selectProfile:    'प्रोफाइल निवडा…',
    searchPlaceholder:'नाव शोधा…',
    noResults:        'कोणताही प्रोफाइल सापडला नाही',
    noPatrika:        '⚠ या प्रोफाइलवर पत्रिका प्रतिमा अपलोड नाही.',
    noPatrikaShort:   ' — पत्रिका नाही',
    analyzeBtn:       'सुसंगतता तपासा',
    analyzing:        'कुंडली तपासली जात आहे… (सुमारे ३० सेकंद)',
    bothNeedPatrika:  'दोन्ही प्रोफाइलवर पत्रिका प्रतिमा असणे आवश्यक आहे',
    profileDetails:   'काढलेली प्रोफाइल माहिती',
    yrs:              'वर्षे',
    rashi:            'राशी',
    nakshatra:        'नक्षत्र',
    pada:             'पाद',
    lagna:            'लग्न',
    dob:              'जन्म तारीख',
    place:            'जन्म स्थान',
    ashtakoot:        'अष्टकूट मिलान',
    ashtakootSub:     '३६ गुण वैदिक सुसंगतता',
    compatible:       '% सुसंगत',
    maxPts:           (n) => `कमाल ${n} गुण`,
    mangalDosha:      'मंगळ दोष',
    manglik:          'मांगलिक',
    nonManglik:       'अमांगलिक',
    doshaCancelled:   'दोष निवारण',
    summary:          'ज्योतिषांचा सारांश',
    gunas: {
      varna: 'वर्ण', vashya: 'वश्य', tara: 'तारा', yoni: 'योनी',
      graha_maitri: 'ग्रह मैत्री', gana: 'गण', bhakut: 'भकूट', nadi: 'नाडी',
    },
    recommendations: {
      HIGHLY_RECOMMENDED: 'अत्यंत शिफारसीय',
      RECOMMENDED:        'शिफारसीय',
      AVERAGE:            'सामान्य',
      NOT_RECOMMENDED:    'शिफारसीय नाही',
    },
  },
  gu: {
    pageTitle:        'કુંડળી મેળ',
    pageSubtitle:     'AI દ્વારા પત્રિકા સુસંગતતા વિશ્લેષણ માટે બે પ્રોફાઇલ પસંદ કરો',
    language:         'ભાષા',
    profileA:         'પ્રોફાઇલ A (છોકરો / વર)',
    profileB:         'પ્રોફાઇલ B (છોકરી / વધૂ)',
    selectProfile:    'પ્રોફાઇલ પસંદ કરો…',
    searchPlaceholder:'નામ શોધો…',
    noResults:        'કોઈ પ્રોફાઇલ મળી નથી',
    noPatrika:        '⚠ આ પ્રોફાઇલ પર પત્રિકા છબી અપલોડ નથી.',
    noPatrikaShort:   ' — પત્રિકા નથી',
    analyzeBtn:       'સુસંગતતા તપાસો',
    analyzing:        'કુંડળી તપાસાઈ રહી છે… (આશરે ૩૦ સેકન્ડ)',
    bothNeedPatrika:  'બંને પ્રોફાઇલ પર પત્રિકા છબી હોવી જોઈએ',
    profileDetails:   'કાઢેલ પ્રોફાઇલ માહિતી',
    yrs:              'વર્ષ',
    rashi:            'રાશિ',
    nakshatra:        'નક્ષત્ર',
    pada:             'પાદ',
    lagna:            'લગ્ન',
    dob:              'જન્મ તારીખ',
    place:            'જન્મ સ્થળ',
    ashtakoot:        'અષ્ટકૂટ મિલન',
    ashtakootSub:     '36 ગુણ વૈદિક સુસંગતતા',
    compatible:       '% સુસંગત',
    maxPts:           (n) => `મહત્તમ ${n} ગુણ`,
    mangalDosha:      'મંગળ દોષ',
    manglik:          'માંગળિક',
    nonManglik:       'અમાંગળિક',
    doshaCancelled:   'દોષ નિવારણ',
    summary:          'જ્યોતિષીનો સારાંશ',
    gunas: {
      varna: 'વર્ણ', vashya: 'વશ્ય', tara: 'તારા', yoni: 'યોનિ',
      graha_maitri: 'ગ્રહ મૈત્રી', gana: 'ગણ', bhakut: 'ભકૂટ', nadi: 'નાડી',
    },
    recommendations: {
      HIGHLY_RECOMMENDED: 'અત્યંત ભલામણ',
      RECOMMENDED:        'ભલામણ',
      AVERAGE:            'સામાન્ય',
      NOT_RECOMMENDED:    'ભલામણ નહીં',
    },
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────
function ScoreBar({ points, max }) {
  const pct = max > 0 ? (points / max) * 100 : 0;
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right">{points}/{max}</span>
    </div>
  );
}

function ProfileCard({ profile, t }) {
  return (
    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-rose-200 overflow-hidden flex-shrink-0">
          {profile._images?.[0] ? (
            <img src={profile._images[0].url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-rose-500 text-xl">👤</span>
          )}
        </div>
        <div>
          <p className="font-bold text-gray-800">{profile.name}</p>
          <p className="text-xs text-gray-500">{profile.age} {t.yrs} · {profile.gender}</p>
        </div>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        {profile.rashi     && <p><span className="font-medium text-gray-700">{t.rashi}:</span> {profile.rashi}</p>}
        {profile.nakshatra && (
          <p>
            <span className="font-medium text-gray-700">{t.nakshatra}:</span>{' '}
            {profile.nakshatra}{profile.nakshatra_pada ? ` (${t.pada} ${profile.nakshatra_pada})` : ''}
          </p>
        )}
        {profile.lagna && <p><span className="font-medium text-gray-700">{t.lagna}:</span> {profile.lagna}</p>}
        {profile.dob   && <p><span className="font-medium text-gray-700">{t.dob}:</span> {profile.dob}</p>}
        {profile.pob   && <p><span className="font-medium text-gray-700">{t.place}:</span> {profile.pob}</p>}
      </div>
    </div>
  );
}

// Combobox profile selector — type to filter, highlights matching substring
function ProfileSelector({ gender, value, onChange, allProfiles, excludeId, loading, t, noPatrikaWarning }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const selected = allProfiles.find((p) => p._id === value);

  const candidates = allProfiles.filter((p) => p.gender === gender && p._id !== excludeId);
  const filtered = query.trim()
    ? candidates.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : candidates;

  // Wrap the matching substring in a highlight span
  const highlight = (name) => {
    const q = query.trim();
    if (!q) return name;
    const idx = name.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <mark className="bg-rose-100 text-rose-700 not-italic rounded-sm px-0.5">
          {name.slice(idx, idx + q.length)}
        </mark>
        {name.slice(idx + q.length)}
      </>
    );
  };

  const handleSelect = (profile) => {
    onChange(profile._id);
    setQuery('');
    setOpen(false);
  };

  const handleFocus = () => {
    setQuery('');
    setOpen(true);
  };

  const handleBlur = () => {
    // Delay close so onMouseDown on list items fires first
    setTimeout(() => setOpen(false), 150);
  };

  // Input displays the query while open, selected name while closed
  const displayValue = open ? query : (selected?.name ?? '');

  if (loading) {
    return <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />;
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={t.selectProfile}
        className="w-full border border-gray-200 rounded-xl px-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
      />
      {/* Chevron */}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs select-none">▾</span>

      {open && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-gray-400 italic">{t.noResults}</li>
          ) : (
            filtered.map((p) => (
              <li
                key={p._id}
                onMouseDown={() => handleSelect(p)}
                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2
                  ${p._id === value ? 'bg-rose-50 text-rose-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <span>
                  {highlight(p.name)}
                  <span className="text-gray-400 text-xs font-normal ml-1">· {p.age} {t.yrs}</span>
                </span>
                <span className="flex-shrink-0 text-xs text-gray-400">
                  {p.patrikaImage ? '✓' : t.noPatrikaShort.trim()}
                </span>
              </li>
            ))
          )}
        </ul>
      )}

      {noPatrikaWarning && (
        <p className="text-xs text-amber-600 mt-1">{t.noPatrika}</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MatchPage() {
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];

  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profileAId, setProfileAId] = useState('');
  const [profileBId, setProfileBId] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const fetchAbortRef = useRef(null);
  const matchAbortRef = useRef(null);

  useEffect(() => {
    fetchAbortRef.current = new AbortController();
    const { signal } = fetchAbortRef.current;
    fetchProfiles(false, signal)
      .then((data) => { if (!signal.aborted) setProfiles(data); })
      .catch((err) => { if (!isAbortError(err)) {} })
      .finally(() => { if (!signal.aborted) setLoadingProfiles(false); });
    return () => {
      fetchAbortRef.current?.abort();
      matchAbortRef.current?.abort();
    };
  }, []);

  const profileA = profiles.find((p) => p._id === profileAId);
  const profileB = profiles.find((p) => p._id === profileBId);
  const canAnalyze =
    profileAId && profileBId &&
    profileAId !== profileBId &&
    profileA?.patrikaImage &&
    profileB?.patrikaImage;

  const handleAnalyze = async () => {
    matchAbortRef.current?.abort();
    matchAbortRef.current = new AbortController();
    const { signal } = matchAbortRef.current;
    setAnalyzing(true);
    setReport(null);
    setError(null);
    try {
      const data = await matchProfiles(profileAId, profileBId, lang, signal);
      if (!signal.aborted) {
        if (data.profileA) data.profileA._images = profileA?.images;
        if (data.profileB) data.profileB._images = profileB?.images;
        setReport(data);
      }
    } catch (err) {
      if (!isAbortError(err)) setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      if (!signal.aborted) setAnalyzing(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      {/* Header with language selector */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t.pageTitle}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t.pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.language}</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Profile selectors */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Profile A — Male only */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              {t.profileA}
            </label>
            <ProfileSelector
              gender="Male"
              value={profileAId}
              onChange={(id) => { setProfileAId(id); setReport(null); }}
              allProfiles={profiles}
              excludeId={profileBId}
              loading={loadingProfiles}
              t={t}
              noPatrikaWarning={profileAId && !profileA?.patrikaImage}
            />
          </div>

          {/* Profile B — Female only */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              {t.profileB}
            </label>
            <ProfileSelector
              gender="Female"
              value={profileBId}
              onChange={(id) => { setProfileBId(id); setReport(null); }}
              allProfiles={profiles}
              excludeId={profileAId}
              loading={loadingProfiles}
              t={t}
              noPatrikaWarning={profileBId && !profileB?.patrikaImage}
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || analyzing}
          title={!canAnalyze ? t.bothNeedPatrika : ''}
          className="w-full bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {t.analyzeBtn}
        </button>

        {error && (
          <p className="mt-3 text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      {/* Report */}
      {report && (
        <div className="space-y-6">
          {/* Profile summaries */}
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-3">{t.profileDetails}</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <ProfileCard profile={report.profileA} t={t} />
              <ProfileCard profile={report.profileB} t={t} />
            </div>
          </div>

          {/* Score overview */}
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-800">{t.ashtakoot}</h2>
                <p className="text-xs text-gray-400">{t.ashtakootSub}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-3xl font-bold text-rose-600">
                    {report.ashtakoot?.total?.points ?? '—'}
                    <span className="text-lg font-medium text-gray-400">/36</span>
                  </p>
                  <p className="text-xs text-gray-400">{report.compatibility_percentage ?? '—'}{t.compatible}</p>
                </div>
                {report.recommendation && (() => {
                  const color = RECOMMENDATION_COLORS[report.recommendation] || 'bg-gray-100 text-gray-800 border-gray-200';
                  const label = t.recommendations[report.recommendation] || report.recommendation;
                  return (
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${color}`}>
                      {label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Guna table */}
            <div className="divide-y divide-gray-50">
              {Object.entries(GUNA_MAX).map(([key, max]) => {
                const guna = report.ashtakoot?.[key];
                return (
                  <div key={key} className="py-3 grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] gap-3 items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{t.gunas[key]}</p>
                      <p className="text-xs text-gray-400">{t.maxPts(max)}</p>
                    </div>
                    <div className="space-y-1">
                      <ScoreBar points={guna?.points ?? 0} max={max} />
                      {guna?.details && (
                        <p className="text-xs text-gray-500">{guna.details}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mangal Dosha */}
          {report.mangal_dosha && (
            <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-3">{t.mangalDosha}</h2>
              <div className="flex flex-wrap gap-3 mb-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${report.mangal_dosha.profile_a ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  {report.profileA?.name}: {report.mangal_dosha.profile_a ? t.manglik : t.nonManglik}
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${report.mangal_dosha.profile_b ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  {report.profileB?.name}: {report.mangal_dosha.profile_b ? t.manglik : t.nonManglik}
                </span>
                {report.mangal_dosha.cancellation && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                    {t.doshaCancelled}
                  </span>
                )}
              </div>
              {report.mangal_dosha.details && (
                <p className="text-sm text-gray-600">{report.mangal_dosha.details}</p>
              )}
            </div>
          )}

          {/* Summary */}
          {report.summary && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
              <h2 className="text-base font-bold text-amber-800 mb-2">{t.summary}</h2>
              <p className="text-sm text-amber-900 leading-relaxed">{report.summary}</p>
            </div>
          )}
        </div>
      )}
      {/* Full-screen analysis overlay */}
      {analyzing && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-white/85 backdrop-blur-sm">
          <KundaliLoader />
          <div className="text-center">
            <p className="text-base font-semibold text-rose-700">{t.analyzing}</p>
          </div>
        </div>
      )}
    </main>
  );
}
