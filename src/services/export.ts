import pptxgen from "pptxgenjs";
import { Presentation } from "../types";

export async function exportToPPTX(presentation: Presentation, themeId: string = 'modern') {
  let pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  const themes: Record<string, any> = {
    modern: { bg: 'FFFFFF', title: '312E81', text: '4B5563', accent: '4F46E5', font: 'Arial' },
    dark: { bg: '171717', title: 'F9FAFB', text: 'D1D5DB', accent: '818CF8', font: 'Arial' },
    corporate: { bg: 'FFFFFF', title: '1E3A8A', text: '374151', accent: '2563EB', font: 'Arial' },
    creative: { bg: 'FFF1F2', title: '881337', text: '4C0519', accent: 'E11D48', font: 'Arial' }
  };

  const theme = themes[themeId] || themes.modern;

  for (const slide of presentation.slides) {
    let slidePpt = pptx.addSlide();
    slidePpt.background = { color: theme.bg };
    
    // Add title
    if (slide.layout === 'title') {
      slidePpt.addText(slide.title, { 
        x: 0.5, y: 2.0, w: '90%', h: 1.5, 
        fontSize: 48, bold: true, color: theme.title, fontFace: theme.font, align: 'center'
      });
      slidePpt.addText(slide.content.map(c => ({ text: c })), { 
        x: 0.5, y: 3.5, w: '90%', h: 2, 
        fontSize: 24, color: theme.text, fontFace: theme.font, align: 'center'
      });
    } else {
      slidePpt.addText(slide.title, { 
        x: 0.5, y: 0.5, w: '90%', h: 1, 
        fontSize: 32, bold: true, color: theme.title, fontFace: theme.font 
      });

      // Add content based on layout
      if (slide.layout === 'content') {
        slidePpt.addText(slide.content.map(c => ({ text: c })), { 
          x: 0.5, y: 1.8, w: '90%', h: 5, 
          fontSize: 18, bullet: true, color: theme.text, fontFace: theme.font 
        });
      } else if (slide.layout === 'image-right') {
        slidePpt.addText(slide.content.map(c => ({ text: c })), { 
          x: 0.5, y: 1.8, w: '45%', h: 5, 
          fontSize: 18, bullet: true, color: theme.text, fontFace: theme.font 
        });
        if (slide.imagePlaceholder?.url) {
          slidePpt.addImage({ data: slide.imagePlaceholder.url, x: 5.5, y: 1.8, w: 4, h: 4, sizing: { type: 'contain', w: 4, h: 4 } });
        } else {
          slidePpt.addShape(pptx.ShapeType.rect, { x: 5.5, y: 1.8, w: 4, h: 4, fill: { color: theme.accent } });
          slidePpt.addText('Image Placeholder', { x: 5.5, y: 1.8, w: 4, h: 4, align: 'center', color: theme.bg });
        }
      } else if (slide.layout === 'image-left') {
        if (slide.imagePlaceholder?.url) {
          slidePpt.addImage({ data: slide.imagePlaceholder.url, x: 0.5, y: 1.8, w: 4, h: 4, sizing: { type: 'contain', w: 4, h: 4 } });
        } else {
          slidePpt.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.8, w: 4, h: 4, fill: { color: theme.accent } });
          slidePpt.addText('Image Placeholder', { x: 0.5, y: 1.8, w: 4, h: 4, align: 'center', color: theme.bg });
        }
        slidePpt.addText(slide.content.map(c => ({ text: c })), { 
          x: 5.0, y: 1.8, w: '45%', h: 5, 
          fontSize: 18, bullet: true, color: theme.text, fontFace: theme.font 
        });
      } else if (slide.layout === 'quote') {
        slidePpt.addText(slide.content.join('\n'), { 
          x: 1.5, y: 2.5, w: '70%', h: 3, 
          fontSize: 24, italic: true, color: theme.text, align: 'center', fontFace: 'Georgia' 
        });
      } else if (slide.layout === 'chart') {
        slidePpt.addText(slide.content.map(c => ({ text: c })), { 
          x: 0.5, y: 1.8, w: '45%', h: 5, 
          fontSize: 18, bullet: true, color: theme.text, fontFace: theme.font 
        });
        if (slide.chartData && slide.chartData.length > 0) {
          const chartData = [
            {
              name: 'Data',
              labels: slide.chartData.map(d => d.name),
              values: slide.chartData.map(d => d.value)
            }
          ];
          slidePpt.addChart(pptx.ChartType.bar, chartData, {
            x: 5.5, y: 1.8, w: 4, h: 4,
            barDir: 'col',
            chartColors: [theme.accent],
            showLegend: false,
            showTitle: false,
            valAxisLabelColor: theme.text,
            catAxisLabelColor: theme.text
          });
        }
      }
    }

    // Add speaker notes
    if (slide.speakerNotes) {
      slidePpt.addNotes(slide.speakerNotes);
    }
  }

  await pptx.writeFile({ fileName: `${presentation.title || 'Presentation'}.pptx` });
}
