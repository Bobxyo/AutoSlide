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

  // Define Slide Masters for native placeholders and proper layouts
  pptx.defineSlideMaster({
    title: 'TITLE_SLIDE',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 1.8, w: 9.0, h: 1.0, align: 'center', valign: 'middle', fontSize: 44, color: theme.title, fontFace: theme.font, bold: true } } },
      { placeholder: { options: { name: 'body', type: 'body', x: 0.5, y: 3.0, w: 9.0, h: 1.0, align: 'center', valign: 'top', fontSize: 24, color: theme.text, fontFace: theme.font } } }
    ]
  });

  pptx.defineSlideMaster({
    title: 'CONTENT_SLIDE',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 9.0, h: 0.8, valign: 'middle', fontSize: 36, color: theme.title, fontFace: theme.font, bold: true } } },
      { placeholder: { options: { name: 'body', type: 'body', x: 0.5, y: 1.3, w: 9.0, h: 4.0, valign: 'top', fontSize: 20, color: theme.text, fontFace: theme.font } } }
    ]
  });

  pptx.defineSlideMaster({
    title: 'TWO_COLUMN_LEFT_BODY',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 9.0, h: 0.8, valign: 'middle', fontSize: 36, color: theme.title, fontFace: theme.font, bold: true } } },
      { placeholder: { options: { name: 'body', type: 'body', x: 0.5, y: 1.3, w: 4.2, h: 4.0, valign: 'top', fontSize: 20, color: theme.text, fontFace: theme.font } } }
    ]
  });

  pptx.defineSlideMaster({
    title: 'TWO_COLUMN_RIGHT_BODY',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 9.0, h: 0.8, valign: 'middle', fontSize: 36, color: theme.title, fontFace: theme.font, bold: true } } },
      { placeholder: { options: { name: 'body', type: 'body', x: 5.3, y: 1.3, w: 4.2, h: 4.0, valign: 'top', fontSize: 20, color: theme.text, fontFace: theme.font } } }
    ]
  });

  pptx.defineSlideMaster({
    title: 'QUOTE_SLIDE',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'body', type: 'body', x: 1.0, y: 1.3, w: 8.0, h: 3.0, align: 'center', valign: 'middle', fontSize: 32, italic: true, color: theme.text, fontFace: 'Georgia' } } }
    ]
  });

  for (const slide of presentation.slides) {
    let masterName = 'CONTENT_SLIDE';
    if (slide.layout === 'title') masterName = 'TITLE_SLIDE';
    if (slide.layout === 'image-right' || slide.layout === 'chart') masterName = 'TWO_COLUMN_LEFT_BODY';
    if (slide.layout === 'image-left') masterName = 'TWO_COLUMN_RIGHT_BODY';
    if (slide.layout === 'quote') masterName = 'QUOTE_SLIDE';

    let slidePpt = pptx.addSlide({ masterName });
    
    // Add title
    if (slide.layout === 'title') {
      slidePpt.addText(slide.title, { placeholder: 'title' });
      slidePpt.addText(slide.content.map(c => ({ text: c })), { placeholder: 'body' });
    } else {
      if (slide.layout !== 'quote') {
        slidePpt.addText(slide.title, { placeholder: 'title' });
      }

      // Add content based on layout
      if (slide.layout === 'content') {
        slidePpt.addText(slide.content.map(c => ({ text: c, options: { bullet: true } })), { placeholder: 'body' });
      } else if (slide.layout === 'image-right') {
        slidePpt.addText(slide.content.map(c => ({ text: c, options: { bullet: true } })), { placeholder: 'body' });
        if (slide.imagePlaceholder?.url) {
          slidePpt.addImage({ data: slide.imagePlaceholder.url, x: 5.3, y: 1.3, w: 4.2, h: 4.0, sizing: { type: 'contain', w: 4.2, h: 4.0 } });
        } else {
          slidePpt.addShape(pptx.ShapeType.rect, { x: 5.3, y: 1.3, w: 4.2, h: 4.0, fill: { color: theme.accent } });
          slidePpt.addText('Image Placeholder', { x: 5.3, y: 1.3, w: 4.2, h: 4.0, align: 'center', color: theme.bg });
        }
      } else if (slide.layout === 'image-left') {
        if (slide.imagePlaceholder?.url) {
          slidePpt.addImage({ data: slide.imagePlaceholder.url, x: 0.5, y: 1.3, w: 4.2, h: 4.0, sizing: { type: 'contain', w: 4.2, h: 4.0 } });
        } else {
          slidePpt.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.3, w: 4.2, h: 4.0, fill: { color: theme.accent } });
          slidePpt.addText('Image Placeholder', { x: 0.5, y: 1.3, w: 4.2, h: 4.0, align: 'center', color: theme.bg });
        }
        slidePpt.addText(slide.content.map(c => ({ text: c, options: { bullet: true } })), { placeholder: 'body' });
      } else if (slide.layout === 'quote') {
        slidePpt.addText(slide.content.join('\n'), { placeholder: 'body' });
      } else if (slide.layout === 'chart') {
        slidePpt.addText(slide.content.map(c => ({ text: c, options: { bullet: true } })), { placeholder: 'body' });
        if (slide.chartData && slide.chartData.length > 0) {
          const chartData = [
            {
              name: 'Data',
              labels: slide.chartData.map(d => d.name),
              values: slide.chartData.map(d => d.value)
            }
          ];
          
          let pptxChartType = pptx.ChartType.bar;
          if (slide.chartType === 'line') pptxChartType = pptx.ChartType.line;
          if (slide.chartType === 'pie') pptxChartType = pptx.ChartType.pie;
          if (slide.chartType === 'radar') pptxChartType = pptx.ChartType.radar;
          if (slide.chartType === 'area') pptxChartType = pptx.ChartType.area;

          slidePpt.addChart(pptxChartType, chartData, {
            x: 5.3, y: 1.3, w: 4.2, h: 4.0,
            barDir: 'col',
            chartColors: [theme.accent, '818CF8', 'C7D2FE', 'E0E7FF', '312E81', '4338CA'],
            showLegend: slide.chartType === 'pie',
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
