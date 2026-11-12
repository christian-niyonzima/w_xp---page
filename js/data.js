/* ==========================================================================
 *  EDIT ME — everything personal on the site lives in this one file.
 *
 *  The desktop folders, the Web Explorer links, the Start menu and the
 *  Matrix terminal all read from PROFILE below. Replace the placeholder
 *  text (anything that says "Company Name", "University Name", etc.) with
 *  your own story, save, and refresh the page.
 * ========================================================================== */
window.PROFILE = {
  name: 'Christian Niyonzima',
  firstName: 'Christian',
  title: 'Software Developer',
  tagline: 'I build things for the web — with a soft spot for 2002.',
  location: 'Your City, Country',
  status: 'Open to new opportunities',

  // Square photo of you, e.g. 'assets/me.jpg'. Leave empty for initials.
  avatar: '',
  // Your CV, e.g. 'assets/resume.pdf'. Leave empty to hide every resume link.
  resume: '',
  email: 'you@example.com', // ← your real address (placeholders stay hidden from visitors)

  // Public address of this site. Printed on the résumé and used for shared links.
  siteUrl: 'https://christian-niyonzima.github.io/w_xp---page/',

  // Desktop wallpaper. Empty = assets/bliss.jpg (the classic "Bliss" photo). Point this
  // at any other picture, e.g. 'assets/my-wallpaper.jpg'. If no picture can be found at
  // all, a hand-drawn look-alike (assets/wallpaper.jpg) is shown instead.
  wallpaperImage: '',

  // Smooth sweep transitions between screens, folders, windows and menus.
  // Set to false for no animations at all (visitors can also switch them off
  // in Display Properties → Appearance).
  transitions: true,

  about: {
    // One or two sentences for the top of the printable résumé.
    summary:
      'Software developer who enjoys turning ideas into polished products people can click, tap and play with. I care about clean code, interfaces that feel good to use, and learning something new every week.',
    bio: [
      "Hi, I'm Christian — a developer who likes turning ideas into things people can click, tap and play with.",
      'I care about clean code, interfaces that feel good to use, and learning something new every week. This desktop is a small example: a Windows XP machine with a Matrix terminal hidden inside.',
      "Have a look around the folders, or open the Terminal and type help. If you like what you see, I'd love to hear from you.",
    ],
    skills: [
      { group: 'Languages', items: ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Python', 'SQL'] },
      { group: 'Frameworks & tools', items: ['React', 'Node.js', 'Git', 'REST APIs', 'Figma'] },
      { group: 'Ways of working', items: ['Problem solving', 'Teamwork', 'Clear communication', 'Curiosity'] },
    ],
    // Name + comfort level from 0 to 100. Shown as XP progress bars.
    levels: [
      ['JavaScript', 85],
      ['HTML & CSS', 90],
      ['React', 75],
      ['Python', 65],
      ['Git', 80],
    ],
    funFacts: [
      'Can still hum the Windows XP startup sound from memory.',
      'Built this desktop instead of a boring one-page resume.',
      'Has seen The Matrix more times than is probably healthy.',
      'Believes every good project starts with a sketch on paper.',
    ],
  },

  // Shown in the Web Explorer, the Start menu, the terminal, the About Me folder and the
  // printable résumé. icon: linkedin | github | mail | globe | pdf
  links: [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/your-profile/', // ← put your LinkedIn URL here
      desc: 'My professional profile. Connect with me!',
      icon: 'linkedin',
    },
    {
      id: 'github',
      label: 'GitHub',
      url: 'https://github.com/christian-niyonzima',
      desc: 'Code, experiments and side quests.',
      icon: 'github',
    },
    {
      id: 'email',
      label: 'E-mail',
      url: 'mailto:you@example.com', // ← and your email here
      desc: 'Say hello. I read everything.',
      icon: 'mail',
    },
    {
      id: 'source',
      label: 'This site',
      url: 'https://github.com/christian-niyonzima/w_xp---page',
      desc: 'The source code of this XP desktop.',
      icon: 'globe',
      hideOnResume: true, // keep it off the printable résumé
    },
  ],

  projects: [
    {
      name: 'XP Career Desktop',
      year: '2026',
      role: 'Design & development',
      summary: 'This website: a Windows XP desktop with smooth sweep transitions and a Matrix terminal hidden inside.',
      details: [
        'Window manager with dragging, resizing, minimise/maximise and a Flip 3D window switcher.',
        'Explorer folders that sweep smoothly from view to view, with an option to turn all animation off.',
        'A Matrix terminal with digital rain, a fake file system, tab-completion and command history.',
        'Plain HTML, CSS and JavaScript. No frameworks, no build step.',
      ],
      tech: ['HTML', 'CSS', 'JavaScript', 'Canvas', 'Web Audio'],
      links: [{ label: 'View source', url: 'https://github.com/christian-niyonzima/w_xp---page' }],
    },
    {
      name: 'Diet & Training Planner',
      year: '2026',
      role: 'Personal project',
      summary: 'Answer a few questions and get a meal-prep plan with a shopping list, plus a weekly workout schedule.',
      details: [
        'Turns a short questionnaire into a personal meal-prep plan, complete with a shopping list.',
        'Builds a weekly workout schedule from a library of 1,300+ exercises.',
        'Written in Python, with a Streamlit interface.',
      ],
      tech: ['Python', 'Streamlit'],
      links: [{ label: 'View source', url: 'https://github.com/christian-niyonzima/Diet-and-training-planner' }],
    },
    {
      name: 'Another Side Project',
      year: '2024',
      role: 'Hackathon / personal',
      summary: 'Something you built just because you were curious. Those are often the best stories.',
      details: ['Add 2–4 short bullet points.', 'Numbers help: users, speed-ups, stars, prizes.'],
      tech: ['Tech', 'Stack'],
      links: [],
    },
  ],

  experience: [
    {
      company: 'Company Name',
      role: 'Job Title',
      start: '2025',
      end: 'Present',
      location: 'City / Remote',
      type: 'Full-time',
      summary: 'One line about the team you joined and what you owned.',
      bullets: [
        'Shipped a feature that improved something measurable.',
        'Worked with design and product to turn ideas into releases.',
        'Automated, mentored, documented: whatever you are proud of.',
      ],
      tech: ['JavaScript', 'React', 'Node.js'],
    },
    {
      company: 'Previous Company',
      role: 'Internship / Part-time role',
      start: '2024',
      end: '2024',
      location: 'City',
      type: 'Internship',
      summary: 'What you learned and the impact you had.',
      bullets: ['Built…', 'Improved…', 'Learned…'],
      tech: ['Python', 'SQL'],
    },
  ],

  studies: [
    {
      school: 'University Name',
      degree: 'B.Sc. in Your Field of Study',
      start: '2022',
      end: '2026',
      location: 'City, Country',
      summary: 'A sentence about your focus, thesis or favourite subjects.',
      bullets: [
        'Relevant coursework: Data Structures, Algorithms, Web Development, Databases.',
        'Activities: hackathons, coding club, volunteering…',
      ],
    },
    {
      school: 'Courses & Certificates',
      degree: 'Self-taught, always learning',
      start: '',
      end: 'Ongoing',
      location: 'Online',
      summary: 'Online courses, bootcamps or certifications worth mentioning.',
      bullets: ['Course or certificate name: provider (year)'],
    },
  ],

  // Just for fun. Shown when somebody opens the Recycle Bin.
  recycleBin: [
    {
      name: 'excuses.txt',
      icon: 'txt',
      text: [
        '1. It works on my machine.',
        "2. That's not a bug, it's a feature.",
        '3. Must be a caching issue.',
        '4. Have you tried turning it off and on again?',
      ],
    },
    {
      name: 'my_first_website.html',
      icon: 'html',
      text: [
        '<marquee>WELCOME 2 MY HOMEPAGE!!!</marquee>',
        '[under_construction.gif]',
        'You are visitor #000042',
        'Sign my guestbook!!',
      ],
    },
    {
      name: 'clippy.exe',
      icon: 'exe',
      text: [
        "It looks like you're trying to hire a developer.",
        '',
        'Would you like help?',
      ],
      actions: [
        { label: 'Yes, show me the Experience folder', open: 'experience' },
        { label: 'No, I will type "help" in the terminal', open: 'terminal' },
      ],
    },
    { name: 'spoon.obj', icon: 'unknown', text: ['There is no spoon.'] },
  ],
};
