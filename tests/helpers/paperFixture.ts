export function createTestPdf(title='Measuring Water Retention in Soil') {
  const lines = [
    title, 'Abstract',
    'This study compares water retention in sandy soil and clay soil using controlled laboratory measurements.',
    'We measured retained water after drainage across twelve soil samples under identical temperature conditions.',
    '1 Introduction', 'Soil composition affects water availability for plants. We compare two soil classes to isolate this effect.',
    '2 Methods', 'Six sandy samples and six clay samples received equal volumes of water. Retention was measured after one hour.',
    '3 Results', 'Clay retained more water than sand in this laboratory experiment. These findings apply only to tested samples.',
    'Figure 1: Retained water by soil class.', 'retention = water added - water drained (1)',
    '4 Limitations', 'The small sample size and controlled setting limit generalization to field conditions.',
    'References', '[1] Example Soil Study. Laboratory methods for measuring water retention. 2020.'
  ];
  const content = `BT /F1 12 Tf 50 750 Td 18 TL ${lines.map((line,i)=>`${i?'T* ':''}(${line.replace(/[()\\]/g,'\\$&')}) Tj`).join('\n')} ET`;
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1200 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`];
  let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=Buffer.byteLength(pdf);
  pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
