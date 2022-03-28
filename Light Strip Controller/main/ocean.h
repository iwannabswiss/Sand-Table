#ifndef LIGHT_STRIP_CONTOLLER_OCEAN_H

#define LIGHT_STRIP_CONTROLLER_OCEAN_H

#include "constants.h"
#include <FastLED.h>

// Adapted from https://github.com/FastLED/FastLED/blob/master/examples/Pacifica/Pacifica.ino

CRGBPalette16 pacifica_palette_1 =
    { 0x000507, 0x000409, 0x00030B, 0x00030D, 0x000210, 0x000212, 0x000114, 0x000117,
      0x000019, 0x00001C, 0x000026, 0x000031, 0x00003B, 0x000046, 0x14554B, 0x28AA50 };
CRGBPalette16 pacifica_palette_2 =
    { 0x000507, 0x000409, 0x00030B, 0x00030D, 0x000210, 0x000212, 0x000114, 0x000117,
      0x000019, 0x00001C, 0x000026, 0x000031, 0x00003B, 0x000046, 0x0C5F52, 0x19BE5F };
CRGBPalette16 pacifica_palette_3 =
    { 0x000208, 0x00030E, 0x000514, 0x00061A, 0x000820, 0x000927, 0x000B2D, 0x000C33,
      0x000E39, 0x001040, 0x001450, 0x001860, 0x001C70, 0x002080, 0x1040BF, 0x2060FF };

void ocean(CRGB *leds, uint8_t *dat)
{
	(void)dat;

  // Increment the four "color index start" counters, one for each wave layer.
  // Each is incremented at a different speed, and the speeds vary over time.
  static uint16_t sCIStart1, sCIStart2, sCIStart3, sCIStart4;
  static uint32_t sLastms = 0;
  uint32_t ms = GET_MILLIS();
  uint32_t deltams = ms - sLastms;
  sLastms = ms;
  uint16_t speedfactor1 = beatsin16(3, 179, 269);
  uint16_t speedfactor2 = beatsin16(4, 179, 269);
  uint32_t deltams1 = (deltams * speedfactor1) / 256;
  uint32_t deltams2 = (deltams * speedfactor2) / 256;
  uint32_t deltams21 = (deltams1 + deltams2) / 2;
  sCIStart1 += (deltams1 * beatsin88(1011,10,13));
  sCIStart2 -= (deltams21 * beatsin88(777,8,11));
  sCIStart3 -= (deltams1 * beatsin88(501,5,7));
  sCIStart4 -= (deltams2 * beatsin88(257,4,6));

  // Clear out the LED array to a dim background blue-green
  fill_solid( leds, NUM_LEDS, CRGB( 2, 6, 10));

  // Render each of four layers, with different scales and speeds, that vary over time
  
  //pacifica_palette_1
  uint16_t ci = sCIStart1;
  uint16_t waveangle = 0-beat16( 301);
  uint16_t wavescale_half = (beatsin16( 3, 11 * 256, 14 * 256)/ 2) + 20;
  for( uint16_t i = 0; i < NUM_LEDS; i++) {
    waveangle += 250;
    uint16_t s16 = sin16( waveangle ) + 32768;
    uint16_t cs = scale16( s16 , wavescale_half ) + wavescale_half;
    ci += cs;
    uint16_t sindex16 = sin16( ci) + 32768;
    uint8_t sindex8 = scale16( sindex16, 240);
    CRGB c = ColorFromPalette( pacifica_palette_1, sindex8, beatsin8( 10, 70, 130), LINEARBLEND);
    leds[i] += c;
  }
 
  //pacifica_palette_2
  ci = sCIStart2;
  waveangle = beat16( 401);
  wavescale_half = (beatsin16( 4,  6 * 256,  9 * 256)/ 2) + 20;
  for( uint16_t i = 0; i < NUM_LEDS; i++) {
    waveangle += 250;
    uint16_t s16 = sin16( waveangle ) + 32768;
    uint16_t cs = scale16( s16 , wavescale_half ) + wavescale_half;
    ci += cs;
    uint16_t sindex16 = sin16( ci) + 32768;
    uint8_t sindex8 = scale16( sindex16, 240);
    CRGB c = ColorFromPalette( pacifica_palette_2, sindex8, beatsin8( 17, 40,  80), LINEARBLEND);
    leds[i] += c;
  } 
  
  //pacifica_palette_3
  ci = sCIStart3;
  waveangle = 0-beat16(503);
  wavescale_half = (6 * 256/ 2) + 20;
  for( uint16_t i = 0; i < NUM_LEDS; i++) {
    waveangle += 250;
    uint16_t s16 = sin16( waveangle ) + 32768;
    uint16_t cs = scale16( s16 , wavescale_half ) + wavescale_half;
    ci += cs;
    uint16_t sindex16 = sin16( ci) + 32768;
    uint8_t sindex8 = scale16( sindex16, 240);
    CRGB c = ColorFromPalette( pacifica_palette_3, sindex8, beatsin8( 9, 10,38), LINEARBLEND);
    leds[i] += c;
  }
  
  //pacifica_palette_4
  ci = sCIStart4;
  waveangle = beat16(601);
  wavescale_half = (5 * 256/ 2) + 20;
  for( uint16_t i = 0; i < NUM_LEDS; i++) {
    waveangle += 250;
    uint16_t s16 = sin16( waveangle ) + 32768;
    uint16_t cs = scale16( s16 , wavescale_half ) + wavescale_half;
    ci += cs;
    uint16_t sindex16 = sin16( ci) + 32768;
    uint8_t sindex8 = scale16( sindex16, 240);
    CRGB c = ColorFromPalette( pacifica_palette_3, sindex8, beatsin8( 8, 10,28), LINEARBLEND);
    leds[i] += c;
  }
  
  // Add brighter 'whitecaps' where the waves lines up more
  uint8_t basethreshold = beatsin8( 9, 55, 65);
  uint8_t wave = beat8( 7 );

  for( uint16_t i = 0; i < NUM_LEDS; i++) {
    uint8_t threshold = scale8( sin8( wave), 20) + basethreshold;
    wave += 7;
    uint8_t l = leds[i].getAverageLight();
    if( l > threshold) {
      uint8_t overage = l - threshold;
      uint8_t overage2 = qadd8( overage, overage);
      leds[i] += CRGB( overage, overage2, qadd8( overage2, overage2));
    }
  }
  
  // Deepen the blues and greens a bit
  for( uint16_t i = 0; i < NUM_LEDS; i++) {
  	leds[i].blue = scale8( leds[i].blue,  145);
    	leds[i].green= scale8( leds[i].green, 200);
    	leds[i] |= CRGB( 2, 5, 7);
  }

  *dat++;
}

uint8_t *init_ocean_dat() {
	uint8_t *dat = (uint8_t *)malloc(sizeof(uint8_t));
	*dat = 0;

	return dat;
}
#endif
