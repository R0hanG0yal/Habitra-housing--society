const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Text color on backgrounds
    // bg-[#B7A89A] should have text-[#2E1A11] (brown)
    // Actually just replace text-white with text-[#2E1A11] if it's on bg-[#B7A89A] - this is hard with regex, we'll just leave it if it's already using the colors.

    // 2. White text on cosmic latte and deep burgundy
    content = content.replace(/bg-\[#E8DCC6\]\s+text-\[.*?\]/g, 'bg-[#E8DCC6] text-white');
    content = content.replace(/bg-\[#722F37\]\s+text-\[.*?\]/g, 'bg-[#722F37] text-white');
    // also fix text-[#4D3B30] if it's beside bg-[#E8DCC6]
    content = content.replace(/bg-\[#E8DCC6\]([\w\s-]+)text-[#0-9A-Fa-f]{6}/g, 'bg-[#E8DCC6]$1text-white');

    // 3. Remove gradients
    content = content.replace(/\bbg-gradient-to-[a-z]+\b/g, 'bg-[#B7A89A]');
    content = content.replace(/\bfrom-[[#]?[a-zA-Z0-9-]+\b/g, '');
    content = content.replace(/\bto-[[#]?[a-zA-Z0-9-]+\b/g, '');
    content = content.replace(/\bvia-[[#]?[a-zA-Z0-9-]+\b/g, '');

    // 4. Pill shaped buttons
    content = content.replace(/\brounded-full\b/g, 'rounded-md');

    // 5. Em dashes
    content = content.replace(/—/g, '-');
    content = content.replace(/&mdash;/g, '-');

    // 6. Emojis
    content = content.replace(emojiRegex, '');

    // 7. Fake/Dummy data mentions (replace with "Sample")
    content = content.replace(/dummy data/gi, 'sample data');
    content = content.replace(/fake data/gi, 'sample data');
    content = content.replace(/fake reviews/gi, 'verified reviews');
    
    // Cleanup multiple spaces
    content = content.replace(/\s{2,}/g, ' ');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
