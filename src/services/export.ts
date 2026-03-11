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
      slidePpt.addText(slide.title, { placeholder: 'title', align: 'center' });
      slidePpt.addText(slide.content.map(c => ({ text: c })), { placeholder: 'body', align: 'center' });
    } else {
      slidePpt.addText(slide.title, { placeholder: 'title' });

      // Add content based on layout
      if (slide.layout === 'content') {
        slidePpt.addText(slide.content.map(c => ({ text: c, options: { bullet: true } })), { placeholder: 'body' });
      } else if (slide.layout === 'image-right') {
        slidePpt.addText(slide.content.map(c => ({ text: c, options: { bullet: true } })), { 
          placeholder: 'body', w: '45%' 
        });
        if (slide.imagePlaceholder?.url) {
          slidePpt.addImage({ data: slide.imagePlaceholder.url, x: '50%', y: '20%', w: '45%', h: '60%', sizing: { type: 'contain', w: '45%', h: '60%' } });
        } else {
          slidePpt.addShape(pptx.ShapeType.rect, { x: '50%', y: '20%', w: '45%', h: '60%', fill: { color: theme.accent } });
          slidePpt.addText('Image Placeholder', { x: '50%', y: '20%', w: '45%', h: '60%', align: 'center', color: theme.bg });
        }
      } else if (slide.layout === 'image-left') {
        if (slide.imagePlaceholder?.url) {
          slidePpt.addImage({ data: slide.imagePlaceholder.url, x: '5%', y: '20%', w: '45%', h: '60%', sizing: { type: 'contain', w: '45%', h: '60%' } });
        } else {
          slidePpt.addShape(pptx.ShapeType.rect, { x: '5%', y: '20%', w: '45%', h: '60%', fill: { color: theme.accent } });
          slidePpt.addText('Image Placeholder', { x: '5%', y: '20%', w: '45%', h: '60%', align: 'center', color: theme.bg });
        }
        slidePpt.addText(slide.content.map(c => ({ text: c, options: { bullet: true } })), { 
          placeholder: 'body', x: '50%', w: '45%' 
        });
      } else if (slide.layout === 'quote') {
        slidePpt.addText(slide.content.join('\n'), { 
          placeholder: 'body', align: 'center', italic: true 
        });
      } else if (slide.layout === 'chart') {
        slidePpt.addText(slide.content.map(c => ({ text: c, options: { bullet: true } })), { 
          placeholder: 'body', w: '45%' 
        });
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
            x: '50%', y: '20%', w: '45%', h: '60%',
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
