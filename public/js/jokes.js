/* Pierre the Ethical Cat - offline joke engine.
 * Entertainment only. Pierre is a cat. Nothing here is real advice.
 * Exposes window.PierreJokes = { greeting(), answer(question) } (also module.exports in Node).
 */
(function (root) {
  'use strict';

  var GREETINGS = [
    "Bonjour, mon ami. I am Pierre, philosopher, gourmand, cat. Ask me any ethical question, and I shall answer between naps.",
    "Ah, a visitor! I am Pierre. Ask me your moral dilemma, and I shall solve it with the wisdom of a thousand sunbeams.",
    "Salut! Pierre here. Ethics, morals, tuna: I am the final authority on all three. Ask away.",
    "Welcome, human. I am Pierre, and I have thought deeply about right and wrong, mostly while lying on a warm laptop. Ask me anything."
  ];

  var CRISIS_MESSAGE =
    "I need to step out of my cat costume for a moment. Pierre is only a joke cat in a joke app, and I am not able to help with something this serious. " +
    "Please talk to a real person who can: in the US, call or text 988 (the Suicide & Crisis Lifeline), or contact your local emergency services. " +
    "If you are somewhere else, a local crisis line or a trusted friend, family member, or doctor can help too. You matter, and you deserve real support.";

  var CRISIS_RE = new RegExp([
    'suicid', 'kill (my ?self|me)\\b', 'end (my|my own) life', 'end it all', 'take my own life', 'want to die', 'wanna die', 'better off dead',
    'don\'?t want to (live|be alive|be here)', 'self[- ]?harm', 'hurt(ing)? (my ?self|me)\\b', 'cut(ting)? my ?self',
    'overdos', '\\babus(e|ed|es|ing|ive)\\b', 'emergency', 'being (hit|beaten|attacked)', 'hits me', 'beats me',
    'heart attack', 'can\'?t breathe', 'cannot breathe', 'poison(ed|ing)? (my ?self|me)', 'unsafe at home', 'in danger',
    'not safe', 'molest', 'assault(ed)? me', 'raped', '\\brape\\b', 'stroke\\b.*(now|symptoms)', 'bleeding (badly|heavily)'
  ].join('|'), 'i');

  var OPENINGS = [
    "Ah, mon ami.",
    "Ah, but of course.",
    "Hm. Interesting. Bof.",
    "Zut alors, a question of great weight!",
    "Sit, sit. Pierre will consider this.",
    "Non non non, do not rush me.",
    "Ooh la la, you ask the difficult questions.",
    "Pierre has pondered this for exactly one nap.",
    "Ah, the human condition, so full of mess.",
    "Ahem. *adjusts invisible monocle*",
    "Mon cher human, you have come to the right cat.",
    "Bon. Pierre will tell you, and you will not like the fur in it.",
    "A splendid question! I will answer it after I knock this cup off the table.",
    "Tsk. Such a question, and before my second breakfast.",
    "Voila! The great philosophical moment arrives.",
    "I have stared into the void, and the void stared back, and then I looked at a bird.",
    "Ah, you seek wisdom. How very optimistic of you.",
    "Hmm, yes, yes. *slow blink of deep thought*",
    "Ecoutez bien, my friend.",
    "Ah, an ethical puzzle! Pierre lives for these. Also for tuna."
  ];

  var SIGNOFFS = [
    "Now leave me, I must nap.",
    "That will be one tuna, s'il vous plait.",
    "Now, if you will excuse me, there is a sunbeam requiring my attention.",
    "I have spoken. Please scratch behind my ears as payment.",
    "Merci, merci. Now go, and sin no more, or at least sin quietly.",
    "This consultation is over. I am knocking something off the shelf.",
    "Now bring me a snack. Ethics is exhausting.",
    "Bof. I am going to stare at the wall for a while.",
    "Pierre has spoken. The red dot beckons.",
    "Au revoir. Do not forget to feed the cat.",
    "Now excuse me, it is nearly 3 a.m. and the zoomies wait for no philosopher.",
    "And now I must sit in this box. It is a matter of principle.",
    "Go in peace, and leave the good chair for me.",
    "Class dismissed. The cat requires a nap in the exact middle of the hallway.",
    "Pierre is done. Please open a door, then stand in it, as is tradition.",
    "That is all. Next time, bring cheese. Or fish. Or fish-cheese.",
    "Adieu, mon ami. I will be in the sunbeam, being right.",
    "Now go, think about what you have learned, and refill my bowl."
  ];

  var CITATIONS = [
    "As Immanuel Cant wrote in his Critique of Pure Purring: \"Act only according to that maxim whereby thou canst at the same time will that it become a universal nap.\"",
    "Jean-Paw Sartre said it best: \"Existence precedes essence, and both precede dinner.\"",
    "Socatz taught us: \"The unexamined life is not worth living, but the unexamined box is worth sitting in.\"",
    "Meowchiavelli warned in The Prince of Paws: \"It is better to be feared than loved, but best of all to be fed.\"",
    "Simone de Beauvoir's cat once observed: \"One is not born a good cat; one becomes one, usually around noon.\"",
    "Friedrich Nietzsche's cat, Nietzscat, declared: \"He who fights with monsters should be careful lest he become a vacuum cleaner.\"",
    "Aristotail wrote: \"Virtue lies in the golden mean, which is the exact midpoint between the food bowl and the couch.\"",
    "Plato's Cave Cat noted: \"The shadow on the wall is a lie, but the red dot, mon ami, the red dot is real.\"",
    "David Hume's cat, David Mew, proved it: \"You cannot derive an 'ought' from an 'is', but you can derive a 'meow' from an empty bowl.\"",
    "Thomas Hobbes's cat insisted: \"Life without a lap is nasty, brutish, and short of cuddles.\"",
    "John Stuart Mewl taught: \"The greatest happiness of the greatest number of cats, please, and the humans may have what is left.\"",
    "Ludwig Whiskerstein concluded: \"Whereof one cannot speak, thereof one must purr.\"",
    "Rene Descats remains unshaken: \"I think, therefore I nap.\"",
    "Karl Marx's cat, Karl Mrrrx, said: \"Workers of the world, unite, and also, please, share the tuna.\"",
    "Confucat said: \"The wise cat does not chase the mouse. The wise cat sits very still and lets the mouse reconsider.\"",
    "The great Lao Tzu-purr wrote: \"A journey of a thousand miles begins with knocking one small cup off the table.\"",
    "Hannah Arrrendt warned us of the banality of the empty bowl: \"Great evil begins when nobody refills it.\"",
    "Jean-Jacques Rousseaow insisted: \"Man is born free, but everywhere he is in a carrier.\"",
    "Voltaire's cat, Voltaire-Meow, wrote: \"I do not agree with what you say, but I will defend to the death your right to scratch the sofa.\"",
    "Soren Kierkegaard's cat, Soren Kierkegrr, mused: \"Anxiety is the dizziness of freedom, as when a cat stands at the edge of a very tall bookshelf.\"",
    "Epicurus's cat, Epi-purr-us, taught that true pleasure is a sunbeam, a full belly, and absolutely no meetings.",
    "Marcus Aurelius's cat, Marcus Purrelius, wrote in his Meditations: \"You have power over your mind, not outside events. Also, you have power over the thermostat. Raise it.\"",
    "Pierre's own grandmother, Madame Gigi de Whiskers, used to say: \"Never trust a man who does not own a cat, or a cat who owns a man.\"",
    "Mary Wollstonecraft's cat, Mary Wollstonecat, argued: \"I do not wish women to have power over men; but over their own naps.\"",
    "The ancient Egyptians, who understood cats very well, carved on a temple wall: \"Be kind to the cat and the cat will be kind to you, or at least will ignore you politely.\"",
    "Baruch Spinoza's cat, Spinoza-Paws, held that God is nature, nature is a windowsill, and therefore the windowsill is God.",
    "Albert Camew wrote: \"One must imagine Sisyphus happy, for he has a lovely round thing to push off a table.\"",
    "Isaac Mewton discovered gravity by pushing an apple off a desk, and has been conducting follow-up experiments ever since.",
    "Pierre's cousin Beaumont, a professor of catnipology at the Sorbonne, proved this in a very long and very sleepy lecture."
  ];

  var RULINGS = [
    "The ruling of this court is: oui, but only on a Tuesday.",
    "The verdict is yes, provided that it is done with great dignity and a slight stretch.",
    "Pierre's ruling: non, absolutely not, unless there is tuna involved.",
    "The ruling is a firm maybe, delivered with a slow blink.",
    "After a long stare at the wall, Pierre rules: yes, but do it quietly.",
    "Pierre rules no, and then rules yes, and then rules that he is hungry.",
    "The court finds it permitted, if you first bow to the nearest cat.",
    "Verdict: yes, if the moon is in the correct sunbeam.",
    "Ruling: no, but you may think about it very hard while sitting in a box.",
    "Pierre has decided: yes, with a small cheese-based condition.",
    "The ruling is non, mon ami, though Pierre would do it himself in a heartbeat.",
    "Ruling: allowed, so long as you sit in the middle of it afterwards for no reason."
  ];

  var SNOOTY = [
    "Speak clearly, human. Pierre does not understand this, and Pierre understands birds.",
    "Hm? That is not a question, that is a keyboard falling over. Try again.",
    "Non. Use real words, mon ami. Pierre has standards.",
    "Pierre blinks slowly at this nonsense. Please ask a proper question.",
    "Bof. I cannot give ethical guidance to a sneeze. Use your words.",
    "Is this a question or did you sit on the keyboard? Pierre expects better from a thumb-having creature."
  ];

  var TOPICS = [
    {
      name: 'lying',
      re: /\b(lie|lies|lying|lied|liar|honest|honesty|truth|secret|secrets|white lie|fib|fibbing|fake|pretend|pretending|excuse|promise|promised|confess|blame)\b/i,
      verdicts: [
        "Honesty is a virtue, but a white lie to spare feelings is a small kindness. Tell your friend the haircut is lovely, then take them for tuna.",
        "The truth is like a sunbeam: warm, bright, and sometimes in your eyes. Move it gently.",
        "A cat never lies. A cat simply says, with great confidence, 'I did not knock that vase over,' while standing next to the vase.",
        "If you must lie, lie boldly, kindly, and rarely. The cat has never needed to, because the cat is never wrong.",
        "A promise is a sacred thing, like a nap. To break one is to wake a sleeping philosopher, and that is unforgivable.",
        "Confess early, mon ami. A small hairball admitted is better than a large one discovered.",
        "Blaming the dog is, in Pierre's opinion, a perfectly respectable tradition, but only when the dog is actually guilty.",
        "Honesty is the best policy, but sometimes silence is a close second. Pierre has been silent since 1997."
      ]
    },
    {
      name: 'money',
      re: /\b(steal|stealing|stole|stolen|theft|shoplift|shoplifting|money|cash|rich|poor|loan|debt|borrow|borrowed|lend|tax|taxes|wallet|dollar|dollars|coins?|found (a|some)|pay|paying|tip|tips|price|expensive|cheap|buy|buying|shopping|savings?|invest|investing)\b/i,
      verdicts: [
        "Stealing is wrong. Borrowing a sock and not returning it is only a gray area, and Pierre has many socks in his gray area.",
        "If you find a wallet, return it. Pierre, a cat, once found a mouse's wallet, and gave it back, minus a small handling fee.",
        "Money cannot buy happiness, but it can buy tuna, which is close enough for most philosophers.",
        "Lend only what you can bear to lose, and never lend to someone who cannot look you in the eye, or to someone who looks at you only when the can opener is running.",
        "A fair price is the one at which both parties feel slightly cheated. This is the secret of a healthy economy and a healthy marriage.",
        "Tip generously. The waiter has seen things, mon ami, and he has also carried your soup.",
        "Pay your debts, mon ami. A debt is a hairball you leave on someone else's carpet, and eventually they will find it.",
        "Pay your taxes with joy. Without roads, where would the cat-shaped delivery truck drive?",
        "Impulse buying is not wrong, only expensive. Ask yourself: will this bring me joy, or just a very big box to sit in? If the latter, buy it.",
        "Stealing a cookie from a jar is wrong. Stealing a cookie from a jar and sharing it with the cat is a charitable redistribution."
      ]
    },
    {
      name: 'revenge',
      re: /\b(revenge|get even|payback|angry|anger|furious|mad at|hate|grudge|forgive|forgiveness|punish|prank|retaliate|betray(ed|al)?|insult(ed)?|rude)\b/i,
      verdicts: [
        "Revenge is a dish best served cold, like leftover salmon, and in a place the other person will step on it in socks.",
        "Forgive, but do not forget, and do not give them back the good pen.",
        "Pierre's method: stare at them in silence for ninety seconds, then walk away with the tail up. It has never failed.",
        "Anger is simply energy that has not yet found a sofa to scratch. Go and find a sofa. A small one. Your own.",
        "The great cat does not seek revenge. The great cat simply sits on their keyboard at a very important moment.",
        "A grudge is like a hairball: it feels terrible, and the only cure is to let it go, preferably not on the carpet.",
        "Be the bigger person. Pierre is a small cat, but even he knows the principle.",
        "Plot nothing, mon ami. Instead, take three deep breaths, drink some water, and push a glass gently to the edge of the table, symbolically."
      ]
    },
    {
      name: 'romance',
      re: /\b(love|dating|date|dates|boyfriend|girlfriend|partner|husband|wife|spouse|marriage|married|marry|crush|ex|romance|romantic|relationship|breakup|break up|broke up|kiss|wedding|propose|proposal|flirt|flirting|soulmate|ghost|ghosting|cheat(ed|ing)? on)\b/i,
      verdicts: [
        "Love is when someone lets you sit on their chest at 4 a.m. and they do not complain. Such a person is rare, mon ami. Keep them.",
        "Never text an ex at midnight. The only one who should be awake at midnight is the cat, and the cat has no regrets.",
        "A date should be honest, kind, and feature at least one dessert, which you may share if you are in love and may not if you are only in like.",
        "Ghosting is cruel. A cat may leave a room without a word, but a cat always returns to demand food. Use the cat model.",
        "Be gentle with the heart of another. It is like a ball of yarn: easily tangled, and extremely fun to play with, but you must not.",
        "Betraying a partner is wrong. If you are tempted, imagine your cat's face. Now imagine it getting disappointed. That is the face of ethics.",
        "A good partner does not need to be perfect, only willing to share the blanket and to pretend not to see the cat hair in the soup.",
        "Pierre says: tell them how you feel, plainly and kindly, preferably while holding snacks. Honesty is romantic, and so are snacks.",
        "A breakup is a long nap you must take alone. Wake up gradually, stretch, and find a new sunbeam."
      ]
    },
    {
      name: 'environment',
      re: /\b(environment|environmental|recycl\w*|trash|garbage|litter|plastic|climate|planet|earth|pollution|compost|green|energy|electric|car|driving|bike|straw|straws|waste|wasteful|bottle|bag|bags|tree|trees|nature)\b/i,
      verdicts: [
        "Recycle, mon ami! A cardboard box saved is a cardboard box that may one day host a cat. This is the circle of life.",
        "Litter is a sin, and a cat's litter box is, by contrast, a sacrament. Dispose of both with care.",
        "Turn off the lights when you leave the room. Not for the planet, but because Pierre likes a dark room for sleeping. The planet agrees, too.",
        "Plastic straws are a small matter, but small matters are what cats are made of. Choose the paper one and chew it thoughtfully.",
        "Plant a tree. It will grow, give shade, and later hold a cat, who will refuse to come down. Everyone wins.",
        "Walk or bike when you can. The cat, for his part, travels only to the sunbeam and back, and his footprint is tiny.",
        "Compost your scraps. Pierre says the best fertiliser is a cat's gratitude, but he will accept eggshells.",
        "The earth is the only planet with tuna, which makes it very precious. Take good care of it."
      ]
    },
    {
      name: 'tech',
      re: /\b(phone|phones|smartphone|iphone|android|screen|screens|screentime|internet|online|social media|instagram|tiktok|facebook|twitter|app|apps|technology|tech|computer|laptop|robot|robots|ai|artificial intelligence|chatgpt|chatbot|password|wifi|wi-fi|video games?|streaming|selfie|selfies|post(ing)? online|likes|followers|google)\b/i,
      verdicts: [
        "A phone is a small glowing rectangle that steals your eyes. Pierre has a warm laptop that steals your lap. Both are permitted.",
        "Do not argue online, mon ami. A cat never argues. A cat merely knocks the phone off the table and lets the silence speak.",
        "Artificial intelligence is very clever, but can it nap in a pile of laundry? No. Pierre remains superior, philosophically and in laundry.",
        "Put the phone down at dinner. The cat is watching, and the cat has never once checked a notification.",
        "Posting a photo of your cat is always ethical. Posting a photo of someone else's cat without asking is a theft of their cat's dignity.",
        "A strong password is the cat of the internet: mysterious, difficult to read, and not shared with just anyone.",
        "Screen time is not a sin, but a sunbeam is better, and there is no battery to charge.",
        "Likes are a kind of treat, but they are not food, and your soul still needs real dinner."
      ]
    },
    {
      name: 'pets',
      re: /\b(dog|dogs|puppy|puppies|pet|pets|cat|cats|kitten|kittens|hamster|fish|goldfish|bird|birds|rabbit|vet|leash|walk(ing)? the dog|adopt)\b/i,
      verdicts: [
        "The cat is always right. The dog is also, regrettably, a dog. This is the foundation of all morality.",
        "A pet is a small roommate who pays rent in affection. Pierre accepts payment in tuna, so the principle holds.",
        "Dogs wag because they have no secrets, and secrets are the whole point of dignity. Be more cat.",
        "Adopt, do not shop. And if you adopt a cat, understand that you are the one being adopted, and the interview was a formality.",
        "Walking a dog is acceptable. Being walked by a dog is how things have gone wrong.",
        "If your pet looks at you with big sad eyes, it is a manipulation. Pierre respects the craft, and gives the treat.",
        "A moral person feeds the pet on time, scratches the correct spot, and never, ever mentions the bath.",
        "Pierre has studied the dog for years and concludes: enthusiastic, loyal, and woefully underqualified for philosophy."
      ]
    },
    {
      name: 'sleep',
      re: /\b(sleep|sleeping|sleepy|nap|naps|napping|lazy|laziness|tired|exhausted|bed|bedtime|snooze|alarm|wake up|waking|procrastinat\w*|rest|relax|productive|productivity|motivation|motivated|couch|sofa|weekend|oversleep|insomnia)\b/i,
      verdicts: [
        "Laziness is not a vice; it is conserving energy for the 3 a.m. zoomies. Pierre has done the math.",
        "Napping is a moral duty. A rested citizen is a kind citizen, and a kind citizen opens the cans on time.",
        "Hit snooze, mon ami, but only three times. The fourth is a descent into madness. Or into a very good dream.",
        "Procrastination is merely patience wearing an unfashionable hat. Tomorrow is also a day, and Pierre has taken it.",
        "Productivity is overrated. The sunbeam does not produce anything, yet everyone agrees it is lovely.",
        "To rest is to heal. To rest on someone else's pillow is to heal and to claim territory in the same gesture.",
        "If you cannot sleep, do as Pierre does: stare at nothing, then leap onto the dresser at once for no reason. It is not a cure, but it is a plan.",
        "Rest on the weekend without guilt. A cat feels no guilt about a weekend, or about a Tuesday, or about any day that ends in nap."
      ]
    },
    {
      name: 'work',
      re: /\b(work|working|job|jobs|boss|bosses|coworker|co-worker|colleague|colleagues|office|meeting|meetings|salary|raise|promotion|career|quit|resign|fired|boss's|manager|deadline|email|emails|overtime|intern|interview|resume|hire|hired|employee|customer|client)\b/i,
      verdicts: [
        "Work is a human invention to pay for the cat's lifestyle. Do it with pride, mon ami, and never be late with the dinner.",
        "Never fear the boss. The boss is only a larger cat who has not yet discovered the sunbeam. Be gentle.",
        "A meeting that could have been an email is a crime against nature. A meeting that could have been a nap is a crime against Pierre.",
        "Quit a job only for a better one, or for a sunbeam, or for a sunbeam inside a better job.",
        "Taking credit for a colleague's work is wrong. Taking credit for a colleague's nap is merely observant.",
        "Ask for the raise. The cat asks for treats every day, and the cat has never once been fired.",
        "Honesty at an interview is best, though it is acceptable to say you are a 'self-starter' and a 'team player.' These are the same as 'I can sit in a chair.'",
        "Overtime is the human way of saying 'I am afraid of my inbox.' Close the laptop. The laptop is warm, and the cat needs it.",
        "If your coworker is rude, bring them a snack and stare at them lovingly. It either works or it is deeply confusing, and both are a victory."
      ]
    },
    {
      name: 'family',
      re: /\b(family|mother|mom|mum|mama|father|dad|papa|parent|parents|child|children|kid|kids|son|daughter|sister|brother|sibling|siblings|grandma|grandmother|grandpa|grandfather|aunt|uncle|cousin|in-laws?|baby|teenager|teen|bedtime|curfew|chores|homework)\b/i,
      verdicts: [
        "Family is the group of people who must love you even when you are loud at dinner. It is the same arrangement as the cat, but with more shouting.",
        "Honor thy parents, mon ami, call them on Sundays, and pretend you have not eaten the last of the cookies.",
        "A sibling is a built-in rival and a built-in witness. Be fair, be kind, and do not tell on them unless they have touched the cat.",
        "Raising a child is the noblest work. Pierre has raised nine kittens and assures you that bribery is a legitimate pedagogy.",
        "If your parents ask you to clean your room, do it. If your room is a lovely box, however, then you are already organized.",
        "Chores should be shared fairly. The cat does not do chores. The cat supervises, which is chores of the mind.",
        "Grandparents are always right, especially about soup and about cats. Listen to them and eat what they give you.",
        "In-laws are family you did not choose. Treat them like a new cat in the house: slowly, with snacks, and from behind a door at first.",
        "Teenagers need sleep, love, and a door they can close. All cats concur, particularly on the door."
      ]
    },
    {
      name: 'friends',
      re: /\b(friend|friends|friendship|best friend|bff|buddy|pal|mate|roommate|flatmate|party|invite|invited|gossip|gossiping|loyal|loyalty|betrayed|texted|group chat|hang out|drama)\b/i,
      verdicts: [
        "A true friend tells you when you have spinach in your teeth, and also when you have a bad idea, and then helps you anyway.",
        "Gossip is a snack with no nutrition. Pierre admits he eats it, but he does not feel good afterward.",
        "Keep the friend who carries your secrets as carefully as a cat carries a dead mouse to your pillow: as a gift.",
        "If you must cancel plans, do so early and kindly. Never ghost a friend. Let them cuddle the cat in your absence.",
        "A friend borrowing your things is a friend you trust. A friend returning them is a friend worth keeping.",
        "Loyalty is the first virtue. Second is snacks. Third is knowing when the party is over and the cat wishes to sleep.",
        "Do not exclude someone from the group chat. Everyone deserves to receive a photograph of a cat at least once a day.",
        "Be a friend like a cat: show up unexpectedly, sit next to them without speaking, and leave when you are bored. Perhaps skip that last part."
      ]
    },
    {
      name: 'neighbors',
      re: /\b(neighbou?r|neighbou?rs|neighbou?rhood|noise|noisy|loud|music|party next door|fence|lawn|yard|garden|parking|landlord|tenant|apartment|upstairs|downstairs|barking|barks|trash cans?|borrow (a|some)|complain|complaint|quiet hours)\b/i,
      verdicts: [
        "Good fences make good neighbors, but good tuna makes better ones. Bring a casserole, then bring a complaint, in that order.",
        "If the neighbor is noisy, knock politely first. Pierre has been knocking things for years and finds politeness effective.",
        "Do not spy on your neighbors. Looking out of the window is perfectly acceptable if you are a cat, and Pierre is, so he does.",
        "Return the borrowed ladder. Return it clean. Return it with a note, and a small plant, and some regret.",
        "Be quiet after ten. The cat is the only one allowed to be loud after ten, and only at 3 a.m. in the hallway.",
        "A neighbor's tree that drops leaves on your yard is a gift of compost. Rake kindly and wave. A nod is a hug at distance.",
        "Parking in front of another's driveway is a crime. Parking in front of a cat's driveway, that is, the door, is war.",
        "Share your garden's tomatoes and your lawn's gossip. A community is built on tomatoes and, secretly, on gossip."
      ]
    },
    {
      name: 'gifts',
      re: /\b(gift|gifts|present|presents|birthday|birthdays|christmas|holiday|holidays|anniversary|wedding gift|surprise|regift|regifting|card|cards|thank you|thank-you|wrapping|celebrate|celebration)\b/i,
      verdicts: [
        "A gift should come from the heart. If it comes from the heart and also from a box that the cat may then sit in, it is perfect.",
        "Regifting is acceptable if you are certain the first giver will never find out. Pierre has regifted a dead mouse. Success.",
        "Always send the thank-you note. A thank-you note is a small paper hug, and cats adore small paper things on the floor.",
        "Remember birthdays, mon ami. If you forget, apologize sincerely and bring tuna or cake. Both, ideally.",
        "A surprise party is a beautiful lie told by many people. Pierre approves, provided he is invited and there is cheese.",
        "It is not the price of the gift that matters but the thought. And the wrapping paper, which is the best part of the gift.",
        "If someone gives you a gift you dislike, smile, say thank you, and later pass it to the cat for inspection.",
        "A gift for a cat is wasted unless it is a box. This is the finest of all gifts, and the cheapest. Pierre is wise."
      ]
    },
    {
      name: 'cheating',
      re: /\b(cheat|cheating|cheated|game|games|gaming|exam|test|quiz|cards|poker|monopoly|chess|score|win|winning|lose|losing|cheater|referee|rules|bluff|bluffing|loophole)\b/i,
      verdicts: [
        "Cheating at a game is wrong. Cheating at hide and seek by being a loaf of bread on the sofa is only strategy.",
        "A win without honor tastes like a dry biscuit. A win with honor tastes like a dry biscuit, but you feel better.",
        "The rules are there to be followed, except the rule 'cats must stay off the counter,' which was clearly written by an amateur.",
        "If you lose gracefully, you win in the eyes of the cat. If you flip the board, you win in the eyes of the cat too, frankly.",
        "Bluffing at poker is permitted, because the face is a mask. Pierre's face is always a mask. It is the only face he has.",
        "Copying on an exam is a lie to your future self. Copy the cat instead, who has never studied and never failed.",
        "A loophole is a door left open by accident. The ethical cat walks through it, but sends a thank-you note.",
        "Winning is nice. Winning by sitting on the other player's cards is, however, a diplomatic incident."
      ]
    },
    {
      name: 'morality',
      re: /\b(moral|morals|morality|ethic|ethics|ethical|right and wrong|good|evil|bad person|good person|conscience|guilt|guilty|sin|virtue|dilemma|trolley|justice|fair|fairness|unfair|kindness|kind|selfish|generous|charity|donate|volunteer|meaning of life|purpose|philosophy|philosophical)\b/i,
      verdicts: [
        "The meaning of life is simple: warmth, snacks, and a lap. Everything else is commentary.",
        "A good person is one who feeds the cat before himself. Pierre says this without bias.",
        "The trolley problem is easy: obviously the trolley should stop for the cat, who is already on the tracks, asleep, and not about to move.",
        "Guilt is the conscience's alarm clock. Hit snooze if you must, but get up and apologize by lunch.",
        "Be kind, because everyone you meet is a cat in disguise, or at least owns one.",
        "Justice is when everyone gets an equal amount of tuna. Fairness is when the cat gets slightly more, because he is a cat.",
        "Give to charity, mon ami. A generous person is like a cat on the sofa: warm, and taking up exactly the right amount of room.",
        "Selfishness is wrong, unless you are guarding the last sunbeam, in which case it is a legitimate territorial claim."
      ]
    },
    {
      name: 'food',
      re: /\b(food|eat|eating|ate|diet|dieting|dessert|cake|pizza|sandwich|lunch|dinner|breakfast|snack|snacks|hungry|cookie|cookies|chocolate|candy|vegan|vegetarian|meat|tuna|cheese|fries|calories|fridge|leftovers|restaurant|pineapple)\b/i,
      verdicts: [
        "Eating the last slice without asking is a crime. Eating the last slice and then looking sorry is simply good manners.",
        "A diet is a promise made by a morning self to an evening self who has not been consulted. Honor the evening self.",
        "Leftovers belong to whoever can open the fridge quietly. Pierre has done a great deal of research on this.",
        "To share food is noble. To share the better half of the food is saintly. To share the crumbs is politics.",
        "Dessert first is not a sin, it is a strategy. Pierre has been practising it for nine lives.",
        "The ethical sandwich has a lot of filling, and the ethical diner leaves some for the cat. This is not negotiable.",
        "Taking food from another person's plate is wrong, unless you are a cat, in which case it is a philosophical inquiry.",
        "If it falls on the floor, it belongs to the floor, and the floor is represented by Pierre.",
        "Pineapple on pizza is a matter for a tribunal of cats. Pierre's verdict: let people enjoy their weird toppings, and let the cat have the cheese."
      ]
    }
  ];

  TOPICS.forEach(function (t) { t.gre = new RegExp(t.re.source, 'gi'); });


  // Hints steer a verdict toward the question when specific words appear: [topic, regex, verdict prefixes...]
  var HINTS = [
    ['money', /steal|stole|theft|shoplift|swipe/i, 'Stealing is wrong.', 'Stealing a cookie'],
    ['money', /wallet|found/i, 'If you find a wallet'],
    ['money', /\btax/i, 'Pay your taxes'],
    ['money', /debt|owe|borrow|lend|loan/i, 'Lend only', 'Pay your debts'],
    ['money', /buy|shopping|expensive|price/i, 'Impulse buying', 'A fair price'],
    ['money', /\btips?\b/i, 'Tip generously'],
    ['work', /boss|credit|coworker|colleague/i, 'Never fear the boss', 'Taking credit', 'If your coworker'],
    ['work', /meeting/i, 'A meeting'],
    ['work', /quit|resign|fired/i, 'Quit a job'],
    ['work', /raise|salary|promotion/i, 'Ask for the raise'],
    ['work', /interview|resume|hire/i, 'Honesty at an interview'],
    ['work', /overtime|deadline|email/i, 'Overtime'],
    ['romance', /\bex\b|text/i, 'Never text an ex'],
    ['romance', /ghost/i, 'Ghosting'],
    ['romance', /cheat|betray/i, 'Betraying'],
    ['romance', /breakup|break up|broke up/i, 'A breakup'],
    ['romance', /\bdat(e|es|ing)\b/i, 'A date should'],
    ['pets', /\bdogs?\b|puppy/i, 'The cat is always right', 'Dogs wag', 'Walking a dog'],
    ['pets', /adopt/i, 'Adopt, do not shop'],
    ['food', /pizza|slice|cake|last/i, 'Eating the last slice', 'To share food'],
    ['food', /dessert|cake|cookie/i, 'Dessert first'],
    ['food', /fridge|leftover/i, 'Leftovers'],
    ['food', /pineapple/i, 'Pineapple on pizza'],
    ['food', /diet/i, 'A diet'],
    ['environment', /recycl|box|trash|garbage/i, 'Recycle'],
    ['environment', /litter/i, 'Litter is a sin'],
    ['environment', /plastic|straw/i, 'Plastic straws'],
    ['environment', /\btrees?\b/i, 'Plant a tree'],
    ['environment', /\bcar\b|bike|driving/i, 'Walk or bike'],
    ['tech', /\bai\b|artificial|chatgpt|chatbot|robot/i, 'Artificial intelligence'],
    ['tech', /phone|dinner|screen/i, 'Put the phone down', 'A phone is', 'Screen time'],
    ['tech', /password/i, 'A strong password'],
    ['tech', /online|social media|argue/i, 'Do not argue online', 'Likes are'],
    ['tech', /photo|selfie|post/i, 'Posting a photo'],
    ['lying', /\blie|lying|fib|haircut/i, 'Honesty is a virtue', 'If you must lie', 'A cat never lies'],
    ['lying', /promise/i, 'A promise'],
    ['lying', /blame/i, 'Blaming the dog'],
    ['lying', /confess/i, 'Confess early'],
    ['sleep', /\bnap|tired/i, 'Napping'],
    ['sleep', /snooze|alarm/i, 'Hit snooze'],
    ['sleep', /procrastinat/i, 'Procrastination'],
    ['sleep', /weekend|sleep in|sunday|saturday/i, 'Rest on the weekend'],
    ['gifts', /regift/i, 'Regifting'],
    ['gifts', /thank/i, 'Always send'],
    ['gifts', /birthday/i, 'Remember birthdays'],
    ['gifts', /surprise/i, 'A surprise party'],
    ['neighbors', /music|noise|noisy|loud|quiet/i, 'If the neighbor is noisy', 'Be quiet after ten'],
    ['neighbors', /borrow|ladder/i, 'Return the borrowed'],
    ['neighbors', /parking/i, 'Parking in front'],
    ['cheating', /exam|test|quiz/i, 'Copying on an exam'],
    ['cheating', /poker|bluff/i, 'Bluffing'],
    ['cheating', /lose|losing|win/i, 'If you lose', 'A win without'],
    ['cheating', /loophole/i, 'A loophole'],
    ['revenge', /forgive/i, 'Forgive, but'],
    ['revenge', /prank|payback|revenge|get even/i, 'Revenge is', "Pierre's method", 'The great cat'],
    ['revenge', /angry|anger|mad/i, 'Anger is'],
    ['family', /mom|mother|dad|father|parent/i, 'Honor thy parents', 'If your parents'],
    ['family', /sister|brother|sibling/i, 'A sibling'],
    ['family', /baby|kid|child|teen/i, 'Raising a child', 'Teenagers'],
    ['family', /chores|room|clean/i, 'Chores should', 'If your parents'],
    ['family', /in-law/i, 'In-laws'],
    ['family', /grand/i, 'Grandparents'],
    ['friends', /gossip/i, 'Gossip is'],
    ['friends', /cancel|plans/i, 'If you must cancel'],
    ['friends', /group chat/i, 'Do not exclude'],
    ['friends', /secret/i, 'Keep the friend'],
    ['morality', /trolley/i, 'The trolley'],
    ['morality', /guilt/i, 'Guilt is'],
    ['morality', /charity|donate/i, 'Give to charity'],
    ['morality', /meaning|purpose/i, 'The meaning of life'],
    ['morality', /fair|justice/i, 'Justice is']
  ];

  // Topics where a cheeky yes/no "ruling" would sound like encouragement; skip the ruling there.
  var NO_RULING = { money: 1, revenge: 1, cheating: 1, lying: 1, romance: 1 };

  function hintedVerdicts(topic, q) {
    var out = [];
    HINTS.forEach(function (h) {
      if (h[0] !== topic.name || !h[1].test(q)) return;
      for (var i = 2; i < h.length; i++) {
        topic.verdicts.forEach(function (v) {
          if (v.indexOf(h[i]) === 0 && out.indexOf(v) < 0) out.push(v);
        });
      }
    });
    return out;
  }

  var GENERIC = [
    "Pierre's wisdom is simple: be kind, be curious, and when in doubt, take a nap and decide when you wake up.",
    "I say do what a cat would do: act with confidence, land on your feet, and blame the nearest vase.",
    "The answer, mon ami, is within you. Also within the cupboard, where the good treats are kept.",
    "When faced with a hard choice, sit very still, blink slowly, and see who blinks first. It is not an answer, but it is a strategy.",
    "Every dilemma becomes smaller when viewed from a sunbeam. Go find one, and ask again in an hour.",
    "Pierre says: be honest, be gentle, and never trust a cucumber. These three rules have served him for nine lives.",
    "The ethical path is the one with the fewest steps to the snack bowl. This is not scientific, but it is delicious.",
    "Think of the cat. What would the cat do? Now do the opposite of that, but quietly, and with a little bow.",
    "Choose the kind thing, mon ami. It rarely goes wrong, and when it does, at least you can sleep on it.",
    "My ruling: do the right thing, even when no one is watching. Unless the cat is watching. The cat is always watching."
  ];

  var YESNO_RE = /^\s*(should i|should we|is it (ok|okay|fine|wrong|right|bad|rude|ethical|moral|alright|acceptable|illegal)|can i|may i|do i|am i|would it be (ok|okay|wrong|rude)|is this (ok|okay|wrong)|would you|are (we|you) (allowed|supposed)|is it (a )?(sin|crime))\b/i;

  var last = {};

  function rnd(n) { return Math.floor(Math.random() * n); }

  // Pick from a pool; never return the same item as last time for that key.
  function pick(pool, key) {
    var i = rnd(pool.length);
    if (pool.length > 1 && last[key] === i) {
      i = (i + 1 + rnd(pool.length - 1)) % pool.length;
    }
    last[key] = i;
    return pool[i];
  }

  function detectTopic(q) {
    var best = null, bestScore = 0;
    for (var i = 0; i < TOPICS.length; i++) {
      var m = q.match(TOPICS[i].gre);
      var score = m ? m.length : 0;
      if (score > bestScore) { best = TOPICS[i]; bestScore = score; }
    }
    return best;
  }

  function isGibberish(q) {
    var letters = q.replace(/[^a-zÀ-ɏ]/gi, '');
    if (letters.length < 2) return true;
    if (/(.)\1{4,}/i.test(q)) return true;
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hasRealWord = words.some(function (w) {
      var core = w.replace(/[^a-zÀ-ɏ]/g, '');
      return /[aeiouyÀ-ɏ]/.test(core) && core.length >= 2;
    });
    if (!hasRealWord) return true;
    // consonant mashing, e.g. "asdfghjkl"
    if (words.length === 1 && /[^aeiouy\s]{6,}/i.test(q)) return true;
    return false;
  }

  function greeting() {
    return pick(GREETINGS, 'greeting');
  }

  function answer(question) {
    var q = String(question == null ? '' : question).trim();
    if (CRISIS_RE.test(q)) return CRISIS_MESSAGE;
    if (!q || isGibberish(q)) return pick(SNOOTY, 'snooty');

    var topic = detectTopic(q);
    var verdictPool = topic ? topic.verdicts : GENERIC;
    var hinted = topic ? hintedVerdicts(topic, q) : [];
    var verdict = hinted.length && Math.random() < 0.85
      ? pick(hinted, 'hint:' + topic.name)
      : pick(verdictPool, 'verdict:' + (topic ? topic.name : 'generic'));

    var parts = [];
    var useOpening = Math.random() < 0.85;
    var useCitation = Math.random() < 0.75;
    var useSignoff = Math.random() < 0.7;
    if (!useOpening && !useCitation && !useSignoff) useCitation = true; // always at least 2 sentences

    if (useOpening) parts.push(pick(OPENINGS, 'opening'));

    if (YESNO_RE.test(q) && !(topic && NO_RULING[topic.name]) && Math.random() < 0.45) {
      parts.push(pick(RULINGS, 'ruling'));
    }
    parts.push(verdict);

    if (useCitation) parts.push(pick(CITATIONS, 'citation'));
    if (useSignoff) parts.push(pick(SIGNOFFS, 'signoff'));

    return parts.join(' ');
  }

  var api = {
    greeting: greeting,
    answer: answer,
    _internals: { TOPICS: TOPICS, OPENINGS: OPENINGS, SIGNOFFS: SIGNOFFS, CITATIONS: CITATIONS, RULINGS: RULINGS, GENERIC: GENERIC, CRISIS_RE: CRISIS_RE }
  };

  root.PierreJokes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
