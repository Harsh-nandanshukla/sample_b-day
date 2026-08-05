/* =========================================================================
   Birthday Surprise — compliments.js
   Pure data module. No DOM access, no event listeners, no app logic —
   script.js reads from window.BirthdayData once this file has run.
   Load order in index.html: compliments.js (defines the data) before
   script.js (consumes it).
   ========================================================================= */

window.BirthdayData = {

  /* -----------------------------------------------------------------------
     100 unique compliments, shown one at a time after the YES balloon pops
     and via the "Next compliment" button. Grouped by theme below purely for
     the maintainer's sake (smile, eyes, laugh, kindness, personality,
     intelligence, support, beauty, warmth, happiness) — the app should treat
     this as one flat, shuffled-at-random list, not read it in order.
     ----------------------------------------------------------------------- */
  compliments: [

    // Smile
    "Your smile is the first thing that makes every one of my mornings better.",
    "When you smile, it feels like the whole room gets a little brighter.",
    "There's a kind of magic in your smile that I never get tired of seeing.",
    "Your smile has this way of making even my worst days feel okay again.",
    "I could watch you smile for hours and never once get bored.",
    "That little smile you make when you're trying not to laugh is my favorite thing.",
    "Your smile is proof that the best things in life really are free.",
    "Every time you smile at me, I fall for you a little more.",
    "You have the kind of smile people write songs about.",
    "Your smile is my favorite notification of the day.",

    // Eyes
    "Your eyes tell stories your words haven't caught up to yet.",
    "I could get lost in your eyes and never want to be found.",
    "There's a warmth in your eyes that makes me feel instantly at home.",
    "When you look at me like that, I forget what I was even worried about.",
    "Your eyes light up in a way that makes everything around you feel softer.",
    "I love the way your eyes crinkle at the corners when you're truly happy.",
    "Your eyes always give away exactly how much love you're carrying inside.",
    "I can read every honest feeling you have just by looking into your eyes.",
    "There's a quiet kindness in your eyes I noticed the very first day.",
    "Your eyes are the kind you remember long after you look away.",

    // Laugh
    "Your laugh is my favorite sound in the entire world.",
    "The way you laugh at your own jokes before you even finish them is everything.",
    "Hearing you laugh from another room instantly makes me smile.",
    "Your laugh is so real and unfiltered that it makes everyone laugh with you.",
    "I would do almost anything just to hear that laugh one more time.",
    "You have the kind of laugh that turns an ordinary moment into a memory.",
    "Your laugh is loud, honest, and completely, wonderfully you.",
    "The sound of you laughing is the best part of my day, every single time.",
    "I love how you laugh with your whole self, not just your voice.",
    "Your laugh has a way of making hard days feel a little lighter.",

    // Kindness
    "You have this quiet way of taking care of people without ever making it about you.",
    "Your kindness isn't loud, but everyone who meets you feels it.",
    "You always know exactly what someone needs to hear, even when it's not you.",
    "The way you treat strangers with the same care as people you love says everything about your heart.",
    "You give kindness away so freely, like it costs you nothing, even when it costs you everything.",
    "I've never met anyone who notices the little things the way you do.",
    "Your kindness makes people feel safe just by being near you.",
    "You make everyone around you feel like they matter, and that's a rare gift.",
    "The gentlest part of you is also the strongest, and I see it every day.",
    "You love people well, even on the days when no one's watching.",

    // Personality / character
    "You are effortlessly, unapologetically yourself, and it's one of my favorite things about you.",
    "There's a spark in you that no one else quite has.",
    "You make ordinary days feel like an adventure just by being in them.",
    "Your honesty is rare, and I've never once doubted your heart.",
    "You have this way of turning chaos into calm just by staying yourself.",
    "You're the kind of person people are lucky to know, and I'm the luckiest of all.",
    "Your energy fills a room before you even say a word.",
    "You surprise me in the best ways, even after all this time.",
    "There's a depth to you that I keep discovering, and I never want to stop.",
    "You are so much more than beautiful — you are genuinely, wonderfully good.",

    // Intelligence
    "The way your mind works fascinates me more every single day.",
    "You ask questions no one else thinks to ask, and I love that about you.",
    "Your ideas make me see the world a little differently every time you share them.",
    "You're sharp, thoughtful, and somehow still so humble about it.",
    "I love how you think three steps ahead of everyone else in the room.",
    "Talking to you is never boring — your mind is one of my favorite places to be.",
    "You solve problems with a quiet confidence that I deeply admire.",
    "Your curiosity about the world makes me more curious too.",
    "You remember details about people that most would forget, and it shows how deeply you pay attention.",
    "I've never met anyone who makes being brilliant look this effortless.",

    // Support
    "You've shown up for me on days I didn't even know I needed it.",
    "No matter what I'm going through, you make me feel like I'm not carrying it alone.",
    "You believe in me even in the moments I stop believing in myself.",
    "You have this way of making my problems feel smaller just by listening.",
    "Every time I doubt myself, your voice is the one that talks me back up.",
    "You've never once made me feel like too much.",
    "You show up quietly, consistently, and completely — that's rare.",
    "Whatever I'm facing, knowing you're in my corner makes it feel possible.",
    "You give the kind of support that doesn't need to be asked for.",
    "You've made me braver just by standing beside me.",

    // Beauty
    "You're beautiful in a way that has nothing to do with mirrors and everything to do with how you make people feel.",
    "There's a kind of beauty in you that only shows up the longer someone gets to know you.",
    "You carry yourself with a grace that isn't taught — it's just who you are.",
    "Even on your most ordinary days, you take my breath away.",
    "The way the light catches you when you're not paying attention is unfair to everyone else in the room.",
    "You're the kind of beautiful that doesn't fade with time, it just deepens.",
    "I notice something new to love about the way you look every single day.",
    "You could wear anything at all and still be the most striking person in the room.",
    "Your beauty was the first thing I noticed, and the smallest reason I fell for you.",
    "Every photo of you is proof, but none of them capture you the way being near you does.",

    // Warmth / comfort
    "Being near you feels like coming in from the cold.",
    "You make ordinary rooms feel like home.",
    "There's a softness to you that makes people want to stay close.",
    "You have this rare ability to make people feel instantly comfortable around you.",
    "Your presence alone is enough to calm a chaotic day.",
    "You are the safest place I know.",
    "Something about you makes even silence feel comfortable.",
    "You give the kind of hugs that make bad days disappear for a minute.",
    "Being with you feels less like a moment and more like a place I belong.",
    "You make hard conversations feel a little less scary just by being there.",

    // Happiness she brings
    "You've made my ordinary life feel like something worth celebrating every day.",
    "Since you came into my life, everything just feels a little brighter.",
    "You turn small moments into memories I never want to forget.",
    "Loving you is the easiest and best decision I keep making, every single day.",
    "You make me want to be a better version of myself, just by being who you are.",
    "I didn't know life could feel this light until you were in it.",
    "You are, without question, the best part of my everyday.",
    "Every year with you has been better than the one before, and I can't wait for the next one.",
    "You're my favorite person to tell good news to, and my favorite person to sit with in bad news.",
    "Being loved by you is the greatest gift I never expected to receive."
  ],

  /* -----------------------------------------------------------------------
     NO-button responses, shown in this exact order as each escape happens.
     After the last one is used, script.js is expected to dissolve the
     button into hearts rather than looping back to the start.
     ----------------------------------------------------------------------- */
  noResponses: [
    "Are you sure?",
    "Really?",
    "Think again...",
    "Wrong answer.",
    "I know the answer already."
  ],

  /* -----------------------------------------------------------------------
     Final birthday message, revealed after "Open Your Birthday Gift".
     Written as a single string with a blank line before the closing line
     so script.js can render it as-is (e.g. with CSS white-space: pre-line)
     or split on "\n\n" if it prefers separate paragraph elements.
     ----------------------------------------------------------------------- */
  finalMessage:
    "Happiest birthday, my love.\n\n" +
    "Today isn't just about celebrating another year of you — it's about " +
    "celebrating every little thing that makes you, you. Your smile, your " +
    "laugh, the way you love people so fully, and the way you've made an " +
    "ordinary life feel like something worth waking up for.\n\n" +
    "I hope today gives you even a fraction of the joy you give everyone " +
    "around you, every single day. Thank you for choosing me, for staying, " +
    "and for letting me love you.\n\n" +
    "Here's to you, to us, and to every birthday I get to spend by your side.\n\n" +
    "Forever & Always ❤️"
};
