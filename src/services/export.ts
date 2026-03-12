import pptxgen from "pptxgenjs";
import { Presentation, AppConfig } from "../types";

export async function exportToPPTX(presentation: Presentation, themeId: string = 'modern', config?: AppConfig) {
  let pptx = new pptxgen();
  
  let slideW = 10;
  let slideH = 5.625;
  let margin = 0.5;

  if (config?.pageSize === 'a4') {
    slideW = 11.69; 
    slideH = 8.27; 
    margin = 20 / 25.4; // 20mm in inches
  } else if (config?.pageSize === 'b5') {
    slideW = 9.84; 
    slideH = 6.93; 
    margin = 20 / 25.4; // 20mm in inches
  }

  const isPortrait = config?.orientation === 'portrait';
  if (isPortrait) {
    const temp = slideW; 
    slideW = slideH; 
    slideH = temp;
  }

  pptx.defineLayout({ name: 'CUSTOM_LAYOUT', width: slideW, height: slideH });
  pptx.layout = 'CUSTOM_LAYOUT';

  const themes: Record<string, any> = {
    modern: { bg: 'FFFFFF', title: '312E81', text: '4B5563', accent: '4F46E5', font: 'Arial' },
    dark: { bg: '171717', title: 'F9FAFB', text: 'D1D5DB', accent: '818CF8', font: 'Arial' },
    corporate: { bg: 'FFFFFF', title: '1E3A8A', text: '374151', accent: '2563EB', font: 'Arial' },
    creative: { bg: 'FFF1F2', title: '881337', text: '4C0519', accent: 'E11D48', font: 'Arial' }
  };

  const theme = themes[themeId] || themes.modern;

  const contentW = slideW - margin * 2;
  const contentH = slideH - margin * 2;
  const titleH = 0.8;
  const bodyY = margin + titleH + 0.2;
  const bodyH = slideH - bodyY - margin;

  let halfW = (contentW - 0.4) / 2;
  let halfH = (bodyH - 0.4) / 2;

  // Define Slide Masters for native placeholders and proper layouts
  pptx.defineSlideMaster({
    title: 'TITLE_SLIDE',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: margin, y: slideH * 0.3, w: contentW, h: slideH * 0.2, align: 'center', valign: 'middle', fontSize: 44, color: theme.title, fontFace: theme.font, bold: true } } },
      { placeholder: { options: { name: 'body', type: 'body', x: margin, y: slideH * 0.5, w: contentW, h: slideH * 0.3, align: 'center', valign: 'top', fontSize: 24, color: theme.text, fontFace: theme.font } } }
    ]
  });

  pptx.defineSlideMaster({
    title: 'CONTENT_SLIDE',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: margin, y: margin, w: contentW, h: titleH, valign: 'middle', fontSize: 36, color: theme.title, fontFace: theme.font, bold: true } } },
      { placeholder: { options: { name: 'body', type: 'body', x: margin, y: bodyY, w: contentW, h: bodyH, valign: 'top', fontSize: 20, color: theme.text, fontFace: theme.font } } }
    ]
  });

  pptx.defineSlideMaster({
    title: 'TWO_COLUMN_LEFT_BODY',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: margin, y: margin, w: contentW, h: titleH, valign: 'middle', fontSize: 36, color: theme.title, fontFace: theme.font, bold: true } } },
      { placeholder: { options: { name: 'body', type: 'body', 
        x: margin, 
        y: bodyY, 
        w: isPortrait ? contentW : halfW, 
        h: isPortrait ? halfH : bodyH, 
        valign: 'top', fontSize: 20, color: theme.text, fontFace: theme.font } } }
    ]
  });

  pptx.defineSlideMaster({
    title: 'TWO_COLUMN_RIGHT_BODY',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: margin, y: margin, w: contentW, h: titleH, valign: 'middle', fontSize: 36, color: theme.title, fontFace: theme.font, bold: true } } },
      { placeholder: { options: { name: 'body', type: 'body', 
        x: isPortrait ? margin : margin + halfW + 0.4, 
        y: isPortrait ? bodyY + halfH + 0.4 : bodyY, 
        w: isPortrait ? contentW : halfW, 
        h: isPortrait ? halfH : bodyH, 
        valign: 'top', fontSize: 20, color: theme.text, fontFace: theme.font } } }
    ]
  });

  pptx.defineSlideMaster({
    title: 'TWO_ROW_TOP_BODY',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: margin, y: margin, w: contentW, h: titleH, valign: 'middle', fontSize: 36, color: theme.title, fontFace: theme.font, bold: true } } },
      { placeholder: { options: { name: 'body', type: 'body', 
        x: margin, 
        y: bodyY, 
        w: contentW, 
        h: halfH, 
        valign: 'top', fontSize: 20, color: theme.text, fontFace: theme.font } } }
    ]
  });

  pptx.defineSlideMaster({
    title: 'TWO_ROW_BOTTOM_BODY',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: margin, y: margin, w: contentW, h: titleH, valign: 'middle', fontSize: 36, color: theme.title, fontFace: theme.font, bold: true } } },
      { placeholder: { options: { name: 'body', type: 'body', 
        x: margin, 
        y: bodyY + halfH + 0.4, 
        w: contentW, 
        h: halfH, 
        valign: 'top', fontSize: 20, color: theme.text, fontFace: theme.font } } }
    ]
  });

  pptx.defineSlideMaster({
    title: 'QUOTE_SLIDE',
    background: { color: theme.bg },
    objects: [
      { placeholder: { options: { name: 'body', type: 'body', x: margin, y: margin, w: contentW, h: contentH, align: 'center', valign: 'middle', fontSize: 32, italic: true, color: theme.text, fontFace: 'Georgia' } } }
    ]
  });

  for (const slide of presentation.slides) {
    let masterName = 'CONTENT_SLIDE';
    if (slide.layout === 'title') masterName = 'TITLE_SLIDE';
    if (slide.layout === 'image-right' || slide.layout === 'chart') masterName = 'TWO_COLUMN_LEFT_BODY';
    if (slide.layout === 'image-left') masterName = 'TWO_COLUMN_RIGHT_BODY';
    if (slide.layout === 'image-top') masterName = 'TWO_ROW_BOTTOM_BODY';
    if (slide.layout === 'image-bottom') masterName = 'TWO_ROW_TOP_BODY';
    if (slide.layout === 'quote') masterName = 'QUOTE_SLIDE';

    let slidePpt = pptx.addSlide({ masterName });
    
    let contentArray: string[] = [];
    if (Array.isArray(slide.content)) {
      contentArray = slide.content.map(c => typeof c === 'string' ? c : JSON.stringify(c));
    } else if (typeof slide.content === 'string') {
      contentArray = [slide.content];
    } else if (slide.content) {
      contentArray = [JSON.stringify(slide.content)];
    }
    
    // Add title
    if (slide.layout === 'title') {
      slidePpt.addText(slide.title, { placeholder: 'title' });
      slidePpt.addText(contentArray.map(c => ({ text: c })), { placeholder: 'body' });
    } else {
      if (slide.layout !== 'quote') {
        slidePpt.addText(slide.title, { placeholder: 'title' });
      }

      // Add content based on layout
      if (slide.layout === 'content' || slide.layout === 'markdown') {
        slidePpt.addText(contentArray.map(c => ({ text: c, options: { bullet: true } })), { placeholder: 'body' });
      } else if (slide.layout === 'image-right') {
        let imgX = isPortrait ? margin : margin + halfW + 0.4;
        let imgY = isPortrait ? bodyY + halfH + 0.4 : bodyY;
        let imgW = isPortrait ? contentW : halfW;
        let imgH = isPortrait ? halfH : bodyH;

        slidePpt.addText(contentArray.map(c => ({ text: c, options: { bullet: true } })), { placeholder: 'body' });
        if (slide.imagePlaceholder?.url) {
          slidePpt.addImage({ data: slide.imagePlaceholder.url, x: imgX, y: imgY, w: imgW, h: imgH, sizing: { type: 'contain', w: imgW, h: imgH } });
        } else {
          slidePpt.addShape(pptx.ShapeType.rect, { x: imgX, y: imgY, w: imgW, h: imgH, fill: { color: theme.accent } });
          slidePpt.addText('Image Placeholder', { x: imgX, y: imgY, w: imgW, h: imgH, align: 'center', color: theme.bg });
        }
      } else if (slide.layout === 'image-left') {
        let imgX = margin;
        let imgY = bodyY;
        let imgW = isPortrait ? contentW : halfW;
        let imgH = isPortrait ? halfH : bodyH;

        if (slide.imagePlaceholder?.url) {
          slidePpt.addImage({ data: slide.imagePlaceholder.url, x: imgX, y: imgY, w: imgW, h: imgH, sizing: { type: 'contain', w: imgW, h: imgH } });
        } else {
          slidePpt.addShape(pptx.ShapeType.rect, { x: imgX, y: imgY, w: imgW, h: imgH, fill: { color: theme.accent } });
          slidePpt.addText('Image Placeholder', { x: imgX, y: imgY, w: imgW, h: imgH, align: 'center', color: theme.bg });
        }
        slidePpt.addText(contentArray.map(c => ({ text: c, options: { bullet: true } })), { placeholder: 'body' });
      } else if (slide.layout === 'image-top') {
        let imgX = margin;
        let imgY = bodyY;
        let imgW = contentW;
        let imgH = halfH;

        if (slide.imagePlaceholder?.url) {
          slidePpt.addImage({ data: slide.imagePlaceholder.url, x: imgX, y: imgY, w: imgW, h: imgH, sizing: { type: 'contain', w: imgW, h: imgH } });
        } else {
          slidePpt.addShape(pptx.ShapeType.rect, { x: imgX, y: imgY, w: imgW, h: imgH, fill: { color: theme.accent } });
          slidePpt.addText('Image Placeholder', { x: imgX, y: imgY, w: imgW, h: imgH, align: 'center', color: theme.bg });
        }
        slidePpt.addText(contentArray.map(c => ({ text: c, options: { bullet: true } })), { placeholder: 'body' });
      } else if (slide.layout === 'image-bottom') {
        let imgX = margin;
        let imgY = bodyY + halfH + 0.4;
        let imgW = contentW;
        let imgH = halfH;

        slidePpt.addText(contentArray.map(c => ({ text: c, options: { bullet: true } })), { placeholder: 'body' });
        if (slide.imagePlaceholder?.url) {
          slidePpt.addImage({ data: slide.imagePlaceholder.url, x: imgX, y: imgY, w: imgW, h: imgH, sizing: { type: 'contain', w: imgW, h: imgH } });
        } else {
          slidePpt.addShape(pptx.ShapeType.rect, { x: imgX, y: imgY, w: imgW, h: imgH, fill: { color: theme.accent } });
          slidePpt.addText('Image Placeholder', { x: imgX, y: imgY, w: imgW, h: imgH, align: 'center', color: theme.bg });
        }
      } else if (slide.layout === 'quote') {
        slidePpt.addText(contentArray.join('\n'), { placeholder: 'body' });
      } else if (slide.layout === 'chart') {
        let chartX = isPortrait ? margin : margin + halfW + 0.4;
        let chartY = isPortrait ? bodyY + halfH + 0.4 : bodyY;
        let chartW = isPortrait ? contentW : halfW;
        let chartH = isPortrait ? halfH : bodyH;

        slidePpt.addText(contentArray.map(c => ({ text: c, options: { bullet: true } })), { placeholder: 'body' });
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
            x: chartX, y: chartY, w: chartW, h: chartH,
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
