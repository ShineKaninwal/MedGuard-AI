// Downscale uploads so they fit in LocalStorage.
export const fileToSmallDataUrl = (file, max = 900) => new Promise((res, rej) => {
  const r = new FileReader(); r.onerror = rej;
  r.onload = () => {
    const img = new Image(); img.onerror = rej;
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.6));
    };
    img.src = r.result;
  };
  r.readAsDataURL(file);
});

// A made-up prescription picture for demos, drawn in the browser. It is clearly watermarked as fictional and contains no real person or clinic.
export function makeSamplePrescriptionImage() {
  const c = document.createElement('canvas'); c.width = 600; c.height = 780;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 600, 780);
  g.strokeStyle = '#0B1F3A'; g.lineWidth = 3; g.strokeRect(14, 14, 572, 752);
  g.fillStyle = '#0B1F3A'; g.font = 'bold 26px sans-serif'; g.fillText('SAMPLE CLINIC (fictional)', 40, 70);
  g.font = '18px sans-serif'; g.fillText('Dr. R. Sharma, General Physician', 40, 100);
  g.fillText('Patient: Sample Patient        Date: today', 40, 150);
  g.font = 'bold 40px serif'; g.fillText('Rx', 40, 220);
  g.font = '22px sans-serif';
  ['1. Amoxicillin 250 mg', '    1 capsule three times daily for 5 days', '2. Cetirizine 10 mg', '    1 tablet at night'].forEach((t, i) => g.fillText(t, 70, 270 + i * 44));
  g.save(); g.translate(300, 560); g.rotate(-0.35); g.fillStyle = 'rgba(220,38,38,0.22)'; g.font = 'bold 64px sans-serif'; g.textAlign = 'center';
  g.fillText('SAMPLE', 0, 0); g.fillText('NOT REAL', 0, 70); g.restore();
  return c.toDataURL('image/jpeg', 0.7);
}
