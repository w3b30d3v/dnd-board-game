// Personality Templates for D&D Character Builder
// Clean, family-friendly content for all personality fields

export const PERSONALITY_TEMPLATES = {
  personalityTrait: {
    generic: [
      "I always have a plan for what to do when things go wrong.",
      "I am incredibly slow to trust. Those who seem the fairest often have the most to hide.",
      "I would rather make a new friend than a new enemy.",
      "I've read every book in the world's greatest libraries—or I like to boast that I have.",
      "I'm always polite and respectful, even to my enemies.",
      "I can find common ground between the fiercest enemies, empathizing with them.",
      "Nothing can shake my optimistic attitude.",
      "I misuse long words in an attempt to sound smarter.",
      "I get bored easily. When am I going to get on with my destiny?",
      "I believe that everything worth doing is worth doing right.",
      "I'm always calm, no matter what the situation. I never raise my voice or let my emotions control me.",
      "I idolize a particular hero of my faith and constantly refer to that person's deeds and example.",
      "I see omens in every event and action. The gods try to speak to us, we just need to listen.",
      "I quote sacred texts and proverbs in almost every situation.",
      "I'm tolerant of other faiths and respect the worship of other gods.",
      "I've enjoyed fine food, drink, and high society among my temple's elite.",
      "I've spent so long in the temple that I have little practical experience dealing with people.",
    ],

    byRace: {
      human: [
        "I'm driven to succeed because I want to prove I'm just as capable as anyone.",
        "I judge people by their actions, not their ancestry.",
        "I'm full of witty aphorisms and have a proverb for every occasion.",
      ],
      elf: [
        "I've seen empires rise and fall. What's a few more decades?",
        "I feel more at home among the trees than in any city.",
        "I appreciate beauty in all its forms, from art to nature to well-crafted magic.",
        "I'm fascinated by human culture and how quickly it changes.",
      ],
      dwarf: [
        "I take great pride in my clan's craftsmanship and heritage.",
        "Gold is the measure of all things, including respect.",
        "I judge people by their actions, not their words.",
        "If someone is in trouble, I'm always ready to lend aid.",
      ],
      halfling: [
        "I am always curious about new places and new people.",
        "I enjoy a good meal more than almost anything else.",
        "I'm small, but I never let that stop me from standing up to bullies.",
        "I slip away from trouble before anyone notices.",
      ],
      dragonborn: [
        "My honor is my life. I will not break my word.",
        "I carry the pride of my ancestors in everything I do.",
        "I believe that proving myself in battle is the highest honor.",
      ],
      tiefling: [
        "I try to be my best self despite the prejudice I face.",
        "I know what it's like to be an outsider, so I'm kind to all who feel alone.",
        "I have a dark sense of humor that others don't always appreciate.",
      ],
      gnome: [
        "I'm always tinkering with something, even if it doesn't need fixing.",
        "I love a good puzzle more than almost anything.",
        "Life is too short to be taken seriously all the time!",
      ],
      'half-elf': [
        "I never truly fit in anywhere, so I've learned to adapt.",
        "I can find common ground with almost anyone.",
        "I've learned to read people well, out of necessity.",
      ],
      'half-orc': [
        "I prove my worth through strength and determination.",
        "Actions speak louder than words, and mine speak volumes.",
        "I'm fiercely loyal to those who accept me.",
      ],
    },

    byClass: {
      fighter: [
        "I face problems head-on. A simple, direct solution is the best path.",
        "I've lost too many friends in battle. I don't let myself get close to people anymore.",
        "I can stare down a hell hound without flinching.",
        "I enjoy being strong and like breaking things.",
      ],
      wizard: [
        "I'm convinced that people are always trying to steal my secrets.",
        "I speak without really thinking through my words, invariably insulting others.",
        "I'm used to helping out those who aren't as smart as I am.",
        "There's nothing I like more than a good mystery.",
      ],
      rogue: [
        "I always have an escape route planned, in case things go wrong.",
        "I pocket anything I see that might have some value.",
        "I lie about almost everything, even when there's no reason to.",
        "I am incredibly slow to trust anyone.",
      ],
      cleric: [
        "I see omens in every event and action. The gods try to speak to us constantly.",
        "I trust that my deity will guide my actions. I have faith that if I work hard, things will go well.",
        "I am tolerant of other faiths and respect the worship of other gods.",
      ],
      paladin: [
        "I face my enemies head-on and protect the innocent.",
        "I can find common ground between the fiercest enemies.",
        "I believe if I just do my best every day, good will triumph.",
      ],
      ranger: [
        "I'm happiest when surrounded by nature.",
        "I watch over my friends as if they were my pack.",
        "I'm always picking things apart to see how they work.",
      ],
      barbarian: [
        "I have a lesson for every situation, drawn from observing nature.",
        "I place no stock in wealthy or well-mannered folk.",
        "I'm driven by a wandering spirit that gets me into trouble.",
      ],
      bard: [
        "I know a story relevant to almost every situation.",
        "I change my mood or my mind as quickly as I change key in a song.",
        "I love a good insult, even one directed at me.",
      ],
      druid: [
        "I feel far more comfortable around animals than people.",
        "The natural world is more important than the constructions of civilization.",
        "I've been isolated for so long that I rarely speak.",
      ],
      monk: [
        "I am utterly serene, even in the face of disaster.",
        "I connect everything that happens to me to a grand cosmic plan.",
        "I'm oblivious to etiquette and social expectations.",
      ],
      sorcerer: [
        "My power makes me confident—perhaps overconfident.",
        "I don't understand why people don't just accept that I'm better than them.",
        "I hide my true self behind a mask of charm.",
      ],
      warlock: [
        "I keep my pact a secret, even from those I trust.",
        "I'm always looking for signs from my patron.",
        "I laugh at the idea of morality. Everything is power.",
      ],
    },

    byBackground: {
      noble: [
        "My eloquent flattery makes everyone I talk to feel wonderful.",
        "Despite my noble birth, I do not place myself above other folk.",
        "No one could doubt by looking at my regal bearing that I am a cut above the unwashed masses.",
      ],
      soldier: [
        "I can stare down a hell hound without flinching.",
        "I'm always polite and respectful.",
        "I'm haunted by memories of war. I can't get the images out of my mind.",
      ],
      criminal: [
        "I always have an exit strategy planned.",
        "I don't pay attention to the risks in a situation. Never tell me the odds.",
        "The best way to get me to do something is to tell me I can't do it.",
      ],
      acolyte: [
        "I idolize a particular hero of my faith and constantly refer to that person's deeds.",
        "I see omens in every event and action.",
        "Nothing can shake my optimistic attitude.",
      ],
      sage: [
        "I'm used to helping out those who aren't as smart as I am.",
        "I've read every book in the world's greatest libraries—or I like to boast that I have.",
        "There's nothing I like more than a good mystery.",
      ],
      'folk-hero': [
        "I judge people by their actions, not their words.",
        "If someone is in trouble, I'm always ready to lend help.",
        "I have a strong sense of fair play and always try to find the most equitable solution.",
      ],
    },
  },

  ideal: {
    generic: [
      "Respect. People deserve to be treated with dignity and respect.",
      "Fairness. No one should get preferential treatment before the law.",
      "Freedom. Tyrants must not be allowed to oppress the people.",
      "Knowledge. The path to power and self-improvement is through knowledge.",
      "Protection. It is my duty to protect those who cannot protect themselves.",
      "Tradition. Ancient traditions must be preserved and upheld.",
      "Honor. I never break my word.",
      "Redemption. There's a spark of good in everyone.",
      "Self-Improvement. I must always strive to be better.",
      "Community. We have to take care of each other.",
      "Greater Good. My gifts are meant to be shared with all, not used for my own benefit.",
      "Logic. Emotions must not cloud our sense of what is right and true.",
      "Beauty. What is beautiful points us beyond itself toward what is true.",
      "Charity. I always try to help those in need, no matter the personal cost.",
      "Aspiration. I seek to prove myself worthy of my god's favor.",
      "Power. Knowledge is the path to power and domination.",
      "Change. We must help bring about the changes the gods are constantly working in the world.",
    ],

    byClass: {
      paladin: [
        "Faith. I trust that my deity will guide my actions.",
        "Justice. The wicked must be punished for their crimes.",
        "Glory. I must earn glory in battle, for myself and my deity.",
      ],
      rogue: [
        "Independence. I am a free spirit—no one tells me what to do.",
        "Greed. I will do whatever it takes to become wealthy.",
        "Freedom. Chains are meant to be broken, as are those who would forge them.",
      ],
      wizard: [
        "Knowledge. The path to power and self-improvement is through knowledge.",
        "Self-Improvement. The goal of a life of study is the betterment of oneself.",
        "Logic. Emotions must not cloud our logical thinking.",
      ],
    },

    byBackground: {
      noble: [
        "Responsibility. It is my duty to respect the authority of those above me.",
        "Power. If I can attain more power, no one will tell me what to do.",
        "Family. Blood runs thicker than water.",
      ],
      soldier: [
        "Might. In life as in war, the stronger force wins.",
        "Nation. My city, nation, or people are all that matter.",
        "Responsibility. I do what I must and obey just authority.",
      ],
    },
  },

  bond: {
    generic: [
      "I would die to recover an ancient relic that was lost long ago.",
      "I will someday get revenge on those who destroyed everything I held dear.",
      "I owe my life to a mentor who taught me everything I know.",
      "Everything I do is for the common people.",
      "I will become the greatest hero my homeland has ever known.",
      "Someone I loved died because of a mistake I made. I will never make that mistake again.",
      "My homeland is the most important place in the world to me.",
      "I'm trying to pay off an old debt I owe to a generous benefactor.",
      "My family means everything to me.",
      "I seek to prove myself worthy of my mentor's faith in me.",
      "I protect those who cannot protect themselves.",
      "I worked the land, I love the land, and I will protect the land.",
      "I entered seclusion to hide from the ones who might still be hunting me.",
      "I owe everything to my mentor—a horrible person who's probably rotting in jail somewhere.",
      "I created a great work for someone, and then found them unworthy to receive it.",
      "My instrument is my most treasured possession, and it reminds me of someone I love.",
      "Someone saved my life on the battlefield. To this day, I will never leave a friend behind.",
    ],

    byRace: {
      dwarf: [
        "My clan is everything to me. I must bring honor to them.",
        "I swore an oath to restore my family's lost honor.",
        "I am working to repay a debt to my clan.",
      ],
      elf: [
        "I have an ancient duty that I must fulfill before I can rest.",
        "My people's ancient enemies will know my wrath.",
        "I protect the sacred groves of my homeland.",
      ],
    },

    byClass: {
      cleric: [
        "I would die to recover an ancient relic of my faith.",
        "I will do anything to protect the temple where I served.",
        "I owe everything to the priest who took me in when my parents died.",
      ],
      warlock: [
        "My pact defines my destiny—for better or worse.",
        "I must find a way to free myself from my patron's influence.",
        "I made a bargain to save someone I love.",
      ],
    },
  },

  flaw: {
    generic: [
      "I judge others harshly, and myself even more severely.",
      "I have trouble trusting in my allies.",
      "Once I pick a goal, I become obsessed with it.",
      "I am slow to trust members of other races or cultures.",
      "I have trouble keeping my true feelings hidden.",
      "I turn tail and run when things look bad.",
      "I'm convinced of the significance of my destiny.",
      "My pride will probably lead to my destruction.",
      "I am suspicious of strangers and expect the worst of them.",
      "Once someone questions my courage, I never back down.",
      "I can't resist a pretty face.",
      "I put too much trust in those who wield power within my temple's hierarchy.",
      "I obey the law, even if the law causes misery.",
      "I am inflexible in my thinking.",
      "I'm dogmatic about the tenets of my faith.",
      "I remember every insult I've received and nurse a silent resentment.",
      "I overlook obvious solutions in favor of complicated ones.",
      "By my words and actions, I often bring shame to my family.",
    ],

    byRace: {
      elf: [
        "I look down on shorter-lived races. What can they possibly accomplish?",
        "My patience has limits, and I forget that others don't live as long.",
      ],
      dwarf: [
        "I have trouble admitting when I'm wrong.",
        "I never forget a grudge.",
        "I'm suspicious of anyone who isn't a dwarf.",
      ],
      halfling: [
        "I can't resist taking something that doesn't belong to me.",
        "I'm too curious for my own good.",
      ],
      tiefling: [
        "I assume everyone is judging me for my heritage.",
        "I sometimes let my darker impulses get the better of me.",
      ],
    },

    byClass: {
      wizard: [
        "I overlook obvious solutions in favor of complicated ones.",
        "I'm easily distracted by the promise of information.",
        "I speak without really thinking through my words.",
      ],
      barbarian: [
        "I am too enamored of ale, wine, and other intoxicants.",
        "Violence is my answer to almost any challenge.",
        "There's no room for caution in a life lived to the fullest.",
      ],
      rogue: [
        "An innocent person is in prison for a crime that I committed.",
        "I have a weakness for the vices of the city.",
        "I can never fully trust anyone but myself.",
      ],
      paladin: [
        "I am inflexible in my thinking.",
        "I judge others harshly, and myself even more severely.",
        "I put too much trust in those who wield power.",
      ],
    },

    byBackground: {
      noble: [
        "I secretly believe that everyone is beneath me.",
        "I hide a truly scandalous secret that could ruin my family forever.",
        "I too often hear veiled insults and threats in every word addressed to me.",
      ],
      criminal: [
        "When I see something valuable, I can't help but think about how to steal it.",
        "I will never fully trust anyone other than myself.",
        "I'd rather kill someone than let them disrespect me.",
      ],
    },
  },

  backstory: {
    templates: [
      {
        template:
          "Born in {birthplace}, {name} grew up {upbringing}. A pivotal moment came when {event}. This experience led {name} to become a {class}, seeking {goal}.",
        variables: {
          birthplace: [
            'a small farming village',
            'a bustling trade city',
            'a remote monastery',
            'a traveling merchant caravan',
            'a noble estate',
            'the slums of a great city',
            'a peaceful coastal town',
            'a frontier settlement',
          ],
          upbringing: [
            'learning the ways of their people',
            'struggling to survive day by day',
            'surrounded by books and learning',
            'training for battle from a young age',
            'in relative comfort and privilege',
            'among outcasts and misfits',
            'with a loving but poor family',
            'alone, relying only on themselves',
          ],
          event: [
            'they witnessed an injustice they could not ignore',
            'a mysterious stranger revealed a hidden truth about their heritage',
            'their home was threatened by dark forces',
            'they discovered an ancient artifact that changed everything',
            'a vision from the gods showed them their purpose',
            'they lost someone dear and vowed never to feel so helpless again',
            'an act of kindness from a stranger inspired them',
            'they saved a life and discovered their true calling',
          ],
          goal: [
            'adventure and glory',
            'knowledge and power',
            'justice for the oppressed',
            'redemption for past mistakes',
            'to protect those they love',
            'to find their true place in the world',
            'to uncover the secrets of their past',
            'to prove their worth to all who doubted them',
          ],
        },
      },
    ],
  },
};

// Selection function
export function selectFromTemplates(
  field: keyof typeof PERSONALITY_TEMPLATES,
  context: { race?: string; charClass?: string; background?: string; name?: string }
): string {
  const { race, charClass, background } = context;
  const templates = PERSONALITY_TEMPLATES[field];

  if (!templates) return '';

  // Handle backstory templates specially
  if (field === 'backstory') {
    const backstoryTemplates = templates as typeof PERSONALITY_TEMPLATES.backstory;
    const firstTemplate = backstoryTemplates.templates[0];
    if (!firstTemplate) return '';
    return generateBackstoryFromTemplate(firstTemplate, { ...context, charClass });
  }

  // Collect all applicable options
  const options: string[] = [];

  // Add generic options - use type assertion to handle the union type
  const templatesWithGeneric = templates as { generic?: string[] };
  if (templatesWithGeneric.generic && Array.isArray(templatesWithGeneric.generic)) {
    options.push(...templatesWithGeneric.generic);
  }

  // Add race-specific options
  const templatesWithRace = templates as { byRace?: Record<string, string[]> };
  if (race && templatesWithRace.byRace) {
    const raceOptions = templatesWithRace.byRace[race.toLowerCase()];
    if (Array.isArray(raceOptions)) {
      options.push(...raceOptions);
    }
  }

  // Add class-specific options
  const templatesWithClass = templates as { byClass?: Record<string, string[]> };
  if (charClass && templatesWithClass.byClass) {
    const classOptions = templatesWithClass.byClass[charClass.toLowerCase()];
    if (Array.isArray(classOptions)) {
      options.push(...classOptions);
    }
  }

  // Add background-specific options
  const templatesWithBg = templates as { byBackground?: Record<string, string[]> };
  if (background && templatesWithBg.byBackground) {
    const bgOptions = templatesWithBg.byBackground[background.toLowerCase()];
    if (Array.isArray(bgOptions)) {
      options.push(...bgOptions);
    }
  }

  if (options.length === 0) return '';

  // Random selection
  const selected = options[Math.floor(Math.random() * options.length)];
  return selected || '';
}

function generateBackstoryFromTemplate(
  template: { template: string; variables: Record<string, string[]> },
  context: { race?: string; charClass?: string; background?: string; name?: string }
): string {
  let result = template.template;
  const charName = context.name || 'the adventurer';
  const charClass = context.charClass || 'adventurer';

  result = result.replace(/{name}/g, charName);
  result = result.replace(/{class}/g, charClass);

  for (const [key, values] of Object.entries(template.variables)) {
    const randomValue = values[Math.floor(Math.random() * values.length)] || '';
    result = result.replace(new RegExp(`{${key}}`, 'g'), randomValue);
  }

  return result;
}
