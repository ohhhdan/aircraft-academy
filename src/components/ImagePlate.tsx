import type { Aircraft } from '../types';
import { useMedia } from '../context/MediaContext';

interface ImagePlateProps {
  aircraft: Aircraft;
  kind?: 'photo' | 'diagram';
  label?: string;
  height?: number;
}

export function ImagePlate({ aircraft, kind = 'photo', label, height = 220 }: ImagePlateProps) {
  const { getSpotPhoto, getDiagram } = useMedia();
  const photo = getSpotPhoto(aircraft);
  const diagram = getDiagram(aircraft);
  const url = kind === 'photo' ? photo.url : diagram?.url;
  const attribution = kind === 'photo' ? photo.attribution : diagram?.attribution;

  return (
    <div>
      {label && (
        <div className="plate-label">
          <span>{label}</span>
          {!url && <span>NO IMAGE YET</span>}
        </div>
      )}
      <div className={`image-plate ${url ? 'filled' : 'empty'}`} style={{ minHeight: height }}>
        {url ? (
          <img src={url} alt={`${aircraft.family} ${kind}`} />
        ) : (
          <span className="image-plate-placeholder">{aircraft.family}</span>
        )}
      </div>
      {attribution && <div className="plate-credit">{attribution}</div>}
    </div>
  );
}
