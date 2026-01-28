import React from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { GalleryStrip } from './components/GalleryStrip';
import { AboutFeature } from './components/AboutFeature';
import { LatestMoments } from './components/LatestMoments';
import { Collage } from './components/Collage';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="bg-white min-h-screen">
      <Navigation />
      
      <main>
        <Hero />
        {/* Removed GalleryStrip to match specific landing page better or can keep as separating banner */}
        <GalleryStrip /> 
        <AboutFeature />
        <LatestMoments />
        <Collage />
        <FAQ />
        <Footer />
      </main>
    </div>
  );
}

export default App;