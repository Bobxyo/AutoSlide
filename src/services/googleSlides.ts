import { Presentation, Slide } from '../types';

export async function exportToGoogleSlides(presentation: Presentation, accessToken: string) {
  // 1. Create a new presentation
  const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: presentation.title || 'Generated Presentation',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create Google Slides presentation');
  }

  const createData = await createRes.json();
  const presentationId = createData.presentationId;

  // 2. Prepare requests to add slides and content
  const requests: any[] = [];
  let objectIdCounter = 1;

  const genId = () => `obj_${objectIdCounter++}`;

  // First slide is already created by default, but let's just create new ones and delete the first one later if we want,
  // or just use the first one for the title. For simplicity, we'll append new slides.

  for (let i = 0; i < presentation.slides.length; i++) {
    const slide = presentation.slides[i];
    const slideObjectId = `slide_${i}`;
    const titleId = `title_${i}`;
    const bodyId = `body_${i}`;
    
    let layout = 'TITLE_AND_BODY';
    if (slide.layout === 'title') layout = 'TITLE';
    if (slide.layout === 'image-right' || slide.layout === 'image-left' || slide.layout === 'chart') layout = 'TITLE_AND_TWO_COLUMNS';
    
    // Create slide with placeholder mappings
    requests.push({
      createSlide: {
        objectId: slideObjectId,
        slideLayoutReference: {
          predefinedLayout: layout
        },
        placeholderIdMappings: [
          {
            layoutPlaceholder: { type: 'TITLE', index: 0 },
            objectId: titleId
          },
          {
            layoutPlaceholder: { type: slide.layout === 'title' ? 'SUBTITLE' : 'BODY', index: 0 },
            objectId: bodyId
          }
        ]
      }
    });

    // Add Title
    if (slide.title) {
      requests.push({
        insertText: {
          objectId: titleId,
          text: slide.title,
        }
      });
    }

    // Add Content
    const contentArray = Array.isArray(slide.content) ? slide.content : (typeof slide.content === 'string' ? [slide.content] : []);
    if (contentArray.length > 0) {
      const contentText = contentArray.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join('\n');
      
      requests.push({
        insertText: {
          objectId: bodyId,
          text: contentText,
        }
      });
      
      // Apply bullets if it's not a title slide or quote
      if (slide.layout !== 'title' && slide.layout !== 'quote') {
        requests.push({
          createParagraphBullets: {
            objectId: bodyId,
            textRange: { type: 'ALL' },
            bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
          }
        });
      }
    }

    // Add Image Placeholder Shape
    if (slide.layout === 'image-right' || slide.layout === 'image-left') {
      const imageId = genId();
      const imageX = slide.layout === 'image-right' ? 400 : 50;
      
      requests.push({
        createShape: {
          objectId: imageId,
          shapeType: 'RECTANGLE',
          elementProperties: {
            pageObjectId: slideObjectId,
            size: { width: { magnitude: 250, unit: 'PT' }, height: { magnitude: 250, unit: 'PT' } },
            transform: { scaleX: 1, scaleY: 1, translateX: imageX, translateY: 120, unit: 'PT' }
          }
        }
      });
      requests.push({
        insertText: {
          objectId: imageId,
          text: 'Image Placeholder\n(Replace in Google Slides)',
        }
      });
    }
    
    // Add Speaker Notes
    if (slide.speakerNotes) {
      // Note: Adding speaker notes via batchUpdate requires knowing the notes page object ID,
      // which is complex without a read request first. We will skip speaker notes for Google Slides
      // in this simple implementation, or we can add it as a shape off-screen.
      // For now, we skip to keep the batch update simple and reliable.
    }
  }

  // Execute batch update
  if (requests.length > 0) {
    const updateRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!updateRes.ok) {
      console.error(await updateRes.text());
      throw new Error('Failed to update Google Slides presentation');
    }
  }

  return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}
