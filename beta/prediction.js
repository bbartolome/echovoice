'use strict';
(function () {

  const EV_PRED_KEY = 'ev-pred';
  const PHRASE_CAP  = 200;

  // ── Seed words (care-weighted; index = rank priority) ─────────────────────
  const SEED_WORDS = [
    'I','a','the','to','and','is','are','was','be','been','have','has','had',
    'will','would','can','could','should','need','want','like','feel','think',
    'know','see','look','get','go','do','come','say','tell','ask','help','try',
    'put','give','sit','lay','rest','sleep','eat','drink','move','turn','call',
    'it','he','she','we','you','they','my','your','his','her','me','him','us',
    'them','our','this','that','these','those',
    'of','in','on','at','for','with','by','from','as','up','out','about','into',
    'through','before','after','over','between','not','no','yes','okay','so',
    'if','or','but','an','what','when','where','who','how','why','which',
    'good','fine','better','worse','more','less','very','too','now','please',
    'thank','thanks','sorry','little','much','some','any','all','every','just',
    'hot','cold','warm','cool','comfortable','uncomfortable','tired','awake',
    'sleepy','ready','sure','right','wrong','here','there','today','tomorrow',
    'yesterday','morning','afternoon','evening','night','time','moment','minute',
    'happy','sad','worried','frustrated','grateful','wonderful','difficult',
    'water','nurse','doctor','family','love','pain','ache','hurt','medication',
    'medicine','repositioned','position','pillow','blanket','temperature',
    'window','light','dark','quiet','loud','phone','tablet','television','music',
    'book','glasses','straw','scratch','massage','fan','suction','itchy',
    'hungry','thirsty','nauseous','dizzy','anxious','bored','something',
    'nothing','everything','anything','someone','everyone','maybe','actually',
    'really','another',
    // Extended general high-frequency
    'also','back','day','days','each','even','front','full','great','hand',
    'home','keep','last','let','life','long','make','mean','might','mind',
    'next','nice','open','other','own','place','same','show','side','small',
    'soon','start','stay','still','stop','such','take','thing','things',
    'told','true','until','use','way','well','went','work','years','yet',
    'always','around','away','both','change','coming','done','down','enough',
    'hold','inside','large','later','left','many','near','never','new','often',
    'once','only','outside','part','people','quite','rather','since','slow',
    'sometimes','stand','than','though','together','toward','under','usually',
    'without','young','already','almost','along','also','although','among',
    'appear','because','called','come','early','enough','every','felt','form',
    'found','give','given','goes','going','grow','high','himself','however',
    'kind','knew','known','less','likely','made','means','most','move','near',
    'needed','often','order','past','point','power','probably','remain','said',
    'seems','set','short','show','since','small','something','sometimes','stand',
    'such','suddenly','took','toward','turned','upon','using','usually','whole',
    'whose','within','without','words','world',
  ];

  // ── Seed phrases ──────────────────────────────────────────────────────────
  const SEED_PHRASES = [
    'I need to be repositioned',
    'Please turn me a little',
    'I am comfortable now',
    'I need water please',
    'Thank you',
    'I love you',
    'One moment please',
    'Please call the nurse',
    'I need help',
    'I am in pain',
    'Please scratch my head',
    'I am tired',
    'I am hungry',
    'I am thirsty',
    'Good morning',
    'Good night',
    'Good afternoon',
    'Good evening',
    'I feel good',
    'I feel better',
    'I am feeling better',
    'I am feeling anxious',
    'I need medication',
    'Please call the doctor',
    'I need my glasses',
    'Can you turn on the television',
    'Please turn off the light',
    'I am too hot',
    'I am too cold',
    'I love you very much',
    'I love you so much',
    'Thank you so much',
    'I am okay',
    'I need a moment',
    'Please move me',
    'Scratch my head',
    'One moment',
    'I want to rest',
    'Can you hear me',
    'Please adjust my pillow',
    'I need the fan on',
    'I need the fan off',
    'Please lower the television volume',
    'I need suction please',
    'I am not comfortable',
    'Something is bothering me',
    'Please hold my hand',
  ];

  // ── Private state ─────────────────────────────────────────────────────────
  let _inst         = null;   // Predictionary instance
  let _phrases      = [];     // [{ text, count }] — whole-phrase store
  let _personalWords = [];    // names/places/terms from admin, for priority matching
  let _ready        = false;

  // ── Public API (window.Pred) ──────────────────────────────────────────────
  const Pred = {

    init() {
      if (_ready) return;
      _ready = true;
      _inst = Predictionary.instance();

      const saved = _tryLoad();
      if (saved) {
        _inst.loadDictionaries(saved.dict);
        _phrases = Array.isArray(saved.phrases) ? saved.phrases : [];
      }

      // Ensure all seed words are present (addWord is idempotent — skips existing)
      SEED_WORDS.forEach((w, i) => _inst.addWord({ word: w, rank: i + 1 }));

      // Ensure seed phrases are in the phrase store
      SEED_PHRASES.forEach(p => {
        if (!_phrases.find(x => x.text === p)) _phrases.push({ text: p, count: 0 });
      });

      // First run only: bootstrap n-gram transitions from seed phrases
      if (!saved) SEED_PHRASES.forEach(p => _inst.learnFromText(p));
    },

    setAdminData({ personalWords = [], phrases = [] }) {
      if (!_inst) return;
      _personalWords = personalWords.filter(Boolean);
      // Register personal words in the dictionary so they participate in n-gram learning
      _personalWords.forEach(w => _inst.addWord({ word: w }));
      // Merge admin quick phrases (all of them, not just the 4 shown on screen)
      phrases.filter(Boolean).forEach(p => {
        if (!_phrases.find(x => x.text === p)) _phrases.push({ text: p, count: 0 });
      });
    },

    compute(message) {
      if (!_inst) return [];
      const msg         = message || '';
      const endsSpace   = msg.endsWith(' ');
      const trimmed     = msg.trimEnd();

      if (!trimmed) return _topPhrases(5);

      const parts   = trimmed.split(/\s+/).filter(Boolean);
      const partial = endsSpace ? '' : (parts[parts.length - 1] || '');
      const lastWord = endsSpace
        ? (parts[parts.length - 1] || '')
        : (parts[parts.length - 2] || '');

      return endsSpace ? _nextWord(trimmed, lastWord) : _complete(trimmed, partial);
    },

    commitWord(prevWord, word) {
      if (_inst && word) {
        _inst.learn(word, prevWord || '');
        _trySave();
      }
    },

    commitPhrase(phrase) {
      if (!_inst || !phrase) return;
      const entry = _phrases.find(x => x.text === phrase);
      if (entry) {
        entry.count++;
      } else if (_phrases.length < PHRASE_CAP) {
        _phrases.push({ text: phrase, count: 1 });
      }
      _inst.learnFromText(phrase);
      _trySave();
    },

    commitMessage(message) {
      if (!_inst || !message || !message.trim()) return;
      const text = message.trim();
      _inst.learnFromText(text);
      const entry = _phrases.find(x => x.text.toLowerCase() === text.toLowerCase());
      if (entry) entry.count++;
      _trySave();
    },
  };

  // ── Completion mode (mid-word) ────────────────────────────────────────────
  function _complete(trimmed, partial) {
    const results = [];
    const tl = trimmed.toLowerCase();
    const pl = partial.toLowerCase();

    // 1. Phrases where the full typed draft is a prefix (up to 2 slots)
    _phrases
      .filter(p => p.text.toLowerCase().startsWith(tl))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .forEach(p => results.push(p.text));

    // 2. Personal-vocab prefix matches — always before generic words
    if (pl) {
      _personalWords.forEach(w => {
        if (
          w.toLowerCase().startsWith(pl) &&
          w.toLowerCase() !== pl &&
          !results.includes(w) &&
          results.length < 5
        ) results.push(w);
      });
    }

    // 3. Word completions from Predictionary — filter to genuine prefix matches only
    //    (suppresses the fuzzy fallback that would kick in for short partial words)
    if (pl && results.length < 5) {
      _inst.predictCompleteWord(partial, { maxPredictions: 15 }).forEach(w => {
        if (
          !results.includes(w) &&
          w.toLowerCase().startsWith(pl) &&
          results.length < 5
        ) results.push(w);
      });
    }

    return results.slice(0, 5);
  }

  // ── Next-word mode (trailing space) ──────────────────────────────────────
  function _nextWord(trimmed, lastWord) {
    const results = [];
    const tl = trimmed.toLowerCase();

    // 1. Phrases that continue what's already typed
    _phrases
      .filter(p => p.text.toLowerCase().startsWith(tl + ' '))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .forEach(p => results.push(p.text));

    // 2. N-gram next-word predictions
    if (lastWord) {
      _inst.predictNextWord(lastWord, { maxPredictions: 10 })
        .sort((a, b) => b.frequency - a.frequency)
        .forEach(({ word }) => {
          if (!results.includes(word) && results.length < 5) results.push(word);
        });
    }

    // 3. Generic fallback
    ['and', 'but', 'please', 'now', 'I'].forEach(w => {
      if (!results.includes(w) && results.length < 5) results.push(w);
    });

    return results.slice(0, 5);
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  function _topPhrases(n) {
    return _phrases
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, n)
      .map(p => p.text);
  }

  // ── Persistence ───────────────────────────────────────────────────────────
  function _tryLoad() {
    try {
      const raw = localStorage.getItem(EV_PRED_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      return d && d.dict ? d : null;
    } catch { return null; }
  }

  function _trySave() {
    try {
      localStorage.setItem(EV_PRED_KEY, JSON.stringify({
        dict:    _inst.dictionariesToJSON(),
        phrases: _phrases,
      }));
    } catch { /* storage quota — silent */ }
  }

  window.Pred = Pred;
})();
