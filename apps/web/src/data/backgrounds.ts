// D&D 5e SRD Backgrounds
export interface Background {
  id: string;
  name: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number; // Number of extra languages
  equipment: string[];
  feature: {
    name: string;
    description: string;
  };
  personalityTraits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

export const BACKGROUNDS: Background[] = [
  {
    id: 'acolyte',
    name: 'Acolyte',
    description: 'You have spent your life in the service of a temple to a specific god or pantheon of gods.',
    skillProficiencies: ['insight', 'religion'],
    toolProficiencies: [],
    languages: 2,
    equipment: ['holy symbol', 'prayer book', '5 sticks of incense', 'vestments', 'common clothes', '15 gp'],
    feature: {
      name: 'Shelter of the Faithful',
      description: 'You and your companions can expect free healing and care at temples of your faith, and supporters will provide a modest lifestyle.',
    },
    personalityTraits: [
      'I idolize a particular hero of my faith.',
      'I can find common ground between the fiercest enemies.',
      'I see omens in every event and action.',
      'Nothing can shake my optimistic attitude.',
    ],
    ideals: [
      'Tradition: Ancient traditions must be preserved.',
      'Charity: I always try to help those in need.',
      'Change: We must help bring about the changes the gods are working in the world.',
      'Faith: I trust that my deity will guide my actions.',
    ],
    bonds: [
      'I would die to recover an ancient relic of my faith.',
      'I will someday get revenge on the corrupt temple hierarchy.',
      'I owe my life to the priest who took me in.',
      'Everything I do is for the common people.',
    ],
    flaws: [
      'I judge others harshly, and myself even more severely.',
      'I put too much trust in those who wield power within my temple.',
      'My piety sometimes leads me to blindly trust those that profess faith.',
      'I am inflexible in my thinking.',
    ],
  },
  {
    id: 'criminal',
    name: 'Criminal',
    description: 'You are an experienced criminal with a history of breaking the law.',
    skillProficiencies: ['deception', 'stealth'],
    toolProficiencies: ['one type of gaming set', 'thieves\' tools'],
    languages: 0,
    equipment: ['crowbar', 'dark common clothes with hood', '15 gp'],
    feature: {
      name: 'Criminal Contact',
      description: 'You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals.',
    },
    personalityTraits: [
      'I always have a plan for what to do when things go wrong.',
      'I am always calm, no matter what the situation.',
      'The first thing I do in a new place is note the exits.',
      'I would rather make a new friend than a new enemy.',
    ],
    ideals: [
      'Honor: I don\'t steal from others in the trade.',
      'Freedom: Chains are meant to be broken.',
      'Charity: I steal from the wealthy to help those in need.',
      'Greed: I will do whatever it takes to become wealthy.',
    ],
    bonds: [
      'I\'m trying to pay off an old debt I owe to a generous benefactor.',
      'My ill-gotten gains go to support my family.',
      'Something important was taken from me, and I aim to steal it back.',
      'I will become the greatest thief that ever lived.',
    ],
    flaws: [
      'When I see something valuable, I can\'t think about anything but how to steal it.',
      'When faced with a choice between money and my friends, I usually choose the money.',
      'If there\'s a plan, I\'ll forget it. If I don\'t forget it, I\'ll ignore it.',
      'I have a "tell" that reveals when I\'m lying.',
    ],
  },
  {
    id: 'folk-hero',
    name: 'Folk Hero',
    description: 'You come from a humble social rank, but you are destined for much more.',
    skillProficiencies: ['animal-handling', 'survival'],
    toolProficiencies: ['one type of artisan\'s tools', 'vehicles (land)'],
    languages: 0,
    equipment: ['artisan\'s tools', 'shovel', 'iron pot', 'common clothes', '10 gp'],
    feature: {
      name: 'Rustic Hospitality',
      description: 'Common folk will help hide you or let you rest among them, as long as you don\'t endanger them.',
    },
    personalityTraits: [
      'I judge people by their actions, not their words.',
      'If someone is in trouble, I\'m always ready to lend help.',
      'When I set my mind to something, I follow through.',
      'I have a strong sense of fair play.',
    ],
    ideals: [
      'Respect: People deserve to be treated with dignity.',
      'Fairness: No one should get preferential treatment.',
      'Freedom: Tyrants must not be allowed to oppress the people.',
      'Destiny: Nothing can stop me from achieving my destiny.',
    ],
    bonds: [
      'I have a family, but I have no idea where they are.',
      'I worked the land, I love the land, and I will protect the land.',
      'A proud noble once gave me a horrible beating, and I will take my revenge.',
      'My tools are symbols of my past life, and I carry them with me.',
    ],
    flaws: [
      'The tyrant who rules my land will stop at nothing to see me killed.',
      'I\'m convinced of the significance of my destiny.',
      'I have a weakness for the vices of the city.',
      'Secretly, I believe that things would be better if I were in charge.',
    ],
  },
  {
    id: 'noble',
    name: 'Noble',
    description: 'You understand wealth, power, and privilege.',
    skillProficiencies: ['history', 'persuasion'],
    toolProficiencies: ['one type of gaming set'],
    languages: 1,
    equipment: ['fine clothes', 'signet ring', 'scroll of pedigree', '25 gp'],
    feature: {
      name: 'Position of Privilege',
      description: 'Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society.',
    },
    personalityTraits: [
      'My eloquent flattery makes everyone I talk to feel important.',
      'The common folk love me for my kindness and generosity.',
      'No one could doubt by looking at my regal bearing that I am above the common folk.',
      'I take great pains to always look my best.',
    ],
    ideals: [
      'Respect: Respect is due to me because of my position.',
      'Responsibility: It is my duty to respect and protect those below me.',
      'Independence: I must prove that I can handle myself.',
      'Power: If I can attain more power, no one will tell me what to do.',
    ],
    bonds: [
      'I will face any challenge to win the approval of my family.',
      'My house\'s alliance with another noble family must be sustained.',
      'Nothing is more important than the other members of my family.',
      'I am in love with the heir of a family that my family despises.',
    ],
    flaws: [
      'I secretly believe that everyone is beneath me.',
      'I hide a truly scandalous secret that could ruin my family.',
      'I too often hear veiled insults where none are intended.',
      'I have an insatiable desire for carnal pleasures.',
    ],
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'You spent years learning the lore of the multiverse.',
    skillProficiencies: ['arcana', 'history'],
    toolProficiencies: [],
    languages: 2,
    equipment: ['bottle of ink', 'quill', 'small knife', 'letter from dead colleague', 'common clothes', '10 gp'],
    feature: {
      name: 'Researcher',
      description: 'When you attempt to learn or recall a piece of lore, if you don\'t know it, you often know where and from whom you can obtain it.',
    },
    personalityTraits: [
      'I use polysyllabic words that convey the impression of great erudition.',
      'I\'ve read every book in the world\'s greatest libraries.',
      'I\'m used to helping out those who aren\'t as smart as I am.',
      'There\'s nothing I like more than a good mystery.',
    ],
    ideals: [
      'Knowledge: The path to power is through knowledge.',
      'Beauty: What is beautiful points us beyond itself toward what is true.',
      'Logic: Emotions must not cloud logical thinking.',
      'Self-Improvement: The goal of a life of study is the betterment of oneself.',
    ],
    bonds: [
      'It is my duty to protect my students.',
      'I have an ancient text that holds terrible secrets.',
      'I work to preserve a library, university, or monastery.',
      'My life\'s work is a series of tomes related to a specific field of lore.',
    ],
    flaws: [
      'I am easily distracted by the promise of information.',
      'Most people scream and run when they see a demon. I stop and take notes.',
      'Unlocking an ancient mystery is worth the price of a civilization.',
      'I overlook obvious solutions in favor of complicated ones.',
    ],
  },
  {
    id: 'soldier',
    name: 'Soldier',
    description: 'War has been your life for as long as you care to remember.',
    skillProficiencies: ['athletics', 'intimidation'],
    toolProficiencies: ['one type of gaming set', 'vehicles (land)'],
    languages: 0,
    equipment: ['insignia of rank', 'trophy from fallen enemy', 'set of bone dice', 'common clothes', '10 gp'],
    feature: {
      name: 'Military Rank',
      description: 'Soldiers loyal to your former military organization still recognize your authority, and you can invoke your rank to exert influence.',
    },
    personalityTraits: [
      'I\'m always polite and respectful.',
      'I\'m haunted by memories of war.',
      'I\'ve lost too many friends, and I\'m slow to make new ones.',
      'I\'m full of inspiring and cautionary tales from my military experience.',
    ],
    ideals: [
      'Greater Good: Our lot is to lay down our lives in defense of others.',
      'Responsibility: I do what I must and obey just authority.',
      'Independence: When people follow orders blindly, they embrace tyranny.',
      'Might: In life as in war, the stronger force wins.',
    ],
    bonds: [
      'I would still lay down my life for the people I served with.',
      'Someone saved my life on the battlefield. I will never leave a friend behind.',
      'My honor is my life.',
      'I\'ll never forget the crushing defeat my company suffered.',
    ],
    flaws: [
      'The monstrous enemy we faced in battle still leaves me quivering with fear.',
      'I have little respect for anyone who is not a proven warrior.',
      'I made a terrible mistake in battle that cost many lives.',
      'My hatred of my enemies is blind and unreasoning.',
    ],
  },
  {
    id: 'hermit',
    name: 'Hermit',
    description: 'You lived in seclusion for a formative part of your life.',
    skillProficiencies: ['medicine', 'religion'],
    toolProficiencies: ['herbalism kit'],
    languages: 1,
    equipment: ['scroll case with notes', 'winter blanket', 'common clothes', 'herbalism kit', '5 gp'],
    feature: {
      name: 'Discovery',
      description: 'You have discovered a powerful truth about the cosmos, nature, or yourself. Work with your DM to determine the details.',
    },
    personalityTraits: [
      'I\'ve been isolated for so long that I rarely speak.',
      'I am utterly serene, even in the face of disaster.',
      'I feel tremendous empathy for all who suffer.',
      'I\'m oblivious to etiquette and social expectations.',
    ],
    ideals: [
      'Greater Good: My gifts are meant to be shared with all.',
      'Logic: Emotions must not cloud our sense of truth.',
      'Free Thinking: Inquiry and curiosity are the pillars of progress.',
      'Self-Knowledge: If you know yourself, there\'s nothing left to know.',
    ],
    bonds: [
      'Nothing is more important than the other members of my hermitage.',
      'I entered seclusion to hide from those who might still be hunting me.',
      'I\'m still seeking the enlightenment I pursued in my seclusion.',
      'I entered seclusion because I loved someone I could not have.',
    ],
    flaws: [
      'Now that I\'ve returned, I enjoy its delights a little too much.',
      'I harbor dark, bloodthirsty thoughts that my isolation failed to quell.',
      'I am dogmatic in my thoughts and philosophy.',
      'I let my need to win arguments overshadow friendships.',
    ],
  },
  {
    id: 'entertainer',
    name: 'Entertainer',
    description: 'You thrive in front of an audience, knowing how to entrance them.',
    skillProficiencies: ['acrobatics', 'performance'],
    toolProficiencies: ['disguise kit', 'one type of musical instrument'],
    languages: 0,
    equipment: ['musical instrument', 'favor of an admirer', 'costume', '15 gp'],
    feature: {
      name: 'By Popular Demand',
      description: 'You can always find a place to perform in any settlement, and you receive free lodging and food in exchange.',
    },
    personalityTraits: [
      'I know a story relevant to almost every situation.',
      'Whenever I come to a new place, I collect local rumors.',
      'I\'m a hopeless romantic, always searching for "the one."',
      'Nobody stays angry at me for long.',
    ],
    ideals: [
      'Beauty: When I perform, I make the world better than it was.',
      'Tradition: The stories of the past must never be forgotten.',
      'Creativity: The world is in need of new ideas and bold action.',
      'Honesty: Art should reflect the soul; it should come from within.',
    ],
    bonds: [
      'My instrument is my most treasured possession.',
      'Someone stole my precious instrument, and someday I\'ll get it back.',
      'I want to be famous, whatever it takes.',
      'I idolize a hero of the old tales and measure my deeds against theirs.',
    ],
    flaws: [
      'I\'ll do anything to win fame and renown.',
      'I\'m a sucker for a pretty face.',
      'A scandal prevents me from ever going home again.',
      'I once satirized a noble who still wants my head.',
    ],
  },
];

export function getBackgroundById(id: string): Background | undefined {
  return BACKGROUNDS.find(b => b.id === id);
}
