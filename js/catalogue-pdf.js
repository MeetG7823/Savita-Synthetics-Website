/* ═══════════════════════════════════════════
   SAVITA SYNTHETICS — Catalogue PDF Generator
   ═══════════════════════════════════════════ */

const FABRICS = [
  { name: 'Luxury Jacquard', gsm: '120 GSM', img: 'Images/Luxe JAcq 1.png',
    desc: 'Delicately woven with an embellished dot pattern, this sheer jacquard offers an ethereal drape ideal for bridal overlays, lehengas and couture occasion wear.' },
  { name: 'Lycra Silk',      gsm: '95 GSM',  img: 'Images/Lycra Silk 1.png',
    desc: 'Soft, fluid and richly textured with a natural stretch, this premium lycra-silk blend delivers effortless drape and comfort for ethnic, fusion and resort wear.' },
  { name: 'Nebula Silk',     gsm: '130 GSM', img: 'Images/Nebula silk 1.png',
    desc: 'A bold artistic weave featuring painterly floral motifs on a soft ivory base — crafted for statement home furnishings, luxury drapes and premium fashion applications.' },
  { name: 'I-Silk',          gsm: '125 GSM', img: 'Images/I-silk.jpeg',
    desc: 'A rich, lustrous fabric with a smooth silk-like finish and excellent body — ideal for premium sarees, dress material and high-end ethnic occasion wear.' },
  { name: 'Pocket Lycra',    gsm: '105 GSM', img: 'Images/Pocket lycra.jpeg',
    desc: 'A structured yet flexible lycra weave with a fine texture and excellent recovery — widely used for trousers, formal bottoms and stretch suiting fabric.' },
  { name: 'Sindoor',         gsm: '85 GSM',  img: 'Images/sindoor.png',
    desc: 'A vibrant, richly pigmented fabric with a smooth drape and bold colour depth — crafted for festive ethnic wear, sarees and statement occasion pieces.' }
];

const GOLD  = [184, 146, 42];
const BLACK = [13,  13,  13];
const WHITE = [242, 242, 240];
const MUTED = [153, 153, 153];
const DARK  = [26,  26,  26];
const PW = 210, PH = 297, M = 18;

// ── Load image via fetch (works on file://) with 8s timeout ──
function loadImg(src) {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(null), 8000);

    fetch(src)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataURL = reader.result;
          const img = new Image();
          img.onload = () => {
            clearTimeout(timer);
            const c = document.createElement('canvas');
            c.width  = img.naturalWidth  || 800;
            c.height = img.naturalHeight || 600;
            c.getContext('2d').drawImage(img, 0, 0);
            const fmt = src.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
            resolve({ dataURL: c.toDataURL('image/jpeg', 0.92), w: c.width, h: c.height, fmt });
          };
          img.onerror = () => { clearTimeout(timer); resolve(null); };
          img.src = dataURL;
        };
        reader.onerror = () => { clearTimeout(timer); resolve(null); };
        reader.readAsDataURL(blob);
      })
      .catch(() => { clearTimeout(timer); resolve(null); });
  });
}

// ── Fit image inside box keeping aspect ratio, return {x,y,w,h} ──
function fitImg(iw, ih, maxW, maxH, ox, oy) {
  let w = maxW, h = (ih / iw) * maxW;
  if (h > maxH) { h = maxH; w = (iw / ih) * maxH; }
  return { x: ox + (maxW - w) / 2, y: oy + (maxH - h) / 2, w, h };
}

async function generateCatalogue() {
  const btn = document.getElementById('download-catalogue-btn');
  btn.textContent = '⏳ Generating PDF...';
  btn.disabled = true;

  try {
    // Pre-load all images
    const [logoImg, ...fabricImgs] = await Promise.all([
      loadImg('Images/logo.jpeg'),
      ...FABRICS.map(f => loadImg(f.img))
    ]);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const fill  = (x, y, w, h, r, g, b) => { doc.setFillColor(r,g,b); doc.rect(x,y,w,h,'F'); };
    const gLine = (y, x1=M, x2=PW-M)   => { doc.setDrawColor(...GOLD); doc.setLineWidth(0.4); doc.line(x1,y,x2,y); };
    const hdr   = () => {
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...GOLD);
      doc.text('SAVITA SYNTHETICS', M, 14, { charSpace: 0.8 });
      doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED);
      doc.text('FABRIC CATALOGUE', PW-M, 14, { align:'right', charSpace:0.8 });
      gLine(18);
    };

    // ── PAGE 1: COVER ──────────────────────────
    fill(0, 0, PW, PH, ...BLACK);
    fill(0, 0,      PW, 6, ...GOLD);
    fill(0, PH - 6, PW, 6, ...GOLD);

    // Logo
    let logoBottomY = 44;
    if (logoImg) {
      const f = fitImg(logoImg.w, logoImg.h, 68, 68, (PW-68)/2, 28);
      doc.addImage(logoImg.dataURL, 'JPEG', f.x, f.y, f.w, f.h);
      logoBottomY = f.y + f.h + 8;
    }

    // Brand name
    doc.setFont('helvetica','bold'); doc.setFontSize(30); doc.setTextColor(...WHITE);
    doc.text('SAVITA', PW/2, logoBottomY + 10, { align:'center' });
    doc.setTextColor(...GOLD);
    doc.text('SYNTHETICS', PW/2, logoBottomY + 22, { align:'center' });

    // Underline
    const ulY = logoBottomY + 27;
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.7);
    doc.line(PW/2 - 28, ulY, PW/2 + 28, ulY);

    // Subtitle
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...MUTED);
    doc.text('F A B R I C   C A T A L O G U E', PW/2, ulY + 12, { align:'center' });

    // Dot row
    const dotY = ulY + 22;
    [-12,-6,0,6,12].forEach(dx => {
      doc.setFillColor(...GOLD);
      doc.circle(PW/2 + dx, dotY, dx===0 ? 1.2 : 0.7, 'F');
    });

    doc.setFontSize(9.5); doc.setTextColor(...MUTED);
    doc.text('Weaving Quality Into Every Thread', PW/2, dotY + 11, { align:'center' });

    // Location badge
    const bY = dotY + 22;
    fill((PW-82)/2, bY-5, 82, 10, ...DARK);
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.3);
    doc.rect((PW-82)/2, bY-5, 82, 10);
    doc.setFontSize(8); doc.setTextColor(...GOLD);
    doc.text('SURAT, GUJARAT, INDIA', PW/2, bY+1.5, { align:'center', charSpace:1 });

    // Fabric list preview
    const listY = bY + 18;
    gLine(listY - 3);
    doc.setFontSize(7.5);
    FABRICS.forEach((f, i) => {
      const col = i < 3 ? 0 : 1;
      const row = i % 3;
      const lx  = col === 0 ? PW/2 - 72 : PW/2 + 4;
      const ly  = listY + row * 9;
      doc.setFont('helvetica','bold'); doc.setTextColor(...GOLD);
      doc.text(`${String(i+1).padStart(2,'0')}.`, lx, ly);
      doc.setFont('helvetica','normal'); doc.setTextColor(...WHITE);
      doc.text(f.name, lx + 8, ly);
      doc.setTextColor(...MUTED);
      doc.text(f.gsm, lx + 8 + doc.getTextWidth(f.name) + 2, ly);
    });
    gLine(listY + 28);

    // Bottom bar
    fill(0, PH-20, PW, 14, ...DARK);
    doc.setFontSize(7.5); doc.setFont('helvetica','normal');
    doc.setTextColor(...MUTED);
    doc.text('savitasynthetics@gmail.com', M+4, PH-11);
    doc.setTextColor(...GOLD);
    doc.text('+91 95866 07148', PW/2, PH-11, { align:'center' });
    doc.setTextColor(...MUTED);
    doc.text('Jayraj Textile Park, Mangrol, Surat', PW-M-4, PH-11, { align:'right' });

    // ── PAGE 2: CONTENTS ───────────────────────
    doc.addPage();
    fill(0, 0, PW, PH, ...BLACK);
    fill(0, 0, PW, 6, ...GOLD); fill(0, PH-6, PW, 6, ...GOLD);
    hdr();

    doc.setFont('helvetica','bold'); doc.setFontSize(24); doc.setTextColor(...WHITE);
    doc.text('Contents', M, 38);
    gLine(43, M, M+40);

    let cy = 58;
    FABRICS.forEach((fabric, i) => {
      fill(M-3, cy-7, PW-(M*2)+6, 16, i%2===0 ? 22 : 18, i%2===0 ? 22 : 18, i%2===0 ? 22 : 18);
      fill(M-3, cy-7, 14, 16, ...GOLD);
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...BLACK);
      doc.text(String(i+1).padStart(2,'0'), M+4, cy+2, { align:'center' });
      doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...WHITE);
      doc.text(fabric.name, M+16, cy+2);
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...GOLD);
      doc.text(fabric.gsm, PW-M-3, cy+2, { align:'right' });
      doc.setFillColor(...MUTED);
      const x0 = M+16+doc.getTextWidth(fabric.name)+4;
      const x1 = PW-M-3-doc.getTextWidth(fabric.gsm)-4;
      for (let dx=x0; dx<x1; dx+=3.5) doc.circle(dx, cy+0.5, 0.25, 'F');
      cy += 20;
    });

    gLine(cy+2);
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED);
    doc.text(`${FABRICS.length} Premium Fabrics  ·  Waterjet Loom Manufactured  ·  Surat, Gujarat`, PW/2, cy+10, { align:'center' });

    // ── PAGES 3+: ONE PER FABRIC ───────────────
    for (let i = 0; i < FABRICS.length; i++) {
      const fabric  = FABRICS[i];
      const imgData = fabricImgs[i];

      doc.addPage();
      fill(0, 0, PW, PH, ...BLACK);
      fill(0, 0, PW, 6, ...GOLD); fill(0, PH-6, PW, 6, ...GOLD);
      hdr();

      // Badge + name
      fill(M, 24, 13, 13, ...GOLD);
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...BLACK);
      doc.text(String(i+1).padStart(2,'0'), M+6.5, 32, { align:'center' });
      doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(...WHITE);
      doc.text(fabric.name, M+18, 33);

      // GSM pill
      const gx = M+18+doc.getTextWidth(fabric.name)+5;
      const gw = doc.getTextWidth(fabric.gsm)+8;
      fill(gx, 25, gw, 9, ...DARK);
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.3); doc.rect(gx, 25, gw, 9);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...GOLD);
      doc.text(fabric.gsm, gx+4, 31);

      gLine(40);

      // Image
      const imgY = 43, imgH = 148, imgW = PW-(M*2);
      if (imgData) {
        const f = fitImg(imgData.w, imgData.h, imgW, imgH, M, imgY);
        doc.setDrawColor(...GOLD); doc.setLineWidth(0.5);
        doc.rect(f.x-1, f.y-1, f.w+2, f.h+2);
        doc.addImage(imgData.dataURL, 'JPEG', f.x, f.y, f.w, f.h);
      } else {
        fill(M, imgY, imgW, imgH, ...DARK);
        doc.setFontSize(9); doc.setTextColor(...MUTED);
        doc.text('Image unavailable', PW/2, imgY+imgH/2, { align:'center' });
      }

      const dY = imgY + imgH + 8;
      gLine(dY, M, M+30);
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...GOLD);
      doc.text('DESCRIPTION', M, dY+7, { charSpace:1.2 });
      doc.setFont('helvetica','normal'); doc.setFontSize(10.5); doc.setTextColor(...WHITE);
      const lines = doc.splitTextToSize(fabric.desc, PW-(M*2));
      doc.text(lines, M, dY+16);

      // Specs bar
      const sY = dY+16+lines.length*5.5+8;
      fill(M, sY, PW-(M*2), 24, ...DARK);
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.3); doc.rect(M, sY, PW-(M*2), 24);
      const third = (PW-(M*2))/3;
      doc.setDrawColor(42,42,42); doc.setLineWidth(0.3);
      doc.line(M+third, sY, M+third, sY+24);
      doc.line(M+third*2, sY, M+third*2, sY+24);

      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
      doc.text('WEIGHT',       M+8,    sY+8, { charSpace:0.8 });
      doc.text('MANUFACTURER', PW/2,   sY+8, { align:'center', charSpace:0.8 });
      doc.text('ENQUIRY',      PW-M-8, sY+8, { align:'right', charSpace:0.8 });

      doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...GOLD);
      doc.text(fabric.gsm, M+8, sY+18);
      doc.setFontSize(9); doc.setTextColor(...WHITE);
      doc.text('SAVITA SYNTHETICS', PW/2, sY+18, { align:'center' });
      doc.setFontSize(8.5); doc.setTextColor(...GOLD);
      doc.text('+91 95866 07148', PW-M-8, sY+18, { align:'right' });

      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text(String(i+3), PW/2, PH-10, { align:'center' });
    }

    doc.save('SAVITA-SYNTHETICS-Catalogue.pdf');
    btn.textContent = '✓ Downloaded!';
    btn.style.borderColor = '#2a6e2a';
    btn.style.color = '#2a6e2a';

  } catch (err) {
    console.error('PDF generation failed:', err);
    btn.textContent = '✗ Failed — try again';
    btn.style.borderColor = '#8b0000';
    btn.style.color = '#ff6b6b';
  }

  setTimeout(() => {
    btn.textContent = '📄 Download Full Catalogue';
    btn.style.borderColor = '';
    btn.style.color = '';
    btn.disabled = false;
  }, 3000);
}

document.getElementById('download-catalogue-btn').addEventListener('click', generateCatalogue);
