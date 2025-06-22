'use client';

import { ResourceTrack } from './ResourceTrack';
import { ResourceType } from '@/components/Company/Factory/Factory.types';

const generateTrack = (length: number, basePrice: number, increment: number): number[] => {
  const track = [];
  let currentPrice = basePrice;
  for (let i = 0; i < length; i++) {
    track.push(currentPrice);
    if (i % 3 === 0 && i > 0) { // Make the increment a bit more variable
        currentPrice += increment + 1;
    } else {
        currentPrice += increment;
    }
  }
  return track.reverse();
};

const circleTrack = generateTrack(15, 8, 2);
const squareTrack = generateTrack(20, 5, 1);
const triangleTrack = generateTrack(25, 4, 1);
const starTrack = generateTrack(12, 10, 2);

const MOCK_RESOURCE_TRACK_DATA: Record<string, { track: number[], currentPrice: number, resourceType: ResourceType }> = {
  'CIRCLE': {
    track: circleTrack,
    currentPrice: circleTrack[5],
    resourceType: 'CIRCLE',
  },
  'SQUARE': {
    track: squareTrack,
    currentPrice: squareTrack[10],
    resourceType: 'SQUARE',
  },
  'TRIANGLE': {
    track: triangleTrack,
    currentPrice: triangleTrack[15],
    resourceType: 'TRIANGLE',
  },
  'STAR <MATERIALS>': {
    track: starTrack,
    currentPrice: starTrack[6],
    resourceType: 'STAR',
  },
  'STAR <INDUSTRIALS>': {
    track: starTrack,
    currentPrice: starTrack[4],
    resourceType: 'STAR',
  },
  'STAR <TECHNOLOGY>': {
    track: starTrack,
    currentPrice: starTrack[8],
    resourceType: 'STAR',
  },
};

export function ResourceTracksContainer() {
  return (
    <div className="p-4 space-y-4">
      {(Object.keys(MOCK_RESOURCE_TRACK_DATA)).map((trackTitle) => {
        const data = MOCK_RESOURCE_TRACK_DATA[trackTitle as keyof typeof MOCK_RESOURCE_TRACK_DATA];
        if (!data) return null;
        const { track, currentPrice, resourceType } = data;
        return (
          <ResourceTrack
            key={trackTitle}
            title={trackTitle}
            resourceType={resourceType}
            track={track}
            currentPrice={currentPrice}
          />
        )
      })}
    </div>
  );
} 