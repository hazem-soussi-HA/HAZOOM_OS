"""
Migration Script: Assets from LLM Source to Unified Hazoom
Author: Hazem Soussi
Date: 2025-10-31

This script copies all visual assets (emojis, icons, images) from the
LLM source dataset to the unified Hazoom system.
"""

import os
import shutil
import sys
from pathlib import Path

# Set UTF-8 encoding for Windows compatibility
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Configuration
LLM_SOURCE = Path("C:/Users/HP/Desktop/hazoom_website_system/LLM_hazoom_dataset_descriptive")
UNIFIED_TARGET = Path("C:/Users/HP/Desktop/hazoom_website_system/unified_hazoom/frontend")

# Source paths
LLM_ASSETS = LLM_SOURCE / "public hazoom image assets"
LLM_KANGOUROU = LLM_ASSETS / "images" / "Hazoom_Emoji_Kangooroo"
LLM_PROFILES = LLM_ASSETS / "images" / "Hazoom_Profil_users"
LLM_ICONS_PNG = LLM_ASSETS / "icons"
LLM_ICONS_SVG = LLM_ICONS_PNG / "Hazoom_Icone_SVG"

# Target paths
TARGET_ASSETS = UNIFIED_TARGET / "assets"
TARGET_EMOJIS = TARGET_ASSETS / "emojis"
TARGET_KANGOUROU = TARGET_EMOJIS / "kangourou"
TARGET_PROFILES = TARGET_EMOJIS / "profiles"
TARGET_ICONS = TARGET_ASSETS / "icons"
TARGET_ICONS_PNG = TARGET_ICONS / "png"
TARGET_ICONS_SVG = TARGET_ICONS / "svg"
TARGET_IMAGES = TARGET_ASSETS / "images"

def create_directories():
    """Create target directory structure"""
    print("🗂️  Creating directory structure...")
    
    directories = [
        TARGET_ASSETS,
        TARGET_EMOJIS,
        TARGET_KANGOUROU,
        TARGET_PROFILES,
        TARGET_ICONS,
        TARGET_ICONS_PNG,
        TARGET_ICONS_SVG,
        TARGET_IMAGES
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"   ✅ Created: {directory.relative_to(UNIFIED_TARGET)}")
    
    print("   ✓ Directory structure ready!\n")

def copy_kangourou_emojis():
    """Copy 13 kangourou emojis"""
    print("🦘 Copying kangourou emojis...")
    
    if not LLM_KANGOUROU.exists():
        print(f"   ❌ Source not found: {LLM_KANGOUROU}")
        return 0
    
    count = 0
    for file in LLM_KANGOUROU.glob("hazoom_emoji_*.svg"):
        target = TARGET_KANGOUROU / file.name
        shutil.copy2(file, target)
        print(f"   ✅ {file.name} ({file.stat().st_size // 1024} KB)")
        count += 1
    
    print(f"   ✓ Copied {count} kangourou emojis\n")
    return count

def copy_profile_emojis():
    """Copy 6 profile animal emojis"""
    print("🐻 Copying profile emojis...")
    
    if not LLM_PROFILES.exists():
        print(f"   ❌ Source not found: {LLM_PROFILES}")
        return 0
    
    count = 0
    # Rename to simpler names
    rename_map = {
        "Hazoom_emoji-bear.svg": "bear.svg",
        "Hazoom_emoji-cat.svg": "cat.svg",
        "Hazoom_emoji-frogl.svg": "frog.svg",
        "Hazoom_emoji-lion.svg": "lion.svg",
        "Hazoom_emoji-owl.svg": "owl.svg",
        "Hazoom_emoji-tiger.svg": "tiger.svg"
    }
    
    for source_name, target_name in rename_map.items():
        source = LLM_PROFILES / source_name
        if source.exists():
            target = TARGET_PROFILES / target_name
            shutil.copy2(source, target)
            print(f"   ✅ {source_name} → {target_name} ({source.stat().st_size // 1024} KB)")
            count += 1
    
    print(f"   ✓ Copied {count} profile emojis\n")
    return count

def copy_icons_png():
    """Copy 34 PNG icons"""
    print("🎨 Copying PNG icons...")
    
    if not LLM_ICONS_PNG.exists():
        print(f"   ❌ Source not found: {LLM_ICONS_PNG}")
        return 0
    
    count = 0
    for file in LLM_ICONS_PNG.glob("Icon_Hazoom_*.png"):
        target = TARGET_ICONS_PNG / file.name
        shutil.copy2(file, target)
        size_kb = file.stat().st_size // 1024
        print(f"   ✅ {file.name} ({size_kb} KB)")
        count += 1
    
    print(f"   ✓ Copied {count} PNG icons\n")
    return count

def copy_icons_svg():
    """Copy 34 SVG icons"""
    print("🎨 Copying SVG icons...")
    
    if not LLM_ICONS_SVG.exists():
        print(f"   ❌ Source not found: {LLM_ICONS_SVG}")
        return 0
    
    count = 0
    for file in LLM_ICONS_SVG.glob("icon_hazoom_*.svg"):
        target = TARGET_ICONS_SVG / file.name
        shutil.copy2(file, target)
        size_kb = file.stat().st_size // 1024
        print(f"   ✅ {file.name} ({size_kb} KB)")
        count += 1
    
    print(f"   ✓ Copied {count} SVG icons\n")
    return count

def copy_main_images():
    """Copy main images (logo, background, emoji_00)"""
    print("📸 Copying main images...")
    
    if not LLM_ASSETS.exists():
        print(f"   ❌ Source not found: {LLM_ASSETS}")
        return 0
    
    images = [
        "logo_hazoom.png",
        "background_hazoom_01.png",
        "hazoom_emoji_00.png"
    ]
    
    count = 0
    for image_name in images:
        source = LLM_ASSETS / image_name
        if source.exists():
            target = TARGET_IMAGES / image_name
            shutil.copy2(source, target)
            size_mb = source.stat().st_size / (1024 * 1024)
            print(f"   ✅ {image_name} ({size_mb:.2f} MB)")
            count += 1
        else:
            print(f"   ⚠️  Not found: {image_name}")
    
    print(f"   ✓ Copied {count} main images\n")
    return count

def create_emoji_mapping():
    """Create JavaScript mapping file for emojis"""
    print("📝 Creating emoji mapping file...")
    
    mapping_content = """/* 
 * Hazoom Emoji Mapping
 * Auto-generated by migrate_assets.py
 * Date: 2025-10-31
 */

// Kangourou emotions (13 variations)
export const KANGOUROU_EMOTIONS = {
  WELCOME: 'assets/emojis/kangourou/hazoom_emoji_1.svg',
  HAPPY: 'assets/emojis/kangourou/hazoom_emoji_2.svg',
  SURPRISED: 'assets/emojis/kangourou/hazoom_emoji_3.svg',
  THINKING: 'assets/emojis/kangourou/hazoom_emoji_4.svg',
  MOTIVATED: 'assets/emojis/kangourou/hazoom_emoji_5.svg',
  CONGRATULATIONS: 'assets/emojis/kangourou/hazoom_emoji_6.svg',
  SAD: 'assets/emojis/kangourou/hazoom_emoji_7.svg',
  CONFUSED: 'assets/emojis/kangourou/hazoom_emoji_8.svg',
  TIRED: 'assets/emojis/kangourou/hazoom_emoji_9.svg',
  EXCITED: 'assets/emojis/kangourou/hazoom_emoji_10.svg',
  STUDYING: 'assets/emojis/kangourou/hazoom_emoji_11.svg',
  LOVING: 'assets/emojis/kangourou/hazoom_emoji_12.svg',
  COOL: 'assets/emojis/kangourou/hazoom_emoji_13.svg'
};

// Profile avatars (6 animals)
export const PROFILE_AVATARS = {
  BEAR: {
    path: 'assets/emojis/profiles/bear.svg',
    name: 'Ours',
    personality: 'Doux et protecteur',
    emoji: '🐻'
  },
  CAT: {
    path: 'assets/emojis/profiles/cat.svg',
    name: 'Chat',
    personality: 'Curieux et joueur',
    emoji: '🐱'
  },
  FROG: {
    path: 'assets/emojis/profiles/frog.svg',
    name: 'Grenouille',
    personality: 'Joyeux et énergique',
    emoji: '🐸'
  },
  LION: {
    path: 'assets/emojis/profiles/lion.svg',
    name: 'Lion',
    personality: 'Courageux et leader',
    emoji: '🦁'
  },
  OWL: {
    path: 'assets/emojis/profiles/owl.svg',
    name: 'Hibou',
    personality: 'Sage et studieux',
    emoji: '🦉'
  },
  TIGER: {
    path: 'assets/emojis/profiles/tiger.svg',
    name: 'Tigre',
    personality: 'Aventureux et sportif',
    emoji: '🐯'
  }
};

// Icons mapping (34 functional icons)
export const ICONS = {
  AGENDA: 'assets/icons/png/Icon_Hazoom_00.png',
  NOTIFICATION: 'assets/icons/png/Icon_Hazoom_01.png',
  QUIZ: 'assets/icons/png/Icon_Hazoom_02.png',
  PROGRESS: 'assets/icons/png/Icon_Hazoom_03.png',
  PROFILE: 'assets/icons/png/Icon_Hazoom_04.png',
  SETTINGS: 'assets/icons/png/Icon_Hazoom_05.png',
  FAVORITE: 'assets/icons/png/Icon_Hazoom_06.png',
  HOMEWORK: 'assets/icons/png/Icon_Hazoom_07.png',
  CHAT: 'assets/icons/png/Icon_Hazoom_08.png',
  SEARCH: 'assets/icons/png/Icon_Hazoom_09.png',
  // Add mappings for icons 10-33 as needed
};

// Helper function to get kangourou emoji by emotion
export function getKangourouEmoji(emotion) {
  return KANGOUROU_EMOTIONS[emotion.toUpperCase()] || KANGOUROU_EMOTIONS.WELCOME;
}

// Helper function to get random kangourou emoji
export function getRandomKangourou() {
  const emotions = Object.values(KANGOUROU_EMOTIONS);
  return emotions[Math.floor(Math.random() * emotions.length)];
}

// Helper function to get profile avatar by animal
export function getProfileAvatar(animal) {
  const avatar = PROFILE_AVATARS[animal.toUpperCase()];
  return avatar ? avatar.path : null;
}

// Helper function to list all available avatars
export function getAllAvatars() {
  return Object.entries(PROFILE_AVATARS).map(([key, value]) => ({
    id: key.toLowerCase(),
    ...value
  }));
}
"""
    
    mapping_file = UNIFIED_TARGET / "emoji-mapping.js"
    mapping_file.write_text(mapping_content, encoding='utf-8')
    print(f"   ✅ Created: emoji-mapping.js")
    print(f"   ✓ Mapping file ready!\n")

def create_summary():
    """Create migration summary"""
    print("=" * 70)
    print("📊 MIGRATION SUMMARY")
    print("=" * 70)
    
    # Count files
    kangourou_count = len(list(TARGET_KANGOUROU.glob("*.svg")))
    profiles_count = len(list(TARGET_PROFILES.glob("*.svg")))
    icons_png_count = len(list(TARGET_ICONS_PNG.glob("*.png")))
    icons_svg_count = len(list(TARGET_ICONS_SVG.glob("*.svg")))
    images_count = len(list(TARGET_IMAGES.glob("*.*")))
    
    total = kangourou_count + profiles_count + icons_png_count + icons_svg_count + images_count
    
    print(f"\n✅ Successfully migrated {total} files:")
    print(f"   🦘 Kangourou emojis: {kangourou_count}")
    print(f"   🐻 Profile avatars: {profiles_count}")
    print(f"   🎨 PNG icons: {icons_png_count}")
    print(f"   🎨 SVG icons: {icons_svg_count}")
    print(f"   📸 Main images: {images_count}")
    
    print(f"\n📁 Target location:")
    print(f"   {TARGET_ASSETS}")
    
    print(f"\n📝 Mapping file:")
    print(f"   {UNIFIED_TARGET / 'emoji-mapping.js'}")
    
    print("\n🎉 Migration completed successfully!")
    print("=" * 70)

def main():
    """Main migration function"""
    print("\n" + "=" * 70)
    print("🚀 HAZOOM ASSETS MIGRATION")
    print("=" * 70)
    print(f"Source: {LLM_SOURCE}")
    print(f"Target: {UNIFIED_TARGET}")
    print("=" * 70 + "\n")
    
    try:
        # Verify source exists
        if not LLM_SOURCE.exists():
            print(f"❌ ERROR: LLM source not found at {LLM_SOURCE}")
            return
        
        # Create structure
        create_directories()
        
        # Copy assets
        copy_kangourou_emojis()
        copy_profile_emojis()
        copy_icons_png()
        copy_icons_svg()
        copy_main_images()
        
        # Create mapping
        create_emoji_mapping()
        
        # Summary
        create_summary()
        
    except Exception as e:
        print(f"\n❌ ERROR during migration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
