import React from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { GalleryStrip } from './components/GalleryStrip';
import { AboutFeature } from './components/AboutFeature';
import { LatestMoments } from './components/LatestMoments';
import { Collage } from './components/Collage';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main>
        <Hero />
        <GalleryStrip />
        <AboutFeature />
        <LatestMoments />
        <Collage />
        <Testimonials />
        <FAQ />
        <Footer />
      </main>
    </div>
  );
}

export default App;
