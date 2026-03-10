import pptxgen from "pptxgenjs";
import { Presentation } from "../types";

export async function exportToPPTX(presentation: Presentation) {
  let pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  for (const slide of presentation.slides) {
    let slidePpt = pptx.addSlide();
    
    // Add title
    slidePpt.addText(slide.title, { 
      x: 0.5, y: 0.5, w: '90%', h: 1, 
      fontSize: 32, bold: true, color: '363636', fontFace: 'Arial' 
    });

    // Add content based on layout
    if (slide.layout === 'title') {
      // Title is already added, maybe center it more
    } else if (slide.layout === 'content') {
      slidePpt.addText(slide.content.map(c => ({ text: c })), { 
        x: 0.5, y: 1.8, w: '90%', h: 5, 
        fontSize: 18, bullet: true, color: '666666', fontFace: 'Arial' 
      });
    } else if (slide.layout === 'image-right') {
      slidePpt.addText(slide.content.map(c => ({ text: c })), { 
        x: 0.5, y: 1.8, w: '45%', h: 5, 
        fontSize: 18, bullet: true, color: '666666', fontFace: 'Arial' 
      });
      if (slide.imagePlaceholder?.url) {
        slidePpt.addImage({ data: slide.imagePlaceholder.url, x: 5.5, y: 1.8, w: 4, h: 4, sizing: { type: 'contain', w: 4, h: 4 } });
      } else {
        slidePpt.addShape(pptx.ShapeType.rect, { x: 5.5, y: 1.8, w: 4, h: 4, fill: { color: 'E0E0E0' } });
        slidePpt.addText('Image Placeholder', { x: 5.5, y: 1.8, w: 4, h: 4, align: 'center', color: '999999' });
      }
    } else if (slide.layout === 'image-left') {
      if (slide.imagePlaceholder?.url) {
        slidePpt.addImage({ data: slide.imagePlaceholder.url, x: 0.5, y: 1.8, w: 4, h: 4, sizing: { type: 'contain', w: 4, h: 4 } });
      } else {
        slidePpt.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.8, w: 4, h: 4, fill: { color: 'E0E0E0' } });
        slidePpt.addText('Image Placeholder', { x: 0.5, y: 1.8, w: 4, h: 4, align: 'center', color: '999999' });
      }
      slidePpt.addText(slide.content.map(c => ({ text: c })), { 
        x: 5.0, y: 1.8, w: '45%', h: 5, 
        fontSize: 18, bullet: true, color: '666666', fontFace: 'Arial' 
      });
    } else if (slide.layout === 'quote') {
      slidePpt.addText(slide.content.join('\n'), { 
        x: 1.5, y: 2.5, w: '70%', h: 3, 
        fontSize: 24, italic: true, color: '555555', align: 'center', fontFace: 'Georgia' 
      });
    }

    // Add speaker notes
    if (slide.speakerNotes) {
      slidePpt.addNotes(slide.speakerNotes);
    }
  }

  await pptx.writeFile({ fileName: `${presentation.title || 'Presentation'}.pptx` });
}
