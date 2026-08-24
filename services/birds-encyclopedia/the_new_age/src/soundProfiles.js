// Pure-data sound-profile resolver (shared by the browser audio engine and the
// Node AGI export). No browser APIs here so it's safe to import in Node.
// Maps a bird's family (or explicit override) to a named synth voice.

export const FAMILY_SOUND = {
  'Psittacidae': 'parrot',
  'Phoenicopteridae': 'flamingo',
  'Ciconiidae': 'stork',
  'Struthionidae': 'ostrich',
  'Sagittariidae': 'secretary',
  'Coraciidae': 'roller',
  'Accipitridae': 'accipiter',
  'Gruidae': 'crane',
  'Bucorvidae': 'hornbill',
  'Balaenicipitidae': 'shoebill',
  'Otididae': 'bustard',
  'Numididae': 'guineafowl',
  'Buphagidae': 'oxpecker',
  'Spheniscidae': 'penguin',
  'Charadriidae': 'lapwing',
  'Sturnidae': 'starling',
  'Jacanidae': 'jacana',
  'Threskiornithidae': 'ibis',
};

export function soundProfileFor(bird) {
  if (bird.sound && bird.sound.type === 'file') return 'file:' + (bird.sound.src || '?');
  if (bird.sound && bird.sound.profile) return bird.sound.profile;
  return FAMILY_SOUND[bird.family] || 'generic';
}
