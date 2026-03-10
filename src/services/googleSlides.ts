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
    
    // Create slide
    requests.push({
      createSlide: {
        objectId: slideObjectId,
        slideLayoutReference: {
          predefinedLayout: 'BLANK'
        }
      }
    });

    // Add Title
    const titleId = genId();
    requests.push({
      createShape: {
        objectId: titleId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideObjectId,
          size: { width: { magnitude: 600, unit: 'PT' }, height: { magnitude: 60, unit: 'PT' } },
          transform: { scaleX: 1, scaleY: 1, translateX: 50, translateY: 30, unit: 'PT' }
        }
      }
    });
    requests.push({
      insertText: {
        objectId: titleId,
        text: slide.title || 'Untitled',
      }
    });
    requests.push({
      updateTextStyle: {
        objectId: titleId,
        style: { fontSize: { magnitude: 32, unit: 'PT' }, bold: true },
        fields: 'fontSize,bold'
      }
    });

    // Add Content
    const contentArray = Array.isArray(slide.content) ? slide.content : (typeof slide.content === 'string' ? [slide.content] : []);
    if (contentArray.length > 0) {
      const contentId = genId();
      const contentText = contentArray.map(c => `• ${typeof c === 'string' ? c : JSON.stringify(c)}`).join('\n');
      
      let contentWidth = 600;
      let contentX = 50;

      if (slide.layout === 'image-right') {
        contentWidth = 300;
      } else if (slide.layout === 'image-left') {
        contentWidth = 300;
        contentX = 350;
      }

      requests.push({
        createShape: {
          objectId: contentId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideObjectId,
            size: { width: { magnitude: contentWidth, unit: 'PT' }, height: { magnitude: 300, unit: 'PT' } },
            transform: { scaleX: 1, scaleY: 1, translateX: contentX, translateY: 120, unit: 'PT' }
          }
        }
      });
      requests.push({
        insertText: {
          objectId: contentId,
          text: contentText,
        }
      });
      requests.push({
        updateTextStyle: {
          objectId: contentId,
          style: { fontSize: { magnitude: 18, unit: 'PT' } },
          fields: 'fontSize'
        }
      });
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
