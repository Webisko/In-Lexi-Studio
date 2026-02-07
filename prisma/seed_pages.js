const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PAGES = [
  {
    slug: 'about',
    title: 'About Me',
    meta_title: 'About Only - InLexi Studio',
    meta_description:
      'Born in Poland and raised in Algeria, my childhood in North Africa gifted me with my most cherished memories.',
    content: `
      <h3>My Story</h3>
      <h4>LET ME INTRODUCE MYSELF</h4>
      <p>Born in Poland and raised in Algeria, my childhood in North Africa gifted me with my most cherished memories. Growing up between different cultures shaped my outlook, fostering openness, curiosity, and appreciation for human uniqueness.</p>
      <p>Empathy and compassion became my core values during these formative years. Later, as a teenager back in my hometown of Gliwice, I discovered a passion for sports and developed a deep appreciation for cinema and music. The works of David Lynch and Stanley Kubrick, alongside both alternative and classical music, significantly influenced my artistic sensibility.</p>
      <p>Photography entered my life at a perfect time as a beautiful discovery, and it quickly blossomed into my creative sanctuary—a wonderful portal to realms where my imagination runs wild.</p>
      <p>After completing my photography degree, I realized how all my previous experiences converged to shape me as an artist.</p>
      <blockquote>„My journey has shaped how I see the world through my lens. Years of working in social settings have given me an intuition for human connection and the quiet ability to anticipate special moments.”</blockquote>
      <p>My love of languages and cultural exploration brings an understanding of diverse traditions, while my passion for visual storytelling guides my artistic approach.</p>
      <p>On your wedding day, I become part of the natural flow—a calm presence capturing your celebration with both precision and heart, preserving the authentic essence of your unique story.</p>
      
      <h3>Living Fully</h3>
      <p>Physical movement fuels my spirit, particularly my passion for water sports. Years of open water swimming have taught me the pure joy of working with natural elements and have been like a masterclass in finding harmony with nature’s raw power and beauty—this is what living fully means to me.</p>
      <p>My work as a French teacher has deepened my conviction that language—whether spoken or captured through a lens—serves as our bridge to understanding others and exploring our shared world. There’s something magical about connecting across different ways of expression.</p>
      <p>The foundation of my well-being rests on my daily practice of Qigong, Gulun Kung Fu, and meditation. These practices bring a beautiful integration of clarity, creativity, and inner peace that enriches everything I do, both personally and professionally, helping me embrace the art of living fully with complete presence and joy.</p>
      
      <h3>Passion & Purpose</h3>
      <p>What excites me most about my work? Witnessing how my skills actually make a real difference in people’s lives. There’s nothing quite like that incredible moment when I realize something I created brought joy or value to someone else. That’s what truly energizes me every single day!</p>
      <p>My endless curiosity about people and their unique stories continues to be my greatest source of creative inspiration. I’ve found that when we approach our work with authentic joy and mindfulness, it naturally shines through in everything we create.</p>
      <p>For me, success goes beyond professional achievements—it’s about living with genuine purpose and staying present in each moment.</p>
      <p>Finding motivation and fulfilment in knowing my skills create value and happiness for others is deeply rewarding and continues to inspire my work.</p>
      
      <h3>When I'm not shooting</h3>
      <p>My love for nature draws me to hiking trails and traveling to new destinations, where I can discover different lands and immerse myself in diverse cultures. There’s something magical about experiencing how people live and connect across the world.</p>
      <p>When I’m not exploring new places, you’ll find me on the tennis or badminton court, or behind my drum kit. Playing with my boys in the band gives me incredible satisfaction and deep relaxation when time allows—there’s nothing quite like losing yourself in rhythm and music with close friends.</p>
    `,
  },
  {
    slug: 'approach',
    title: 'My Approach',
    meta_title: 'My Approach - InLexi Studio',
    meta_description:
      'My passion/goal is creating beautiful, heartfelt photographs that become treasured pieces of your family’s story.',
    content: `
      <h3>My Approach to Photography</h3>
      <h4>HOW - WHAT - WHY - I DO?</h4>
      <p>My passion/goal is creating beautiful, heartfelt photographs that become treasured pieces of your family’s story.</p>
      <p>I specialize in weddings and receptions, but I’m equally excited to capture any celebration that’s meaningful to you—whether it’s an anniversary, milestone birthday, engagement party, or intimate family gathering.</p>
      <p>These aren’t just photos; they’re the memories your family will cherish for generations to come</p>
      <p>Your wedding day will be over before you know it. Memories may fade, but your photos will tell your story forever – capturing every smile, every tear, every moment of pure joy.</p>
      
      <h3>I don’t just take wedding photos – I preserve your love story.</h3>
      <p>From stolen glances to the dance floor magic, I’ll be there for it all. These images become windows back to your most precious day, moments you can relive whenever your heart desires. I pour my passion into every shot because I know these aren’t just pictures – they’re your legacy. From getting ready to the last dance, I capture the authentic, timeless moments that make your day uniquely yours.</p>
    `,
  },
  {
    slug: 'portfolio',
    title: 'Portfolio',
    content: `
      <h3>My Artwork</h3>
      <p>Explore my latest work across weddings, portraits, and more.</p>
    `,
  },
  {
    slug: 'wedding-photography',
    title: 'Wedding Photography',
    content: `
      <h3>Wedding photography Glasgow</h3>
      <h4>Timeless wedding photography that tells your unique love story</h4>
      <p>Every love story deserves to be told with passion and artistry. As a Glasgow-based wedding photographer, I combine creative vision with technical expertise to document your special day in its authentic beauty. My unobtrusive approach allows me to capture genuine moments while ensuring you and your guests feel comfortable throughout the celebration.</p>
      
      <h4>Before Your Wedding</h4>
      <ul>
        <li><strong>STEP 1 Discovery Call</strong> - Let's get to know each other! I'll learn about your vision, answer your questions, and make sure we're a great match.</li>
        <li><strong>STEP 2 Engagement Session</strong> - More than just beautiful photos, this is our chance to work together before the big day so you'll feel completely comfortable in front of my camera.</li>
        <li><strong>STEP 3 Planning Support</strong> - From timeline creation to lighting recommendations, I'm here to share my expertise every step of the way.</li>
      </ul>

      <h4>Your Wedding Day</h4>
      <ul>
        <li><strong>STEP 1 Unobtrusive Presence</strong> - I'll blend seamlessly into your celebration, capturing genuine moments without interrupting them.</li>
        <li><strong>STEP 2 Attention to Details</strong> - From the intricate lace on your dress to the tears in your partner's eyes, nothing goes unnoticed.</li>
        <li><strong>STEP 3 Direction When Needed</strong> - Gentle guidance for portraits while letting natural moments unfold authentically.</li>
      </ul>
      
      <h4>After Your Wedding</h4>
      <ul>
        <li><strong>STEP 1 Sneak Peeks</strong> - A curated selection of highlights within days so you don't have to wait to relive the magic.</li>
        <li><strong>STEP 2 Thoughtfully Edited Gallery</strong> - Your complete collection, carefully edited to reflect the emotions and atmosphere of your day.</li>
        <li><strong>STEP 3 Heirloom Products</strong> - Beautiful ways to display and preserve your images for generations to come.</li>
      </ul>
      
      <h3>Wedding Photography Session Types</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
        <div>
            <h4>Getting Ready Session</h4>
            <p>A documentary-style shoot capturing the anticipation and preparation before the ceremony: Bride and bridesmaids getting hair and makeup done, Groom and groomsmen putting on suits, Candid moments of nervous excitement, Detail shots of wedding attire, jewelry, and accessories.</p>
        </div>
        <div>
            <h4>Engagement Photoshoot</h4>
            <p>A pre-wedding session to capture the couple’s unique relationship: Casual and romantic outdoor locations, Urban settings in Glasgow or scenic Scottish landscapes. Can be used for save-the-date cards.</p>
        </div>
        <div>
            <h4>Traditional Ceremony Coverage</h4>
            <p>Documenting the official wedding ceremony: Processional and recessional, Exchange of vows and rings, Reactions of family and guests, Formal family group portraits.</p>
        </div>
        <div>
            <h4>Couple's Romantic Portraits</h4>
            <p>Intimate and artistic photographs of the newlyweds: Golden hour photography, Dramatic landscape backgrounds, Intimate, romantic poses.</p>
        </div>
        <div>
             <h4>Reception Reportage</h4>
             <p>Capturing the celebration and emotions: First dance, Speeches and toasts, Guest interactions, Dance floor energy.</p>
        </div>
        <div>
             <h4>Destination Wedding Coverage</h4>
             <p>For couples planning weddings in unique locations: Full-day or multi-day coverage, Travel-friendly packages, Comprehensive documentation of destination events.</p>
        </div>
      </div>
    `,
  },
  {
    slug: 'portrait-photography',
    title: 'Portrait Photography',
    content: '<p>Coming soon...</p>',
  },
  {
    slug: 'product-photography',
    title: 'Product Photography',
    content: '<p>Coming soon...</p>',
  },
  {
    slug: 'contact',
    title: 'Contact',
    content: '<p>Get in touch with us.</p>',
  },
  {
    slug: 'home',
    title: 'In Lexi Studio',
    meta_title: 'In Lexi Studio - Wedding & Portrait Photography',
    meta_description:
      'Welcome to IN LEXI STUDIO. MY PULSE QUICKENS. ADRENALINE COURSES THROUGH MY BODY. EVERY SENSE HEIGHTENED.',
    content: `
        <h3>Welcome to IN LEXI STUDIO</h3>
        <p><strong>MY PULSE QUICKENS. ADRENALINE COURSES THROUGH MY BODY. EVERY SENSE HEIGHTENED.</strong></p>
        <p>I scan the scene, taking it all in: expressions, connections, colours, movements, light, shadows, rhythm, shapes, laughter, tears, joy…</p>
        <p>This is what I live for—capturing the raw, unfiltered beauty of life as it unfolds.</p>
        <p>My camera isn’t just a tool; it’s an extension of my heart. With every click, I strive to preserve not just how a moment looks, but how it FEELS.</p>
        <p>Whether it’s the quiet intimacy of a glance or the explosive joy of celebration, my goal is to frame these fleeing seconds into timeless memories.</p>
        <p>I don’t just take pictures; I tell stories—your stories—filled with passion, honesty, and artistry. Let’s create something unforgettable together.</p>
        
        <h3>Moments Preserved, Emotions Captured</h3>
        <p>My approach is rooted in authentic storytelling. I blend into the background to capture candid moments while stepping in gently when needed to create artistic portraits. The result is a collection of images that are both natural and cinematic.</p>
      `,
    hero_image: '/uploads/ILS-68-glowna.webp',
  },
];

async function main() {
  console.log('Seeding pages...');

  for (const p of PAGES) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
    console.log(`Upserted ${p.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
