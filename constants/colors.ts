// Color palette from QSXZ CI document

// Official CI background color
export const BACKGROUND_COLOR = '#e9eef9';

// Bubble PNG mapping (1-12)
// Each bubble has unique gradient colors baked into the PNG
export const BUBBLE_IMAGES = [
  { number: 1, name: 'b1-orange', file: 'bubble-01.png' },
  { number: 2, name: 'b2-red-green', file: 'bubble-02.png' },
  { number: 3, name: 'b3-dark-green', file: 'bubble-03.png' },
  { number: 4, name: 'b4-brown-red', file: 'bubble-04.png' },
  { number: 5, name: 'b5-yellow-green', file: 'bubble-05.png' },
  { number: 6, name: 'b6-blue', file: 'bubble-06.png' },
  { number: 7, name: 'b7-green-blue', file: 'bubble-07.png' },
  { number: 8, name: 'b8-red-green', file: 'bubble-08.png' },
  { number: 9, name: 'b9-yellow-green', file: 'bubble-09.png' },
  { number: 10, name: 'b10-yellow', file: 'bubble-10.png' },
  { number: 11, name: 'b11-green', file: 'bubble-11.png' },
  { number: 12, name: 'b12-dark-red', file: 'bubble-12.png' },
];

// Get bubble by number (1-12)
export const getBubbleImage = (number: number) => {
  const bubble = BUBBLE_IMAGES.find(b => b.number === number);
  return bubble ? bubble.file : 'bubble-01.png';
};

// Get a deterministic bubble number based on index
export const getBubbleNumberForIndex = (index: number) => {
  return (index % 12) + 1;
};

