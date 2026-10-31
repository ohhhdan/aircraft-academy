import { useEffect, useState } from 'react';
import type { Aircraft } from '../types';
import { useMedia } from '../context/MediaContext';

interface Slide {
  key: string;
  url: string;
  alt: string;
}

interface PlateCarouselProps {
  aircraft: Aircraft;
  height?: number;
}

export function PlateCarousel({ aircraft, height = 240 }: PlateCarouselProps) {
  const { getSpotPhoto, getDiagram } = useMedia();
  const photo = getSpotPhoto(aircraft);
  const diagram = getDiagram(aircraft);

  const slides: Slide[] = [];
  if (photo.url) {
    slides.push({ key: 'photo', url: photo.url, alt: `${aircraft.family} photo` });
  }
  if (diagram?.url) {
    slides.push({ key: 'diagram', url: diagram.url, alt: `${aircraft.family} diagram` });
  }

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [aircraft.id]);

  if (slides.length === 0) {
    return (
      <div className="image-plate empty" style={{ minHeight: height }}>
        <span className="image-plate-placeholder">{aircraft.family}</span>
      </div>
    );
  }

  const safeIndex = Math.min(index, slides.length - 1);
  const slide = slides[safeIndex];
  const canNav = slides.length > 1;

  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + slides.length) % slides.length);
  };

  return (
    <div className="plate-carousel">
      <div className="image-plate filled plate-carousel-frame" style={{ minHeight: height }}>
        <img src={slide.url} alt={slide.alt} />
        {canNav && (
          <>
            <button
              type="button"
              className="plate-carousel-nav plate-carousel-nav--prev pressable"
              onClick={() => go(-1)}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              className="plate-carousel-nav plate-carousel-nav--next pressable"
              onClick={() => go(1)}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>
      {canNav && (
        <div className="plate-carousel-dots" role="tablist" aria-label="Images">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              className={`plate-carousel-dot ${i === safeIndex ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
