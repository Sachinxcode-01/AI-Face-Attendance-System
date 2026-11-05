import os

avatars_dir = 'mobile/assets/avatars'
os.makedirs(avatars_dir, exist_ok=True)

avatars = {
    'avatar_student_boy.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#312E81"/>
    </linearGradient>
    <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FED7AA"/>
      <stop offset="100%" stop-color="#FDBA74"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="url(#bg)" stroke="#818CF8" stroke-width="4"/>
  <path d="M28 116 C28 92 42 80 64 80 C86 80 100 92 100 116 Z" fill="#1E1B4B"/>
  <path d="M48 86 L64 104 L80 86 Z" fill="#6366F1"/>
  <rect x="56" y="72" width="16" height="18" rx="4" fill="#FDBA74"/>
  <ellipse cx="64" cy="56" rx="24" ry="28" fill="url(#skin)"/>
  <path d="M40 50 C40 32 50 24 64 24 C78 24 88 32 88 50 C82 44 76 42 64 42 C52 42 46 46 40 50 Z" fill="#312E81"/>
  <circle cx="54" cy="54" r="3" fill="#1E1B4B"/>
  <circle cx="74" cy="54" r="3" fill="#1E1B4B"/>
  <path d="M57 66 Q64 72 71 66" stroke="#C2410C" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>''',

    'avatar_student_girl.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bgGirl" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EC4899"/>
      <stop offset="100%" stop-color="#831843"/>
    </linearGradient>
    <linearGradient id="skinGirl" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFEDD5"/>
      <stop offset="100%" stop-color="#FED7AA"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="url(#bgGirl)" stroke="#F472B6" stroke-width="4"/>
  <path d="M34 50 C34 90 40 105 40 115 L88 115 C88 105 94 90 94 50 Z" fill="#500724"/>
  <path d="M28 116 C28 94 42 84 64 84 C86 84 100 94 100 116 Z" fill="#F43F5E"/>
  <rect x="56" y="72" width="16" height="18" rx="4" fill="#FED7AA"/>
  <ellipse cx="64" cy="56" rx="24" ry="27" fill="url(#skinGirl)"/>
  <path d="M38 48 C42 30 52 24 64 24 C76 24 86 30 90 48 C82 38 72 36 64 40 C56 36 46 38 38 48 Z" fill="#831843"/>
  <circle cx="53" cy="55" r="3" fill="#4C0519"/>
  <circle cx="75" cy="55" r="3" fill="#4C0519"/>
  <path d="M57 67 Q64 73 71 67" stroke="#E11D48" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>''',

    'avatar_tech.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bgTech" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#0E7490"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="url(#bgTech)" stroke="#22D3EE" stroke-width="4"/>
  <path d="M26 116 C26 90 42 78 64 78 C86 78 102 90 102 116 Z" fill="#0F172A"/>
  <path d="M58 84 L64 102 L70 84 Z" fill="#06B6D4"/>
  <rect x="56" y="70" width="16" height="18" fill="#FDBA74"/>
  <ellipse cx="64" cy="54" rx="24" ry="26" fill="#FED7AA"/>
  <path d="M38 46 C38 28 50 22 64 22 C78 22 90 28 90 46 Z" fill="#1E293B"/>
  <rect x="44" y="48" width="16" height="12" rx="3" fill="none" stroke="#22D3EE" stroke-width="2.5"/>
  <rect x="68" y="48" width="16" height="12" rx="3" fill="none" stroke="#22D3EE" stroke-width="2.5"/>
  <line x1="60" y1="54" x2="68" y2="54" stroke="#22D3EE" stroke-width="2.5"/>
  <circle cx="52" cy="54" r="2" fill="#22D3EE"/>
  <circle cx="76" cy="54" r="2" fill="#22D3EE"/>
  <path d="M58 66 Q64 70 70 66" stroke="#0E7490" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>''',

    'avatar_professor.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bgProf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#78350F"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="url(#bgProf)" stroke="#FBBF24" stroke-width="4"/>
  <path d="M26 116 C26 92 40 82 64 82 C88 82 102 92 102 116 Z" fill="#1C1917"/>
  <polygon points="64,82 58,98 64,116 70,98" fill="#EF4444"/>
  <rect x="56" y="70" width="16" height="18" rx="3" fill="#F5D0C5"/>
  <ellipse cx="64" cy="54" rx="24" ry="27" fill="#FCE7F3"/>
  <path d="M38 52 C36 30 48 24 64 24 C80 24 92 30 90 52 C88 44 80 40 64 40 C48 40 40 44 38 52 Z" fill="#94A3B8"/>
  <circle cx="52" cy="54" r="8" fill="none" stroke="#D97706" stroke-width="2"/>
  <circle cx="76" cy="54" r="8" fill="none" stroke="#D97706" stroke-width="2"/>
  <line x1="60" y1="54" x2="68" y2="54" stroke="#D97706" stroke-width="2"/>
  <circle cx="52" cy="54" r="2.5" fill="#1C1917"/>
  <circle cx="76" cy="54" r="2.5" fill="#1C1917"/>
  <path d="M54 66 C58 64 64 67 64 67 C64 67 70 64 74 66 C70 70 64 69 64 69 C64 69 58 70 54 66 Z" fill="#64748B"/>
</svg>''',

    'avatar_graduate.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#064E3B"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="url(#bgGrad)" stroke="#34D399" stroke-width="4"/>
  <path d="M26 116 C26 92 42 82 64 82 C86 82 102 92 102 116 Z" fill="#064E3B"/>
  <polygon points="64,82 56,104 64,116 72,104" fill="#F59E0B"/>
  <rect x="56" y="72" width="16" height="18" rx="4" fill="#FED7AA"/>
  <ellipse cx="64" cy="58" rx="24" ry="26" fill="#FFEDD5"/>
  <polygon points="64,16 102,32 64,44 26,32" fill="#0F172A"/>
  <rect x="50" y="38" width="28" height="10" rx="2" fill="#1E293B"/>
  <line x1="64" y1="32" x2="96" y2="46" stroke="#F59E0B" stroke-width="2.5"/>
  <circle cx="96" cy="48" r="3" fill="#F59E0B"/>
  <circle cx="54" cy="60" r="3" fill="#0F172A"/>
  <circle cx="74" cy="60" r="3" fill="#0F172A"/>
  <path d="M57 70 Q64 76 71 70" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>''',

    'avatar_ai.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bgAi" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="url(#bgAi)" stroke="#A78BFA" stroke-width="4"/>
  <path d="M32 116 C32 94 44 86 64 86 C84 86 96 94 96 116 Z" fill="#1E1B4B"/>
  <rect x="40" y="36" width="48" height="40" rx="16" fill="#0F172A" stroke="#8B5CF6" stroke-width="3"/>
  <line x1="64" y1="36" x2="64" y2="22" stroke="#A78BFA" stroke-width="3"/>
  <circle cx="64" cy="20" r="5" fill="#06B6D4"/>
  <rect x="48" y="48" width="32" height="14" rx="7" fill="#06B6D4"/>
  <circle cx="56" cy="55" r="3" fill="#FFFFFF"/>
  <circle cx="72" cy="55" r="3" fill="#FFFFFF"/>
</svg>'''
}

for filename, content in avatars.items():
    path = os.path.join(avatars_dir, filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    print(f'Wrote {filename}')
